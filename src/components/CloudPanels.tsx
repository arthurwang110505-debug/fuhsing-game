"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Crown,
  LogOut,
  Sparkles,
  Users,
  Copy,
} from "lucide-react";
import type {
  LeaderboardEntry,
  TeamInfo,
  TeamMemberInfo,
  TeamMissionLogEntry,
} from "@/types/game";
import {
  createTeam,
  fetchLeaderboard,
  joinTeamByCode,
  leaveTeam,
  loadMyTeam,
  loadTeamMembers,
  loadTeamMissionLog,
  signInWithEmail,
  signUpWithEmail,
  signOutCloud,
} from "@/lib/cloud";
import {
  formatDurationShort,
  isLikelyEmail,
  isValidJoinCode,
  normalizeJoinCode,
} from "@/lib/cloud-types";
import { SEED_MISSIONS } from "@/lib/seed-data";

const cardClass = "archive-card rounded-3xl p-6 sm:p-8 space-y-6";
const inputClass =
  "w-full rounded-xl border border-[#103FA0]/30 bg-[#EAF0FA] px-4 py-3 text-sm text-[#213155] placeholder:text-[#213155]/35 focus:border-[#103FA0] focus:outline-none";
const primaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3 text-sm font-bold text-[#213155] transition hover:bg-[#FFDD33]";
const secondaryButtonClass =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#213155]/20 bg-[#EAF0FA] px-6 py-3 text-sm font-medium text-[#213155]/85 hover:border-[#103FA0]";

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[#D21E14]/35 bg-[#D21E14]/8 px-3.5 py-2 text-xs text-[#B41810]">
      {message}
    </p>
  );
}

/* ============================= AUTH SCREEN ============================= */

export function AuthScreen({
  initialName,
  onBack,
  onSignedIn,
}: {
  initialName: string;
  onBack: () => void;
  onSignedIn: (displayName: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const displayName = name.trim();
    const mail = email.trim();
    if (!displayName) return setError("請填寫顯示名稱（隊友會看到這個名字）");
    if (!isLikelyEmail(mail)) return setError("請輸入有效的電子郵件");
    if (password.length < 6) return setError("密碼至少 6 個字元");
    setBusy(true);
    setError("");
    const signIn = await signInWithEmail(mail, password);
    if (signIn.ok) {
      setBusy(false);
      onSignedIn(displayName);
      return;
    }
    const signUp = await signUpWithEmail(mail, password, displayName);
    if (signUp.ok) {
      setBusy(false);
      onSignedIn(displayName);
      return;
    }
    setBusy(false);
    setError(signUp.error.includes("already registered") ? "此信箱已註冊，但密碼不正確" : signUp.error);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className={cardClass}>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#103FA0]">
            CLOUD EXPLORER ACCOUNT
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#213155]">
            雲端探索員登入
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#213155]/70">
            以電子郵件與密碼登入，進度即同步到雲端，換手機、換電腦都能繼續玩。
            若是第一次使用，輸入資料後按「註冊並登入」即可自動建立帳號（免email驗證）。
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-[#103FA0]">
            顯示名稱（隊友可見）
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="例如：八年仁班 小光"
              className={`${inputClass} mt-1.5`}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-[#103FA0]">
            電子郵件
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} mt-1.5`}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-[#103FA0]">
            密碼（至少 6 個字元）
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              placeholder="••••••"
              className={`${inputClass} mt-1.5`}
              required
            />
          </label>
          {error && <ErrorBox message={error} />}
          <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
            {busy ? "連線中…" : "註冊並登入"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
        <button type="button" onClick={onBack} className="w-full text-sm text-[#213155]/65 hover:text-[#103FA0]">
          返回（改用離線單機模式）
        </button>
      </div>
    </motion.section>
  );
}

/* ============================ TEAM LOBBY ============================ */

export function TeamLobbyScreen({
  displayName,
  onEnterTeam,
  onBack,
  onSignOut,
}: {
  displayName: string;
  onEnterTeam: (team: TeamInfo) => void;
  onBack: () => void;
  onSignOut: () => void;
}) {
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [missionLog, setMissionLog] = useState<TeamMissionLogEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const refreshTeam = useCallback(async (info: TeamInfo) => {
    const [memberRes, logRes] = await Promise.all([
      loadTeamMembers(info.id),
      loadTeamMissionLog(info.id),
    ]);
    if (memberRes.ok) setMembers(memberRes.data);
    if (logRes.ok) setMissionLog(logRes.data);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [teamRes, boardRes] = await Promise.all([loadMyTeam(), fetchLeaderboard()]);
      if (!alive) return;
      if (teamRes.ok && teamRes.data) {
        setTeam(teamRes.data);
        await refreshTeam(teamRes.data);
      }
      if (boardRes.ok) setLeaderboard(boardRes.data);
    })();
    return () => {
      alive = false;
    };
  }, [refreshTeam]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = teamNameInput.trim();
    if (!name) return setError("請輸入隊名");
    setBusy(true);
    setError("");
    const result = await createTeam(name, displayName);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setTeam(result.data);
    await refreshTeam(result.data);
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidJoinCode(codeInput)) return setError("隊伍代碼為 6 碼（A–Z、2–9）");
    setBusy(true);
    setError("");
    const result = await joinTeamByCode(codeInput, displayName);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setTeam(result.data);
    await refreshTeam(result.data);
  };

  const handleLeave = async () => {
    if (!team) return;
    setBusy(true);
    await leaveTeam(team.id);
    setTeam(null);
    setMembers([]);
    setMissionLog([]);
    setBusy(false);
  };

  const handleCopyCode = async () => {
    if (!team) return;
    try {
      await navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#103FA0]">
              TEAM LOBBY・組隊大廳
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#213155]">
              {team ? `隊伍「${team.name}」` : "建立或加入隊伍"}
            </h2>
            <p className="mt-1 text-xs text-[#213155]/70">
              玩家：{displayName}・隊伍成員共同解謎、即時同步進度與總分
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#213155]/15 bg-[#EAF0FA] px-3.5 text-xs text-[#213155]/80 hover:border-[#103FA0]"
          >
            <LogOut className="h-3.5 w-3.5" /> 登出雲端帳號
          </button>
        </div>

        {!team && (
          <div className="grid gap-5 sm:grid-cols-2">
            <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#213155]">
                <Sparkles className="h-4 w-4 text-[#103FA0]" /> 建立新隊伍
              </h3>
              <input
                type="text"
                value={teamNameInput}
                onChange={(event) => setTeamNameInput(event.target.value)}
                maxLength={40}
                placeholder="隊名，例如：火炬先鋒隊"
                className={inputClass}
              />
              <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                建立隊伍
              </button>
            </form>
            <form onSubmit={handleJoin} className="space-y-3 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#213155]">
                <Users className="h-4 w-4 text-[#103FA0]" /> 以代碼加入隊伍
              </h3>
              <input
                type="text"
                value={codeInput}
                onChange={(event) => setCodeInput(normalizeJoinCode(event.target.value))}
                maxLength={6}
                placeholder="6 碼隊伍代碼"
                className={`${inputClass} font-mono uppercase tracking-[0.3em]`}
              />
              <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
                加入隊伍
              </button>
            </form>
          </div>
        )}

        {team && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#E3B505] bg-[#F9CF00]/15 p-5">
              <p className="text-xs font-semibold text-[#103FA0]">邀請隊友用的隊伍代碼</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-mono text-4xl font-bold tracking-[0.35em] text-[#213155]">
                  {team.joinCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#213155]/25 bg-white/70 px-3.5 text-xs font-semibold text-[#213155] hover:border-[#103FA0]"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? "已複製！" : "複製代碼"}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#213155]/70">
                隊友在「組隊遊玩」模式輸入此代碼即可加入；八道任務由全隊共同完成。
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#213155]">
                <Users className="h-4 w-4 text-[#103FA0]" /> 隊員（{members.length}）
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2.5 rounded-xl border border-[#213155]/12 bg-[#EAF0FA] px-3.5 py-2.5"
                  >
                    {member.role === "leader" ? (
                      <Crown className="h-4 w-4 shrink-0 text-[#E3B505]" />
                    ) : (
                      <Users className="h-4 w-4 shrink-0 text-[#103FA0]" />
                    )}
                    <span className="truncate text-sm text-[#213155]">{member.displayName}</span>
                    {member.role === "leader" && (
                      <span className="ml-auto shrink-0 rounded-full bg-[#F9CF00]/25 px-2 py-0.5 text-[10px] font-semibold text-[#103FA0]">
                        隊長
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#213155]">
                <CheckCircle2 className="h-4 w-4 text-[#008250]" /> 團隊任務進度（{missionLog.length}/8）
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SEED_MISSIONS.map((mission) => {
                  const log = missionLog.find((entry) => entry.missionId === mission.id);
                  return (
                    <div
                      key={mission.id}
                      className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                        log
                          ? "border-[#008250]/35 bg-[#008250]/8"
                          : "border-[#213155]/12 bg-[#EAF0FA]/60"
                      }`}
                    >
                      <span className="font-mono font-bold text-[#103FA0]">{mission.code}</span>
                      <span className="ml-2 font-semibold text-[#213155]">{mission.title}</span>
                      <p className="mt-0.5 text-[#213155]/65">
                        {log ? `由 ${log.solvedByName} 解開` : "尚未解開"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => onEnterTeam(team)}
                className={`${primaryButtonClass} flex-1`}
              >
                進入團隊探索
                <ArrowRight className="h-5 w-5" />
              </button>
              <button type="button" onClick={handleLeave} disabled={busy} className={secondaryButtonClass}>
                <LogOut className="h-4 w-4" /> 離開隊伍
              </button>
            </div>
          </div>
        )}

        {error && <ErrorBox message={error} />}

        <button type="button" onClick={onBack} className="w-full text-sm text-[#213155]/65 hover:text-[#103FA0]">
          返回模式選擇
        </button>
      </div>

      <div className="archive-card rounded-3xl p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#213155]">
          <Cloud className="h-4 w-4 text-[#103FA0]" /> 團隊排行榜（依分數、再依完成時間）
        </h3>
        {leaderboard.length === 0 ? (
          <p className="mt-3 text-xs text-[#213155]/60">還沒有隊伍上榜，快來當第一隊！</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {leaderboard.map((entry, index) => (
              <li
                key={entry.teamId}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                  entry.teamId === team?.id
                    ? "border-[#E3B505] bg-[#F9CF00]/12"
                    : "border-[#213155]/12 bg-[#EAF0FA]/60"
                }`}
              >
                <span className="w-7 shrink-0 font-mono font-bold text-[#103FA0]">#{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-[#213155]">
                  {entry.teamName}
                </span>
                <span className="shrink-0 text-xs text-[#213155]/65">{entry.memberCount} 人</span>
                <span className="shrink-0 text-xs text-[#213155]/65">
                  {entry.completedCount}/8 關
                </span>
                <span className="shrink-0 font-mono text-xs text-[#008250]">
                  {entry.score} 分
                </span>
                <span className="shrink-0 font-mono text-xs text-[#213155]/65">
                  {formatDurationShort(entry.elapsedSeconds)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </motion.section>
  );
}
