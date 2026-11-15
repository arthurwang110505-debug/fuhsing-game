import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSolvedDetails,
  isLikelyEmail,
  isValidJoinCode,
  mergeTeamProgress,
  normalizeJoinCode,
  sessionToSaveState,
  soloRowToHydrated,
  teamRowToHydrated,
  type SaveStateRow,
} from "../src/lib/cloud-types";
import type { GameSession } from "../src/types/game";

function baseSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: "s1",
    mode: "solo",
    playerName: "小光",
    startedAt: "2026-11-14T10:00:00.000Z",
    completedAt: null,
    elapsedSeconds: 0,
    score: 0,
    completedMissions: [],
    fragmentsCollected: [],
    hintsUsed: {},
    attemptsLog: {},
    finalSolved: false,
    ...overrides,
  };
}

function rowFromSession(session: GameSession, elapsed: number): SaveStateRow {
  const payload = sessionToSaveState(session, elapsed);
  return {
    player_name: payload.playerName,
    completed_missions: payload.completedMissions,
    score: payload.score,
    elapsed_seconds: payload.elapsedSeconds,
    hints_used: payload.hintsUsed,
    attempts_log: payload.attemptsLog,
    fragments_collected: payload.fragmentsCollected,
    final_solved: payload.finalSolved,
    started_at: payload.startedAt,
    completed_at: payload.completedAt,
    updated_at: payload.updatedAt,
  };
}

test("join codes are normalised and validated against the safe alphabet", () => {
  assert.equal(normalizeJoinCode(" ab-12c "), "AB12C");
  assert.equal(normalizeJoinCode("ab12c"), "AB12C");
  assert.equal(normalizeJoinCode("toolongcode"), "TOOLON");
  assert.equal(isValidJoinCode("AB23JK"), true);
  assert.equal(isValidJoinCode("AB23JL"), false, "L is excluded from the alphabet");
  assert.equal(isValidJoinCode("AB23J"), false, "too short");
  assert.equal(isValidJoinCode("AB23JKZ"), false, "too long");
});

test("email shape check", () => {
  assert.equal(isLikelyEmail("player@example.com"), true);
  assert.equal(isLikelyEmail("not-an-email"), false);
  assert.equal(isLikelyEmail("a@b"), false);
});

test("session survives a cloud save round trip", () => {
  const session = baseSession({
    completedMissions: [2, 1],
    score: 20,
    hintsUsed: { "2": 1 },
    attemptsLog: { "2": 3 },
    fragmentsCollected: ["鐘聲餘韻"],
  });
  const row = rowFromSession(session, 125);
  const hydrated = soloRowToHydrated(row, "user-1", "cloud-save");
  assert.equal(hydrated.session.mode, "solo");
  assert.equal(hydrated.session.playerName, "小光");
  assert.deepEqual(hydrated.session.completedMissions, [1, 2], "sorted on save");
  assert.equal(hydrated.session.score, 20);
  assert.deepEqual(hydrated.session.hintsUsed, { "2": 1 });
  assert.equal(hydrated.elapsedSeconds, 125);
  assert.deepEqual(Object.keys(hydrated.solvedDetails).sort(), ["1", "2"]);
});

test("team hydration carries the team identity", () => {
  const session = baseSession({ completedMissions: [1] });
  const row = rowFromSession(session, 30);
  const hydrated = teamRowToHydrated(row, {
    id: "team-9",
    name: "火炬先鋒隊",
    joinCode: "AB23JK",
    createdBy: "user-1",
    createdAt: "2026-11-14T10:00:00.000Z",
  }, "team-team-9");
  assert.equal(hydrated.session.mode, "team");
  assert.equal(hydrated.session.teamId, "team-9");
  assert.equal(hydrated.session.playerName, "火炬先鋒隊");
});

test("mergeTeamProgress unions progress and keeps the longest time", () => {
  const local = baseSession({
    completedMissions: [1, 3],
    score: 20,
    finalSolved: false,
    attemptsLog: { "3": 2 },
  });
  const remote: SaveStateRow = {
    player_name: "火炬先鋒隊",
    completed_missions: [2, 3],
    score: 30,
    elapsed_seconds: 500,
    hints_used: { "2": 1 },
    attempts_log: {},
    fragments_collected: ["紅磚晨光"],
    final_solved: true,
    started_at: "2026-11-14T10:00:00.000Z",
    completed_at: "2026-11-14T11:00:00.000Z",
    updated_at: "2026-11-14T11:00:00.000Z",
  };
  const merged = mergeTeamProgress(local, remote, 400);
  assert.deepEqual(merged.session.completedMissions, [1, 2, 3]);
  assert.equal(merged.session.score, 30);
  assert.equal(merged.elapsedSeconds, 500);
  assert.equal(merged.session.finalSolved, true);
  assert.deepEqual(merged.session.attemptsLog, { "3": 2 });
  assert.deepEqual(merged.session.hintsUsed, { "2": 1 });
  assert.deepEqual(merged.session.fragmentsCollected, ["紅磚晨光"]);
});

test("solved details rebuild for every completed mission only", () => {
  const details = buildSolvedDetails([1, 4, 99]);
  assert.deepEqual(Object.keys(details).sort(), ["1", "4"]);
  assert.ok(details[1].explanation.length > 0);
  assert.ok(details[4].fragmentName.length > 0);
});
