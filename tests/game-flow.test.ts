import test from "node:test";
import assert from "node:assert/strict";
import { SEED_MISSIONS, FINAL_PUZZLE_DATA } from "../src/lib/seed-data";
import {
  computeHintPenalty,
  computeTotalScore,
  computeUnlockedMissionIds,
  gradeFinalSeal,
  gradeMissionAnswer,
} from "../src/lib/game-engine";

test("local seed contains all eight missions and both hints", () => {
  assert.deepEqual(SEED_MISSIONS.map((mission) => mission.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const mission of SEED_MISSIONS) {
    assert.ok(mission.hint1.trim());
    assert.ok(mission.hint2.trim());
  }
});

test("each mission accepts its seeded answer and rejects an empty answer", () => {
  for (const mission of SEED_MISSIONS) {
    assert.equal(gradeMissionAnswer(mission, mission.correctAnswer).isCorrect, true, mission.title);
    assert.equal(gradeMissionAnswer(mission, null).isCorrect, false, mission.title);
  }
});

test("all mission puzzles are answerable without image assets", () => {
  const serializedMissions = JSON.stringify(SEED_MISSIONS);
  assert.doesNotMatch(serializedMissions, /image-recognition|imageUrl|campus-decoy/);
  assert.equal(SEED_MISSIONS[0].puzzleType, "evidence-grid");
  assert.equal(SEED_MISSIONS[4].puzzleType, "map-matching");
  assert.equal(
    gradeMissionAnswer(SEED_MISSIONS[0], { q1: "q1a" }).isCorrect,
    false,
    "partial evidence audit must not pass"
  );
});

test("hard mode expands every mission into a multi-step challenge", () => {
  const payload = (missionId: number) => SEED_MISSIONS[missionId - 1].puzzlePayload;
  assert.equal((payload(1).questions as unknown[]).length, 4);
  assert.equal((payload(3).leftItems as unknown[]).length, 6);
  assert.equal((payload(4).items as unknown[]).length, 8);
  assert.equal((payload(5).leftItems as unknown[]).length, 6);
  assert.equal((payload(6).items as unknown[]).length, 5);
  assert.equal((payload(7).scenarios as unknown[]).length, 8);
  assert.equal(Object.keys(SEED_MISSIONS[7].correctAnswer as object).length, 9);
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

test("hint usage deducts points from completed missions only", () => {
  // 每階提示 −2 分
  assert.equal(computeTotalScore([1, 2], false, { "1": 1 }), 18);
  assert.equal(computeTotalScore([1, 2], false, { "1": 2 }), 16);
  // 未完成關卡的提示不扣分
  assert.equal(computeTotalScore([1], false, { "2": 2 }), 10);
  // 全破＋兩關各用兩階提示：100 − 8
  assert.equal(computeTotalScore([1, 2, 3, 4, 5, 6, 7, 8], true, { "1": 2, "3": 2 }), 92);
  // 分數不會低於 0
  assert.equal(computeTotalScore([1], false, { "1": 2, "2": 2 }), 6);
  assert.equal(computeHintPenalty([1, 2], { "1": 2, "3": 1 }), 4);
});
