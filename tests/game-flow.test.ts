import test from "node:test";
import assert from "node:assert/strict";
import { SEED_MISSIONS, FINAL_PUZZLE_DATA } from "../src/lib/seed-data";
import {
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

test("mission eight and the finale follow the complete local progression", () => {
  assert.equal(computeUnlockedMissionIds(SEED_MISSIONS, []).includes(8), false);
  assert.equal(computeUnlockedMissionIds(SEED_MISSIONS, [1, 2, 3, 4, 5, 6, 7]).includes(8), true);
  assert.equal(gradeFinalSeal(FINAL_PUZZLE_DATA.correctOrder).isCorrect, true);
  assert.equal(gradeFinalSeal([...FINAL_PUZZLE_DATA.correctOrder].reverse()).isCorrect, false);
  assert.equal(computeTotalScore([1, 2, 3, 4, 5, 6, 7, 8], true), 100);
});
