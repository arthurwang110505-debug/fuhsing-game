import test from "node:test";
import assert from "node:assert/strict";
import { SEED_MISSIONS, FINAL_PUZZLE_DATA } from "../src/lib/seed-data";

// The pure game rules only need a lazy Pool instance; no database connection is opened here.
process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.ADMIN_PASSCODE ??= "test-passcode";
process.env.ADMIN_TOKEN_SECRET ??= "test-secret-for-unit-tests";
const enginePromise = import("../src/lib/game-engine");

test("seed bank contains all eight complete missions and two useful hints each", async () => {
  const engine = await enginePromise;
  assert.deepEqual(SEED_MISSIONS.map((m) => m.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const mission of SEED_MISSIONS) {
    assert.ok(mission.hint1.trim(), `mission ${mission.id} is missing hint 1`);
    assert.ok(mission.hint2.trim(), `mission ${mission.id} is missing hint 2`);
    const publicMission = engine.sanitizeMissionForPlayer(mission as never);
    assert.equal(publicMission.hint1, "");
    assert.equal(publicMission.hint2, "");
  }
});

test("all eight seeded answers solve and plausible wrong input does not", async () => {
  const engine = await enginePromise;
  for (const mission of SEED_MISSIONS) {
    const right = engine.gradeMissionAnswer(mission as never, mission.correctAnswer);
    assert.equal(right.isCorrect, true, `mission ${mission.id}: ${right.feedback}`);
    const wrong = engine.gradeMissionAnswer(mission as never, null);
    assert.equal(wrong.isCorrect, false, `mission ${mission.id} accepted an empty answer`);
  }
});

test("mission eight remains locked until the first seven are completed", async () => {
  const engine = await enginePromise;
  const settings = { id: 1, historyMuseumOpen: true, forceUnlockAll: false, updatedAt: new Date() };
  assert.ok(!engine.computeUnlockedMissionIds(SEED_MISSIONS as never, [], settings).includes(8));
  assert.ok(engine.computeUnlockedMissionIds(SEED_MISSIONS as never, [1, 2, 3, 4, 5, 6, 7], settings).includes(8));
});

test("final puzzle accepts only its canonical sequence", async () => {
  const engine = await enginePromise;
  assert.equal(engine.gradeFinalSeal(FINAL_PUZZLE_DATA.correctOrder).isCorrect, true);
  assert.equal(engine.gradeFinalSeal([...FINAL_PUZZLE_DATA.correctOrder].reverse()).isCorrect, false);
});
