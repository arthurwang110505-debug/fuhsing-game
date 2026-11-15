import type {
  GameSession,
  LeaderboardEntry,
  TeamInfo,
  TeamMemberInfo,
  TeamMissionLogEntry,
} from "@/types/game";
import {
  leaderboardFromRow,
  normalizeJoinCode,
  type LeaderboardRow,
  type SaveStatePayload,
  type SaveStateRow,
  type TeamMemberRow,
  type TeamMissionLogRow,
  type TeamRow,
  sessionToSaveState,
  teamInfoFromRow,
  teamLogFromRow,
  teamMemberFromRow,
} from "./cloud-types";
import { getSupabase } from "./supabase";

export type CloudResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail<T>(error: unknown): CloudResult<T> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

// ---------- auth ----------

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<CloudResult<string>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return fail(error);
    const userId = data.user?.id;
    if (!userId) return { ok: false, error: "註冊未完成，請稍後再試" };
    await ensureProfile(displayName);
    return { ok: true, data: userId };
  } catch (error) {
    return fail(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<CloudResult<string>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(error);
    return { ok: true, data: data.user.id };
  } catch (error) {
    return fail(error);
  }
}

export async function signOutCloud(): Promise<void> {
  await getSupabase()?.auth.signOut().catch(() => undefined);
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function onAuthStateChange(callback: (userId: string | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function ensureProfile(displayName: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName.slice(0, 40) }, { onConflict: "id" });
}

// ---------- solo cloud save ----------

export async function loadSoloSave(): Promise<CloudResult<SaveStateRow | null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase
      .from("solo_saves")
      .select("*")
      .maybeSingle();
    if (error) return fail(error);
    return { ok: true, data: (data as SaveStateRow | null) ?? null };
  } catch (error) {
    return fail(error);
  }
}

export async function saveSolo(session: GameSession, elapsedSeconds: number): Promise<CloudResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { ok: false, error: "尚未登入" };
  const payload: SaveStatePayload = sessionToSaveState(session, elapsedSeconds);
  try {
    const { error } = await supabase.from("solo_saves").upsert(
      {
        user_id: userId,
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
      },
      { onConflict: "user_id" }
    );
    if (error) return fail(error);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

// ---------- teams ----------

export async function createTeam(
  teamName: string,
  displayName: string
): Promise<CloudResult<TeamInfo>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase.rpc("create_team", {
      p_name: teamName,
      p_display_name: displayName,
    });
    if (error) return fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as TeamRow | undefined;
    if (!row) return { ok: false, error: "建立隊伍失敗" };
    await ensureProfile(displayName);
    return { ok: true, data: teamInfoFromRow(row) };
  } catch (error) {
    return fail(error);
  }
}

export async function joinTeamByCode(
  code: string,
  displayName: string
): Promise<CloudResult<TeamInfo>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase.rpc("join_team_by_code", {
      p_code: normalizeJoinCode(code),
      p_display_name: displayName,
    });
    if (error) {
      if (/INVALID_JOIN_CODE/i.test(error.message)) return { ok: false, error: "查無此隊伍代碼，請確認後再試" };
      return fail(error);
    }
    const row = (Array.isArray(data) ? data[0] : data) as TeamRow | undefined;
    if (!row) return { ok: false, error: "加入隊伍失敗" };
    return { ok: true, data: teamInfoFromRow(row) };
  } catch (error) {
    return fail(error);
  }
}

export async function leaveTeam(teamId: string): Promise<CloudResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { error } = await supabase.rpc("leave_team", { p_team_id: teamId });
    if (error) return fail(error);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

/** The team the current user belongs to (most recently joined), if any. */
export async function loadMyTeam(): Promise<CloudResult<TeamInfo | null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("team_id, joined_at, teams(*)")
      .order("joined_at", { ascending: false })
      .limit(1);
    if (error) return fail(error);
    const first = (data ?? [])[
      0
    ] as unknown as { teams: TeamRow | TeamRow[] | null } | undefined;
    const teamRow = first?.teams
      ? Array.isArray(first.teams)
        ? first.teams[0]
        : first.teams
      : null;
    return { ok: true, data: teamRow ? teamInfoFromRow(teamRow) : null };
  } catch (error) {
    return fail(error);
  }
}

export async function loadTeamMembers(teamId: string): Promise<CloudResult<TeamMemberInfo[]>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });
    if (error) return fail(error);
    return { ok: true, data: ((data ?? []) as TeamMemberRow[]).map(teamMemberFromRow) };
  } catch (error) {
    return fail(error);
  }
}

export async function loadTeamMissionLog(teamId: string): Promise<CloudResult<TeamMissionLogEntry[]>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase
      .from("team_mission_log")
      .select("*")
      .eq("team_id", teamId)
      .order("solved_at", { ascending: true });
    if (error) return fail(error);
    return { ok: true, data: ((data ?? []) as TeamMissionLogRow[]).map(teamLogFromRow) };
  } catch (error) {
    return fail(error);
  }
}

export async function loadTeamSessionRow(teamId: string): Promise<CloudResult<SaveStateRow | null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase
      .from("team_sessions")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();
    if (error) return fail(error);
    return { ok: true, data: (data as SaveStateRow | null) ?? null };
  } catch (error) {
    return fail(error);
  }
}

export async function saveTeamSession(
  teamId: string,
  session: GameSession,
  elapsedSeconds: number
): Promise<CloudResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  const payload = sessionToSaveState(session, elapsedSeconds);
  try {
    const { error } = await supabase.from("team_sessions").upsert(
      {
        team_id: teamId,
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
      },
      { onConflict: "team_id" }
    );
    if (error) return fail(error);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export async function logTeamMission(
  teamId: string,
  missionId: number,
  solvedByName: string
): Promise<CloudResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { ok: false, error: "尚未登入" };
  try {
    const { error } = await supabase.from("team_mission_log").upsert(
      {
        team_id: teamId,
        mission_id: missionId,
        solved_by: userId,
        solved_by_name: solvedByName.slice(0, 40),
      },
      { onConflict: "team_id,mission_id" }
    );
    if (error) return fail(error);
    return { ok: true, data: null };
  } catch (error) {
    return fail(error);
  }
}

export async function fetchLeaderboard(): Promise<CloudResult<LeaderboardEntry[]>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "雲端服務未啟用" };
  try {
    const { data, error } = await supabase.rpc("team_leaderboard");
    if (error) return fail(error);
    return {
      ok: true,
      data: ((data ?? []) as LeaderboardRow[]).map(leaderboardFromRow),
    };
  } catch (error) {
    return fail(error);
  }
}

/** Live team sync: team session updates + member joins. Returns an unsubscribe fn. */
export function subscribeTeamEvents(
  teamId: string,
  handlers: {
    onSessionRow?: (row: SaveStateRow) => void;
    onMembersChanged?: () => void;
  }
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel(`team-${teamId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "team_sessions", filter: `team_id=eq.${teamId}` },
      (payload) => {
        if (payload.new && typeof payload.new === "object" && "team_id" in payload.new) {
          handlers.onSessionRow?.(payload.new as unknown as SaveStateRow);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "team_members", filter: `team_id=eq.${teamId}` },
      () => handlers.onMembersChanged?.()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
