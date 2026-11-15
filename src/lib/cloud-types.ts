import type {
  GameSession,
  LeaderboardEntry,
  SolvedMissionDetail,
  TeamInfo,
  TeamMemberInfo,
  TeamMissionLogEntry,
} from "@/types/game";
import { extractSolvedDetail } from "./game-engine";
import { SEED_MISSIONS } from "./seed-data";

/** Pure row<->state mappers for the Supabase cloud layer. Kept free of I/O so they can be unit-tested. */

export interface SaveStateRow {
  player_name: string;
  completed_missions: number[];
  score: number;
  elapsed_seconds: number;
  hints_used: Record<string, number>;
  attempts_log: Record<string, number>;
  fragments_collected: string[];
  final_solved: boolean;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: string;
}

export interface TeamMemberRow {
  team_id: string;
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface TeamMissionLogRow {
  team_id: string;
  mission_id: number;
  solved_by: string;
  solved_by_name: string;
  solved_at: string;
}

export interface LeaderboardRow {
  team_id: string;
  team_name: string;
  score: number;
  completed_count: number;
  elapsed_seconds: number;
  final_solved: boolean;
  member_count: number;
  updated_at: string;
}

/** Join codes: 6 chars, uppercase, no ambiguous 0/O/1/I/L. */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function isValidJoinCode(input: string): boolean {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length === 6 && [...code].every((ch) => JOIN_CODE_ALPHABET.includes(ch));
}

export function isLikelyEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}

export function formatDurationShort(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function teamInfoFromRow(row: TeamRow): TeamInfo {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function teamMemberFromRow(row: TeamMemberRow): TeamMemberInfo {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role === "leader" ? "leader" : "member",
    joinedAt: row.joined_at,
  };
}

export function teamLogFromRow(row: TeamMissionLogRow): TeamMissionLogEntry {
  return {
    missionId: row.mission_id,
    solvedBy: row.solved_by,
    solvedByName: row.solved_by_name,
    solvedAt: row.solved_at,
  };
}

export function leaderboardFromRow(row: LeaderboardRow): LeaderboardEntry {
  return {
    teamId: row.team_id,
    teamName: row.team_name,
    score: row.score,
    completedCount: row.completed_count,
    elapsedSeconds: row.elapsed_seconds,
    finalSolved: row.final_solved,
    memberCount: row.member_count,
  };
}

/** Rebuild the per-mission solved details (explanations/fragments) from a completed id list. */
export function buildSolvedDetails(completedMissions: number[]): Record<number, SolvedMissionDetail> {
  const details: Record<number, SolvedMissionDetail> = {};
  for (const id of completedMissions) {
    const source = SEED_MISSIONS.find((mission) => mission.id === id);
    if (source) details[id] = extractSolvedDetail(source);
  }
  return details;
}

export interface HydratedGame {
  session: GameSession;
  solvedDetails: Record<number, SolvedMissionDetail>;
  elapsedSeconds: number;
}

function coerceNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}

function coerceStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function coerceRecord(value: unknown): Record<string, number> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, number> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === "number") out[key] = val;
    }
    return out;
  }
  return {};
}

export function soloRowToHydrated(
  row: SaveStateRow,
  userId: string,
  saveId: string
): HydratedGame {
  const completedMissions = coerceNumberArray(row.completed_missions);
  return {
    session: {
      id: saveId,
      mode: "solo",
      playerName: row.player_name || "探索員",
      startedAt: row.started_at ?? new Date().toISOString(),
      completedAt: row.completed_at,
      elapsedSeconds: row.elapsed_seconds,
      score: row.score,
      completedMissions,
      fragmentsCollected: coerceStringArray(row.fragments_collected),
      hintsUsed: coerceRecord(row.hints_used),
      attemptsLog: coerceRecord(row.attempts_log),
      finalSolved: Boolean(row.final_solved),
    },
    solvedDetails: buildSolvedDetails(completedMissions),
    elapsedSeconds: Math.max(0, row.elapsed_seconds),
  };
}

export function teamRowToHydrated(
  row: SaveStateRow,
  team: TeamInfo,
  saveId: string
): HydratedGame {
  const hydrated = soloRowToHydrated(row, team.id, saveId);
  return {
    ...hydrated,
    session: {
      ...hydrated.session,
      mode: "team",
      teamId: team.id,
      playerName: team.name,
    },
  };
}

export interface SaveStatePayload {
  playerName: string;
  completedMissions: number[];
  score: number;
  elapsedSeconds: number;
  hintsUsed: Record<string, number>;
  attemptsLog: Record<string, number>;
  fragmentsCollected: string[];
  finalSolved: boolean;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export function sessionToSaveState(
  session: GameSession,
  elapsedSeconds: number
): SaveStatePayload {
  return {
    playerName: session.playerName,
    completedMissions: [...new Set(session.completedMissions)].sort((a, b) => a - b),
    score: session.score,
    elapsedSeconds,
    hintsUsed: session.hintsUsed ?? {},
    attemptsLog: session.attemptsLog ?? {},
    fragmentsCollected: session.fragmentsCollected ?? [],
    finalSolved: session.finalSolved,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    updatedAt: new Date().toISOString(),
  };
}

/** Merge a remote team row into the local session, keeping the freshest progress. */
export function mergeTeamProgress(
  local: GameSession,
  remote: SaveStateRow,
  localElapsed: number
): { session: GameSession; elapsedSeconds: number } {
  const remoteCompleted = new Set(coerceNumberArray(remote.completed_missions));
  const mergedCompleted = [...new Set([...local.completedMissions, ...remoteCompleted])]
    .filter((id) => id >= 1 && id <= 8)
    .sort((a, b) => a - b);
  return {
    session: {
      ...local,
      completedMissions: mergedCompleted,
      score: Math.max(local.score, remote.score),
      hintsUsed: { ...coerceRecord(remote.hints_used), ...local.hintsUsed },
      attemptsLog: { ...coerceRecord(remote.attempts_log), ...local.attemptsLog },
      fragmentsCollected: [
        ...new Set([...coerceStringArray(remote.fragments_collected), ...(local.fragmentsCollected ?? [])]),
      ],
      finalSolved: local.finalSolved || Boolean(remote.final_solved),
      completedAt: local.completedAt ?? remote.completed_at,
    },
    elapsedSeconds: Math.max(localElapsed, Math.max(0, remote.elapsed_seconds)),
  };
}
