import test from "node:test";
import assert from "node:assert/strict";
import { SEED_MISSIONS, FINAL_PUZZLE_DATA } from "../src/lib/seed-data";
import {
  computeHintPenalty,
  computeTotalScore,
  computeUnlockedMissionIds,
  deriveEvidenceLock,
  getHintText,
  gradeFinalSeal,
  gradeMissionAnswer,
} from "../src/lib/game-engine";

test("local seed contains all eight hard-mode missions and three hints each", () => {
  assert.deepEqual(SEED_MISSIONS.map((mission) => mission.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const mission of SEED_MISSIONS) {
    assert.ok(mission.hint1.trim(), mission.title);
    assert.ok(mission.hint2.trim(), mission.title);
    assert.ok(mission.hint3.trim(), mission.title);
    for (const stage of [1, 2, 3] as const) {
      assert.ok(getHintText(mission, stage).trim(), `${mission.title} hint ${stage}`);
    }
  }
});

test("each mission accepts its seeded answer and rejects an empty answer", () => {
  for (const mission of SEED_MISSIONS) {
    assert.equal(gradeMissionAnswer(mission, mission.correctAnswer).isCorrect, true, mission.title);
    assert.equal(gradeMissionAnswer(mission, null).isCorrect, false, mission.title);
    assert.equal(gradeMissionAnswer(mission, {}).isCorrect, false, mission.title);
  }
});

test("all mission puzzles are answerable without image assets", () => {
  const serializedMissions = JSON.stringify(SEED_MISSIONS);
  assert.doesNotMatch(serializedMissions, /image-recognition|imageUrl|campus-decoy/);
  assert.equal(SEED_MISSIONS[0].puzzleType, "evidence-classify");
  assert.equal(
    gradeMissionAnswer(SEED_MISSIONS[0], { placement: { k1: "confirmed" }, lock: "時光的邀請" }).isCorrect,
    false,
    "partial evidence audit must not pass"
  );
});

test("hard mode gives every mission a distinct multi-step challenge", () => {
  const types = SEED_MISSIONS.map((mission) => mission.puzzleType);
  assert.equal(new Set(types).size, types.length, "each mission must use its own puzzle type");

  const payload = (missionId: number) => SEED_MISSIONS[missionId - 1].puzzlePayload;
  assert.equal((payload(1).cards as unknown[]).length, 7);
  assert.equal((payload(1).columns as unknown[]).length, 3);
  assert.equal((payload(2).slots as unknown[]).length, 4);
  assert.equal((payload(2).lines as unknown[]).length, 8);
  assert.equal((payload(3).leftItems as unknown[]).length, 6);
  assert.equal((payload(3).rightItems as unknown[]).length, 6);
  assert.equal((payload(4).items as unknown[]).length, 8);
  assert.equal((payload(5).components as unknown[]).length, 6);
  assert.equal((payload(5).meanings as unknown[]).length, 6);
  assert.equal((payload(6).nodes as unknown[]).length, 4);
  assert.equal((payload(6).questions as unknown[]).length, 3);
  assert.equal((payload(7).records as unknown[]).length, 8);
  assert.equal((payload(7).offices as unknown[]).length, 4);
  assert.equal((payload(8).checks as unknown[]).length, 4);
  assert.equal(FINAL_PUZZLE_DATA.shuffledLines.length, 8);
  assert.equal(FINAL_PUZZLE_DATA.correctOrder.length, 8);
});

test("mission eight and the finale follow the complete local progression", () => {
  assert.equal(computeUnlockedMissionIds(SEED_MISSIONS, []).includes(8), false);
  assert.equal(computeUnlockedMissionIds(SEED_MISSIONS, [1, 2, 3, 4, 5, 6, 7]).includes(8), true);
  assert.equal(gradeFinalSeal(FINAL_PUZZLE_DATA.correctOrder).isCorrect, true);
  assert.equal(gradeFinalSeal([...FINAL_PUZZLE_DATA.correctOrder].reverse()).isCorrect, false);
  assert.equal(computeTotalScore([1, 2, 3, 4, 5, 6, 7, 8], true), 100);
});

test("hint usage deducts one point per stage from completed missions only", () => {
  // 每階提示 −1 分，每關最多三階
  assert.equal(computeTotalScore([1, 2], false, { "1": 1 }), 19);
  assert.equal(computeTotalScore([1, 2], false, { "1": 2 }), 18);
  assert.equal(computeTotalScore([1, 2], false, { "1": 3 }), 17);
  // 超過三階的紀錄會被忽略
  assert.equal(computeTotalScore([1, 2], false, { "1": 9 }), 17);
  // 未完成關卡的提示不扣分
  assert.equal(computeTotalScore([1], false, { "2": 3 }), 10);
  // 全破＋兩關各用三階提示：100 − 6
  assert.equal(computeTotalScore([1, 2, 3, 4, 5, 6, 7, 8], true, { "1": 3, "3": 3 }), 94);
  // 分數不會低於 0
  assert.equal(computeTotalScore([1], false, { "1": 3, "2": 3 }), 7);
  assert.equal(computeHintPenalty([1, 2], { "1": 3, "3": 1 }), 3);
});

test("evidence lock is derived from the seeded cards instead of a duplicated literal", () => {
  assert.equal(deriveEvidenceLock(SEED_MISSIONS[0]), "時光的邀請");
});
