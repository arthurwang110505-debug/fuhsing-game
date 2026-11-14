"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  FinalPuzzleMeta,
  GameScreen,
  GameSession,
  GameSettings,
  OfficialSourceItem,
  PlayMode,
  PublicMission,
  SolvedMissionDetail,
  TeamInfo,
} from "@/types/game";
import CampusMapSVG from "./CampusMapSVG";
import PuzzlePlayfield from "./PuzzlePlayfield";
import MissionCompleteModal, { FragmentSymbolIcon } from "./MissionCompleteModal";
import { EndingScreenView, FinalPuzzleView } from "./FinalPuzzleAndEnding";
import { AuthScreen, TeamLobbyScreen } from "./CloudPanels";
import { FINAL_PUZZLE_DATA, OFFICIAL_SOURCES, SEED_MISSIONS } from "@/lib/seed-data";
import {
  computeTotalScore,
  computeUnlockedMissionIds,
  extractSolvedDetail,
  getLocalMissions,
  getLocalSettings,
  gradeFinalSeal,
  gradeMissionAnswer,
} from "@/lib/game-engine";
import {
  buildSolvedDetails,
  mergeTeamProgress,
  soloRowToHydrated,
  teamRowToHydrated,
} from "@/lib/cloud-types";
import {
  getCurrentUserId,
  loadMyTeam,
  loadSoloSave,
  loadTeamMissionLog,
  loadTeamSessionRow,
  logTeamMission,
  onAuthStateChange,
  saveSolo,
  saveTeamSession,
  signOutCloud,
  subscribeTeamEvents,
} from "@/lib/cloud";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Compass,
  ExternalLink,
  Flame,
  LayoutGrid,
  Lock,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

const STORAGE_SESSION_KEY = "fuhsing_chronicles_local_save_v2";
const STORAGE_MODE_KEY = "fuhsing_chronicles_mode_v1";

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FuhsingChroniclesApp() {
  const [saveReady, setSaveReady] = useState(false);
  const [screen, setScreen] = useState<GameScreen>("opening");
  const [missions] = useState<PublicMission[]>(() => getLocalMissions());
  const [settings, setSettings] = useState<GameSettings>(() => getLocalSettings());
  const [session, setSession] = useState<GameSession | null>(null);
  const [solvedDetails, setSolvedDetails] = useState<Record<number, SolvedMissionDetail>>({});
  const [officialSources] = useState<OfficialSourceItem[]>(OFFICIAL_SOURCES);
  const [finalPuzzleMeta] = useState<FinalPuzzleMeta>(FINAL_PUZZLE_DATA);
  const [activeMissionId, setActiveMissionId] = useState<number>(1);
  const [justSolvedModal, setJustSolvedModal] = useState<{
    mission: PublicMission;
    detail: SolvedMissionDetail;
  } | null>(null);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [setupError, setSetupError] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [puzzleFeedback, setPuzzleFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [revealedHints, setRevealedHints] = useState<{
    missionId: number;
    hints: Partial<Record<1 | 2, string>>;
  }>({ missionId: 0, hints: {} });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [endingStory, setEndingStory] = useState<string[]>(FINAL_PUZZLE_DATA.endingStory);

  // ---- cloud / team state ----
  const [playMode, setPlayMode] = useState<PlayMode>("local");
  const [pendingMode, setPendingMode] = useState<PlayMode>("cloud");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudDisplayName, setCloudDisplayName] = useState("");
  const [cloudTeam, setCloudTeam] = useState<TeamInfo | null>(null);
  const [cloudNotice, setCloudNotice] = useState("");
  const [resumeCloud, setResumeCloud] = useState<{ hasSave: boolean; team: TeamInfo | null } | null>(null);

  const elapsedRef = useRef(elapsedSeconds);
  const sessionRef = useRef(session);
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          session?: GameSession;
          solvedDetails?: Record<number, SolvedMissionDetail>;
          settings?: GameSettings;
          elapsedSeconds?: number;
        };
        if (saved.session && Array.isArray(saved.session.completedMissions)) {
          // Hydrate the single-device save after the browser has mounted.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSession(saved.session);
          setSolvedDetails(saved.solvedDetails ?? {});
          setSettings(saved.settings ?? getLocalSettings());
          setElapsedSeconds(Number.isFinite(saved.elapsedSeconds) ? Math.max(0, saved.elapsedSeconds!) : 0);
          setScreen(saved.session.finalSolved ? "ending" : "dashboard");
        }
      }
    } catch {
      try { localStorage.removeItem(STORAGE_SESSION_KEY); } catch { /* storage unavailable */ }
    } finally {
      setSaveReady(true);
    }
  }, []);

  useEffect(() => {
    if (!saveReady || playMode !== "local") return;
    try {
      if (!session) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } else {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({ session, solvedDetails, settings, elapsedSeconds }));
      }
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPuzzleFeedback({ type: "error", message: "此瀏覽器無法儲存本機進度，請確認儲存空間設定。" });
    }
  }, [saveReady, playMode, session, solvedDetails, settings, elapsedSeconds]);

  // Remember the last play mode for this browser.
  useEffect(() => {
    if (!saveReady) return;
    try {
      localStorage.setItem(
        STORAGE_MODE_KEY,
        JSON.stringify({ mode: playMode, displayName: cloudDisplayName })
      );
    } catch { /* storage unavailable */ }
  }, [saveReady, playMode, cloudDisplayName]);

  // Cloud auth bootstrap (session persists in the browser via supabase-js).
  useEffect(() => {
    const unsubscribe = onAuthStateChange((userId) => {
      setCloudUserId(userId);
      if (!userId) setResumeCloud(null);
    });
    void getCurrentUserId().then((id) => setCloudUserId(id));
    return unsubscribe;
  }, []);

  // Detect resumable cloud progress once signed in.
  useEffect(() => {
    if (!cloudUserId) return;
    let alive = true;
    void (async () => {
      const [saveRes, teamRes] = await Promise.all([loadSoloSave(), loadMyTeam()]);
      if (!alive) return;
      setResumeCloud({
        hasSave: Boolean(saveRes.ok && saveRes.data),
        team: teamRes.ok ? teamRes.data : null,
      });
    })();
    return () => {
      alive = false;
    };
  }, [cloudUserId]);

  // Debounced cloud sync (solo or team).
  useEffect(() => {
    if (!saveReady || playMode === "local" || !session) return;
    const timer = setTimeout(() => {
      void (async () => {
        const result =
          playMode === "team" && cloudTeam
            ? await saveTeamSession(cloudTeam.id, session, elapsedRef.current)
            : playMode === "cloud"
            ? await saveSolo(session, elapsedRef.current)
            : { ok: true as const, data: null };
        setCloudNotice(
          result.ok ? "雲端同步中" : "雲端同步失敗，請檢查網路；連線恢復後會自動補上。"
        );
      })();
    }, 2000);
    return () => clearTimeout(timer);
  }, [saveReady, playMode, session, cloudTeam]);

  // Live team sync: apply progress solved by teammates in real time.
  useEffect(() => {
    if (playMode !== "team" || !cloudTeam) return;
    const unsubscribe = subscribeTeamEvents(cloudTeam.id, {
      onSessionRow: (row) => {
        const current = sessionRef.current;
        if (!current) return;
        const merged = mergeTeamProgress(current, row, elapsedRef.current);
        setSession(merged.session);
        setElapsedSeconds(merged.elapsedSeconds);
        setSolvedDetails(buildSolvedDetails(merged.session.completedMissions));
      },
    });
    return unsubscribe;
  }, [playMode, cloudTeam]);

  const isPlayActive = Boolean(session) && !session?.finalSolved &&
    ["dashboard", "map", "mission-detail", "puzzle", "final-puzzle"].includes(screen);

  useEffect(() => {
    if (!isPlayActive) return;
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlayActive]);

  const activeMission = useMemo(
    () => missions.find((mission) => mission.id === activeMissionId) ?? missions[0],
    [activeMissionId, missions]
  );
  const completedSet = useMemo(() => new Set(session?.completedMissions ?? []), [session?.completedMissions]);
  const unlockedIds = useMemo(
    () => computeUnlockedMissionIds(SEED_MISSIONS, session?.completedMissions ?? []),
    [session?.completedMissions]
  );
  const allEightDone = [1, 2, 3, 4, 5, 6, 7, 8].every((id) => completedSet.has(id));

  const buildFreshSession = (
    playerName: string,
    mode: "solo" | "team",
    teamId: string | null = null
  ): GameSession => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}`;
    return {
      id,
      mode,
      teamId,
      playerName: playerName.slice(0, 40),
      startedAt: new Date().toISOString(),
      completedAt: null,
      elapsedSeconds: 0,
      score: 0,
      completedMissions: [],
      fragmentsCollected: [],
      hintsUsed: {},
      attemptsLog: {},
      finalSolved: false,
    };
  };

  const handleCreateSession = (event?: React.FormEvent) => {
    event?.preventDefault();
    const playerName = playerNameInput.trim();
    if (!playerName) {
      setSetupError("請填寫探索員名稱再出發！");
      return;
    }
    setPlayMode("local");
    setCloudTeam(null);
    const newSession = buildFreshSession(playerName, "solo");
    setSession(newSession);
    setSolvedDetails({});
    setElapsedSeconds(0);
    setSetupError("");
    setScreen("dashboard");
  };

  const startCloudGame = async (playerName: string) => {
    setPlayMode("cloud");
    setCloudTeam(null);
    setCloudDisplayName(playerName);
    const result = await loadSoloSave();
    if (result.ok && result.data) {
      const hydrated = soloRowToHydrated(result.data, cloudUserId ?? "", "cloud-save");
      setSession(hydrated.session);
      setSolvedDetails(hydrated.solvedDetails);
      setElapsedSeconds(hydrated.elapsedSeconds);
    } else {
      const newSession = buildFreshSession(playerName, "solo");
      setSession(newSession);
      setSolvedDetails({});
      setElapsedSeconds(0);
      void saveSolo(newSession, 0);
    }
    setSetupError("");
    setScreen("dashboard");
  };

  const handleAuthed = (displayName: string) => {
    setCloudDisplayName(displayName);
    if (pendingMode === "team") {
      setScreen("team-lobby");
    } else {
      void startCloudGame(displayName || playerNameInput.trim() || "探索員");
    }
  };

  const handleChooseCloud = () => {
    const name = playerNameInput.trim() || cloudDisplayName;
    if (!name) {
      setSetupError("請填寫探索員名稱再出發！");
      return;
    }
    setPendingMode("cloud");
    if (cloudUserId) {
      void startCloudGame(name);
    } else {
      setScreen("auth");
    }
  };

  const handleChooseTeam = () => {
    const name = playerNameInput.trim() || cloudDisplayName;
    if (!name) {
      setSetupError("請填寫探索員名稱再出發！");
      return;
    }
    setPendingMode("team");
    setCloudDisplayName(name);
    setScreen(cloudUserId ? "team-lobby" : "auth");
  };

  const handleEnterTeam = (team: TeamInfo) => {
    setCloudTeam(team);
    setPlayMode("team");
    void (async () => {
      const result = await loadTeamSessionRow(team.id);
      if (result.ok && result.data) {
        const hydrated = teamRowToHydrated(result.data, team, `team-${team.id}`);
        setSession(hydrated.session);
        setSolvedDetails(hydrated.solvedDetails);
        setElapsedSeconds(hydrated.elapsedSeconds);
      } else {
        const newSession = buildFreshSession(team.name, "team", team.id);
        setSession(newSession);
        setSolvedDetails({});
        setElapsedSeconds(0);
        void saveTeamSession(team.id, newSession, 0);
      }
      setSetupError("");
      setScreen("dashboard");
    })();
  };

  const handleSignOutCloud = () => {
    void signOutCloud();
    setCloudUserId(null);
    setCloudTeam(null);
    setCloudDisplayName("");
    setResumeCloud(null);
    setPlayMode("local");
    setScreen("setup");
  };

  const handleSelectMission = (mission: PublicMission) => {
    setActiveMissionId(mission.id);
    setPuzzleFeedback(null);
    setScreen("mission-detail");
  };

  const handleOpenHint = (stage: 1 | 2) => {
    if (!session || !activeMission) return;
    const source = SEED_MISSIONS.find((mission) => mission.id === activeMission.id);
    if (!source) return;
    const key = String(activeMission.id);
    setSession((previous) => previous ? {
      ...previous,
      hintsUsed: { ...previous.hintsUsed, [key]: Math.max(previous.hintsUsed[key] ?? 0, stage) },
    } : previous);
    setRevealedHints((previous) => ({
      missionId: activeMission.id,
      hints: { ...(previous.missionId === activeMission.id ? previous.hints : {}), [stage]: stage === 1 ? source.hint1 : source.hint2 },
    }));
  };

  const handleSubmitMissionAnswer = (answer: unknown) => {
    if (!session || !activeMission) return;
    const source = SEED_MISSIONS.find((mission) => mission.id === activeMission.id);
    if (!source) return;
    setSubmittingAnswer(true);
    setPuzzleFeedback(null);
    const result = gradeMissionAnswer(source, answer);
    const missionKey = String(activeMission.id);
    const attemptsLog = { ...session.attemptsLog, [missionKey]: (session.attemptsLog[missionKey] ?? 0) + 1 };
    if (!result.isCorrect) {
      setSession({ ...session, attemptsLog });
      setPuzzleFeedback({ type: "error", message: result.feedback });
      setSubmittingAnswer(false);
      return;
    }

    const completedMissions = [...new Set([...session.completedMissions, activeMission.id])].sort((a, b) => a - b);
    const fragmentsCollected = [...new Set([...session.fragmentsCollected, source.fragmentName])];
    const updatedSession: GameSession = {
      ...session,
      completedMissions,
      fragmentsCollected,
      attemptsLog,
      score: computeTotalScore(completedMissions, session.finalSolved),
      completedAt: completedMissions.length === 8 ? new Date().toISOString() : session.completedAt,
    };
    const detail = extractSolvedDetail(source);
    setSession(updatedSession);
    setSolvedDetails((previous) => ({ ...previous, [activeMission.id]: detail }));
    setJustSolvedModal({ mission: activeMission, detail });
    setSubmittingAnswer(false);
    if (playMode === "cloud") {
      void saveSolo(updatedSession, elapsedRef.current);
    } else if (playMode === "team" && cloudTeam) {
      void saveTeamSession(cloudTeam.id, updatedSession, elapsedRef.current);
      void logTeamMission(cloudTeam.id, activeMission.id, cloudDisplayName || "隊友");
    }
  };

  const handleSubmitFinalPuzzle = (order: string[]) => {
    if (!session) return;
    if (!allEightDone) {
      setPuzzleFeedback({ type: "error", message: "必須先完成八道任務、收集全部記憶碎片，才能啟動最終謎題。" });
      return;
    }
    setSubmittingAnswer(true);
    const result = gradeFinalSeal(order);
    setPuzzleFeedback(result.isCorrect ? { type: "success", message: result.feedback } : { type: "error", message: result.feedback });
    if (result.isCorrect) {
      const finished: GameSession = {
        ...session,
        finalSolved: true,
        completedAt: session.completedAt ?? new Date().toISOString(),
        score: computeTotalScore(session.completedMissions, true),
      };
      setSession(finished);
      setEndingStory(FINAL_PUZZLE_DATA.endingStory);
      setScreen("ending");
      if (playMode === "cloud") {
        void saveSolo(finished, elapsedRef.current);
      } else if (playMode === "team" && cloudTeam) {
        void saveTeamSession(cloudTeam.id, finished, elapsedRef.current);
      }
    }
    setSubmittingAnswer(false);
  };

  const handleStartFreshAdventure = () => {
    setSession(null);
    setSolvedDetails({});
    setElapsedSeconds(0);
    setPlayerNameInput("");
    setPuzzleFeedback(null);
    setJustSolvedModal(null);
    setScreen("setup");
  };

  return (
    <div className="min-h-screen bg-[#F2F6FD] text-[#213155] flex flex-col">
      {/* Persistent Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-[#103FA0]/20 bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setScreen(session ? "dashboard" : "opening")}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E3B505] bg-[#F9CF00] text-[#D21E14]">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold tracking-wide text-[#213155] sm:text-base">
                復興檔案：時光的邀請
              </p>
              <p className="hidden text-[10px] tracking-[0.18em] text-[#103FA0] sm:block">
                TAIPEI FUHSING PRIVATE SCHOOL
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {session && (
              <div className="hidden items-center gap-3 rounded-xl border border-[#103FA0]/25 bg-[#EAF0FA] px-3 py-1.5 text-xs md:flex">
                <span className="inline-flex items-center gap-1 text-[#103FA0]">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
                </span>
                <span className="h-3 w-px bg-[#213155]/15" />
                <span className="font-mono font-semibold text-[#008250]">
                  {session.score} / 100 分
                </span>
                <span className="h-3 w-px bg-[#213155]/15" />
                <span className="text-[#213155]/85">
                  碎片 {session.completedMissions.length}/8
                </span>
              </div>
            )}

            {playMode === "team" && cloudTeam && (
              <button
                type="button"
                onClick={() => setScreen("team-lobby")}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E3B505] bg-[#F9CF00]/20 px-2.5 text-xs font-semibold text-[#103FA0] transition hover:border-[#E3B505]"
              >
                <Users className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">隊伍「{cloudTeam.name}」</span>
              </button>
            )}
            {playMode !== "local" && cloudNotice.includes("失敗") && (
              <span className="inline-flex h-9 items-center rounded-xl border border-[#D21E14]/35 bg-[#D21E14]/8 px-2.5 text-xs text-[#B41810]">
                {cloudNotice}
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#213155]/15 bg-[#EAF0FA] px-2.5 text-xs text-[#213155]/85 transition hover:border-[#103FA0] hover:text-[#103FA0]"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">資料來源與安全</span>
            </button>

          </div>
        </div>

        {/* Mobile Secondary Status Strip during active play */}
        {session && (
          <div className="flex items-center justify-between border-t border-[#103FA0]/10 bg-[#EAF0FA] px-4 py-2 text-xs md:hidden">
            <span className="font-medium text-[#213155]/85 truncate max-w-[140px]">
              {session.playerName}
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-[#103FA0]">{formatDuration(elapsedSeconds)}</span>
              <span className="text-[#008250]">{session.score}分</span>
              <span className="text-[#213155]">碎片 {session.completedMissions.length}/8</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* SCREEN 01: OPENING SCREEN */}
          {screen === "opening" && (
            <motion.section
              key="opening"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="mx-auto max-w-4xl py-4 sm:py-8"
            >
              <div className="archive-card relative overflow-hidden rounded-3xl">
                <div className="grid md:grid-cols-12">
                  {/* Left Visual */}
                  <div className="relative min-h-[260px] md:col-span-6 md:min-h-[460px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/fuhsing-campus-hero.jpg"
                      alt="臺北市私立復興實驗高級中學校園實景照片"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/images/asset-placeholder.svg";
                        event.currentTarget.alt = "校園裝飾照片無法載入；目前顯示佔位圖";
                      }}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white" />
                    <div className="absolute left-4 top-4 rounded-full border border-[#103FA0]/40 bg-[#213155]/85 px-3 py-1 font-mono text-[11px] text-[#F9CF00]">
                      建議探索時間：50 分鐘
                    </div>
                  </div>

                  {/* Right Cinematic Typography */}
                  <div className="flex flex-col justify-center p-6 sm:p-10 md:col-span-6 space-y-6">
                    <div className="space-y-3">
                      <p className="font-display text-xs uppercase tracking-[0.26em] text-[#103FA0]">
                        FUHSING CHRONICLES : THE INVITATION THROUGH TIME
                      </p>
                      <h1 className="font-serif text-3xl font-bold leading-tight text-[#213155] sm:text-4xl">
                        復興檔案
                        <span className="mt-1 block text-[#D21E14]">時光的邀請</span>
                      </h1>
                      <p className="text-sm leading-relaxed text-[#213155]/80">
                        獻給臺北市私立復興實驗高級中學探索員的一場校園解謎旅程。透過八個實境推理任務，找回散落在紅磚校舍、鐘樓與綠意中庭裡的校園記憶。
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#103FA0]/20 bg-[#EAF0FA] p-3 text-center">
                      <div>
                        <p className="font-mono text-lg font-bold text-[#103FA0]">08</p>
                        <p className="text-[11px] text-[#213155]/70">校園探索關卡</p>
                      </div>
                      <div className="border-x border-[#213155]/10">
                        <p className="font-mono text-lg font-bold text-[#008250]">100</p>
                        <p className="text-[11px] text-[#213155]/70">滿分積分</p>
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-[#213155]">50m</p>
                        <p className="text-[11px] text-[#213155]/70">無壓力體驗</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setScreen("intro")}
                        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3.5 text-base font-bold text-[#213155] transition hover:bg-[#FFDD33] shadow-[0_12px_32px_rgba(249,207,0,0.3)]"
                      >
                        啟封時光邀請函
                        <ArrowRight className="h-5 w-5" />
                      </button>

                      {session && (
                        <button
                          type="button"
                          onClick={() =>
                            setScreen(session.finalSolved ? "ending" : "dashboard")
                          }
                          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#008250]/45 bg-[#EAF0FA] px-5 py-2.5 text-sm font-semibold text-[#008250] transition hover:bg-[#008250]/10"
                        >
                          繼續此裝置上的探索進度
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* SCREEN 02: STORY INTRODUCTION */}
          {screen === "intro" && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-3xl space-y-6"
            >
              <div className="archive-card overflow-hidden rounded-3xl">
                <div className="relative h-56 sm:h-72 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/time-invitation.png"
                    alt="時光邀請主視覺"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/asset-placeholder.svg";
                      event.currentTarget.alt = "主視覺素材無法載入；目前顯示非實景佔位圖";
                    }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#213155] via-[#213155]/45 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#F9CF00]">
                      PROLOGUE・故事序章
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-white sm:text-3xl">
                      一封來自過去的信
                    </h2>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <div className="space-y-3.5 text-base leading-relaxed text-[#213155]/90">
                    <p>
                      某一天，復興實中的檔案室裡出現了一封蓋著梅花與火炬蠟印的舊信封。信紙上工整地記錄著這座校園從民國三十五年起步至今的故事，以及八個散落在校園各個角落、等待被重新看見的秘密。
                    </p>
                    <p>
                      你將以「校園探索員」的身份接下這份特別的委託：從校門口出發，透過觀察建築、推敲校史、解讀校徽、認識綠色生態與校園幕後團隊，逐一找回
                      <span className="font-semibold text-[#103FA0]"> 八枚記憶碎片 </span>
                      ，並在最後解開時光的最終謎題。
                    </p>
                  </div>

                  {/* Safety Pledge */}
                  <div className="rounded-2xl border border-[#008250]/35 bg-[#EAF0FA] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#008250]">
                      <ShieldCheck className="h-5 w-5" />
                      校園探索員安全與禮儀約定
                    </div>
                    <ul className="grid gap-1.5 text-xs text-[#213155]/80 sm:grid-cols-2">
                      <li>• 全程安靜探索，不奔跑、不攀爬、不跳躍</li>
                      <li>• 不進入正在上課的教室與行政管制區域</li>
                      <li>• 不打擾師長辦公，亦不拍攝其他同學</li>
                      <li>• 愛護花木與校園設備，遇休館時可使用數位檔案</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setScreen("opening")}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#213155]/20 bg-[#EAF0FA] px-6 py-3 text-sm font-medium text-[#213155]/85 hover:border-[#103FA0]"
                    >
                      返回封面
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("setup")}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3 text-base font-bold text-[#213155] transition hover:bg-[#FFDD33]"
                    >
                      登錄探索員檔案並出發
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* SCREEN 03: PLAYER SETUP + MODE SELECT */}
          {screen === "setup" && (
            <motion.section
              key="setup"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-2xl space-y-6"
            >
              <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#103FA0]">
                    EXPLORER PROFILE & PLAY MODE
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#213155]">
                    建立探索檔案・選擇遊玩模式
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#213155]/70">
                    可離線單機遊玩（本機存檔）、登入雲端跨裝置同步，或組隊共同解謎。離線模式不需要帳號，進度只存於此瀏覽器。
                  </p>
                </div>

                <label className="block text-xs font-semibold text-[#103FA0]">
                  探索員名稱
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(event) => setPlayerNameInput(event.target.value)}
                    placeholder="例如：八年仁班 小光"
                    maxLength={40}
                    className="mt-1.5 w-full rounded-xl border border-[#103FA0]/30 bg-[#EAF0FA] px-4 py-3 text-sm text-[#213155] placeholder:text-[#213155]/35 focus:border-[#103FA0] focus:outline-none"
                  />
                </label>

                {setupError && (
                  <p className="rounded-xl border border-[#D21E14]/35 bg-[#D21E14]/8 px-3.5 py-2 text-xs text-[#B41810]">
                    {setupError}
                  </p>
                )}

                {cloudUserId && resumeCloud && (resumeCloud.hasSave || resumeCloud.team) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (resumeCloud.team) {
                        handleEnterTeam(resumeCloud.team);
                      } else {
                        void startCloudGame(playerNameInput.trim() || cloudDisplayName || "探索員");
                      }
                    }}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#008250]/45 bg-[#008250]/10 px-6 py-3 text-sm font-bold text-[#008250] hover:bg-[#008250]/15"
                  >
                    <Cloud className="h-4 w-4" />
                    繼續雲端進度{resumeCloud.team ? `・隊伍「${resumeCloud.team.name}」` : "（跨裝置存檔）"}
                  </button>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleCreateSession()}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-4 text-left transition hover:border-[#103FA0]"
                  >
                    <Compass className="h-5 w-5 text-[#103FA0]" />
                    <span className="text-sm font-bold text-[#213155]">離線單機</span>
                    <span className="text-xs leading-relaxed text-[#213155]/65">
                      本機存檔・免帳號，可完全離線遊玩
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleChooseCloud}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-4 text-left transition hover:border-[#103FA0]"
                  >
                    <Cloud className="h-5 w-5 text-[#103FA0]" />
                    <span className="text-sm font-bold text-[#213155]">雲端存檔</span>
                    <span className="text-xs leading-relaxed text-[#213155]/65">
                      登入後進度同步雲端，換裝置繼續玩
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleChooseTeam}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-[#E3B505] bg-[#F9CF00]/12 p-4 text-left transition hover:border-[#E3B505]"
                  >
                    <Users className="h-5 w-5 text-[#D21E14]" />
                    <span className="text-sm font-bold text-[#213155]">組隊遊玩</span>
                    <span className="text-xs leading-relaxed text-[#213155]/65">
                      全隊共解八道任務，即時同步進度與排行
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("opening")}
                  className="w-full text-sm text-[#213155]/65 hover:text-[#103FA0]"
                >
                  返回封面
                </button>
              </div>
            </motion.section>
          )}

          {/* SCREEN 03B: CLOUD AUTH */}
          {screen === "auth" && (
            <AuthScreen
              key="auth"
              initialName={playerNameInput.trim() || cloudDisplayName}
              onBack={() => setScreen("setup")}
              onSignedIn={handleAuthed}
            />
          )}

          {/* SCREEN 03C: TEAM LOBBY */}
          {screen === "team-lobby" && (
            <TeamLobbyScreen
              key="team-lobby"
              displayName={cloudDisplayName || playerNameInput.trim() || "探索員"}
              onEnterTeam={handleEnterTeam}
              onBack={() => setScreen("setup")}
              onSignOut={handleSignOutCloud}
            />
          )}

          {/* SCREEN 04: GAME DASHBOARD */}
          {screen === "dashboard" && session && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Explorer Banner & Primary Map CTA */}
              <div className="archive-card rounded-3xl p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F9CF00]/15 px-3 py-1 text-xs font-semibold text-[#103FA0]">
                        <User className="h-3.5 w-3.5" />
                        單機探索模式
                      </span>
                      <span className="rounded-full border border-[#213155]/15 bg-[#EAF0FA] px-3 py-1 font-mono text-xs text-[#213155]/80">
                        進度儲存於此瀏覽器
                      </span>
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-[#213155] sm:text-3xl">
                      {session.playerName} 的復興檔案
                    </h1>
                    <p className="text-xs text-[#213155]/70">
                      建議以 50 分鐘漫步校園節奏進行探索（無倒數計時，請放心觀察與推理）
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setScreen("map")}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3 text-sm font-bold text-[#213155] transition hover:bg-[#FFDD33] shadow-[0_10px_28px_rgba(249,207,0,0.28)]"
                    >
                      <MapIcon className="h-4 w-4" />
                      開啟互動校園地圖
                    </button>

                    <button
                      type="button"
                      disabled={!allEightDone}
                      onClick={() => {
                        setPuzzleFeedback(null);
                        setScreen(session.finalSolved ? "ending" : "final-puzzle");
                      }}
                      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                        allEightDone
                          ? "bg-[#008250] text-white hover:bg-[#006B41]"
                          : "cursor-not-allowed border border-[#213155]/15 bg-[#EAF0FA] text-[#213155]/45"
                      }`}
                    >
                      {session.finalSolved ? (
                        <>
                          <Sparkles className="h-4 w-4" /> 查看結局與成績單
                        </>
                      ) : allEightDone ? (
                        <>
                          <Sparkles className="h-4 w-4" /> 進入最終謎題
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" /> 集齊 8 碎片解鎖終章
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings((current) => ({ ...current, historyMuseumOpen: !current.historyMuseumOpen }))}
                  aria-pressed={!settings.historyMuseumOpen}
                  className="mt-5 min-h-11 rounded-xl border border-[#103FA0]/25 bg-[#EAF0FA] px-4 py-2 text-left text-xs text-[#213155]/80 hover:border-[#103FA0]/60"
                >
                  情境設定：校史館目前{settings.historyMuseumOpen ? "開放" : "休館"}・點此切換，用於體驗 M04 替代檔案
                </button>

                {/* Progress Stats Row */}
                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#213155]/65">已完成任務</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#213155]">
                      {session.completedMissions.length}{" "}
                      <span className="text-sm text-[#213155]/50">/ 8</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#213155]/65">記憶碎片收集</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#008250]">
                      {session.fragmentsCollected.length}{" "}
                      <span className="text-sm text-[#213155]/50">/ 8 枚</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#213155]/65">目前積分</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#103FA0]">
                      {session.score}{" "}
                      <span className="text-sm text-[#213155]/50">/ 100</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#213155]/65">已探索時間</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#213155]">
                      {formatDuration(elapsedSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Memory Fragments Collection */}
              <div className="archive-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-lg font-bold text-[#213155] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#103FA0]" />
                    記憶碎片典藏盒（{session.completedMissions.length} / 8）
                  </h2>
                  <span className="text-xs text-[#213155]/60">
                    每完成一個校園任務即可收錄一枚記憶碎片
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
                  {missions.map((m) => {
                    const collected = completedSet.has(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (unlockedIds.includes(m.id)) {
                            handleSelectMission(m);
                          }
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                          collected
                            ? "border-[#008250]/45 bg-[#EAF0FA] text-[#008250] shadow-[0_0_20px_rgba(0,130,80,0.14)]"
                            : "border-[#213155]/10 bg-[#EAF0FA]/50 text-[#213155]/35"
                        }`}
                      >
                        <div className="mb-1.5">
                          {collected ? (
                            <FragmentSymbolIcon symbol={m.fragmentSymbol} className="h-6 w-6 text-[#103FA0]" />
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                        <span className="font-mono text-[10px]">
                          #{m.id.toString().padStart(2, "0")}
                        </span>
                        <span className="mt-0.5 text-xs font-semibold truncate w-full">
                          {collected ? m.fragmentName : "未收集"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* All 8 Missions List */}
              <div className="archive-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#213155] flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-[#103FA0]" />
                    八大校園探索任務清單
                  </h2>
                  <button
                    type="button"
                    onClick={() => setScreen("map")}
                    className="text-xs font-semibold text-[#103FA0] hover:underline"
                  >
                    在地圖上查看 →
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {missions.map((m) => {
                    const isDone = completedSet.has(m.id);
                    const isUnlocked = unlockedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => handleSelectMission(m)}
                        className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                          isDone
                            ? "border-[#008250]/40 bg-[#EAF0FA] hover:border-[#008250]"
                            : isUnlocked
                            ? "border-[#103FA0]/30 bg-[#EAF0FA] hover:border-[#103FA0]"
                            : "cursor-not-allowed border-[#213155]/10 bg-[#EAF0FA]/45 opacity-60"
                        }`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.sceneImage}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#103FA0]">
                                {m.code}
                              </span>
                            <span className="font-serif text-base font-bold text-[#213155]">
                              {m.title}
                            </span>
                          </div>
                            <p className="text-xs text-[#213155]/70">{m.locationName}</p>
                          </div>
                        </div>

                        <span className="shrink-0 pt-0.5">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#008250]/15 px-2.5 py-1 text-[11px] font-semibold text-[#008250]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> 完成
                            </span>
                          ) : isUnlocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F9CF00]/15 px-2.5 py-1 text-[11px] font-semibold text-[#103FA0]">
                              <Compass className="h-3.5 w-3.5" /> 探索
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#213155]/8 px-2.5 py-1 text-[11px] text-[#213155]/55">
                              <Lock className="h-3.5 w-3.5" /> 待解鎖
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {/* SCREEN 05: INTERACTIVE CAMPUS MAP */}
          {screen === "map" && session && (
            <motion.section
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-serif text-2xl font-bold text-[#213155]">
                    復興校園探索互動地圖
                  </h1>
                  <p className="text-xs text-[#213155]/70">
                    點擊地圖上的發光任務節點開始探索，可自由縮放或拖曳查看各區建築特色。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen("dashboard")}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#103FA0]/35 bg-[#EAF0FA] px-4 py-2 text-xs font-semibold text-[#103FA0] hover:bg-[#103FA0]/10"
                >
                  <LayoutGrid className="h-4 w-4" /> 返回檔案總覽
                </button>
              </div>

              <CampusMapSVG
                missions={missions}
                completedMissions={session.completedMissions}
                unlockedIds={unlockedIds}
                onSelectMission={handleSelectMission}
              />
            </motion.section>
          )}

          {/* SCREEN 06 & 07 & 08: MISSION DETAIL + PUZZLE + HINTS */}
          {(screen === "mission-detail" || screen === "puzzle") &&
            session &&
            activeMission && (
              <motion.section
                key={`${screen}-${activeMission.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <PuzzlePlayfield
                  mode={screen === "mission-detail" ? "detail" : "puzzle"}
                  mission={activeMission}
                  settings={settings}
                  isSolved={completedSet.has(activeMission.id)}
                  solvedDetail={solvedDetails[activeMission.id]}
                  allSolvedDetails={solvedDetails}
                  hintsRevealed={
                    session.hintsUsed?.[String(activeMission.id)] ?? 0
                  }
                  revealedHints={revealedHints.missionId === activeMission.id ? revealedHints.hints : {}}
                  submitting={submittingAnswer}
                  feedback={puzzleFeedback}
                  onStartPuzzle={() => {
                    setPuzzleFeedback(null);
                    setScreen("puzzle");
                  }}
                  onBackToMap={() => setScreen("map")}
                  onBackToDetail={() => setScreen("mission-detail")}
                  onOpenHint={handleOpenHint}
                  onSubmitAnswer={handleSubmitMissionAnswer}
                />
              </motion.section>
            )}

          {/* SCREEN 10: FINAL PUZZLE */}
          {screen === "final-puzzle" && session && finalPuzzleMeta && (
            <motion.section
              key="final-puzzle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <FinalPuzzleView
                meta={finalPuzzleMeta}
                missions={missions}
                submitting={submittingAnswer}
                feedback={puzzleFeedback}
                onBack={() => setScreen("dashboard")}
                onSubmitOrder={handleSubmitFinalPuzzle}
              />
            </motion.section>
          )}

          {/* SCREEN 11: ENDING SCREEN */}
          {screen === "ending" && session && (
            <motion.section
              key="ending"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <EndingScreenView
                session={session}
                missions={missions}
                endingStory={endingStory}
                officialSources={officialSources}
                elapsedFormatted={formatDuration(elapsedSeconds)}
                onReturnDashboard={() => setScreen("dashboard")}
                onStartNewAdventure={handleStartFreshAdventure}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* SCREEN 09: MISSION COMPLETE OVERLAY */}
      {justSolvedModal && (
        <MissionCompleteModal
          mission={justSolvedModal.mission}
          solvedDetail={justSolvedModal.detail}
          allEightDone={allEightDone}
          onContinueMap={() => {
            setJustSolvedModal(null);
            setScreen("map");
          }}
          onContinueDashboard={() => {
            setJustSolvedModal(null);
            setScreen("dashboard");
          }}
          onGoFinalPuzzle={() => {
            setJustSolvedModal(null);
            setPuzzleFeedback(null);
            setScreen("final-puzzle");
          }}
        />
      )}

      {/* OFFICIAL SOURCES & SAFETY MODAL */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#213155]/45 p-4 backdrop-blur-sm">
          <div className="archive-card my-auto w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#103FA0]/20 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#103FA0]" />
                <h2 className="font-serif text-xl font-bold text-[#213155]">
                  官方資料來源與校園安全守則
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                aria-label="關閉資料來源視窗"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#213155]/20 bg-[#EAF0FA] text-[#213155]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-[#008250]/35 bg-[#EAF0FA] p-4 space-y-1.5">
              <p className="text-xs font-bold text-[#008250]">活動安全守則</p>
              <p className="text-xs leading-relaxed text-[#213155]/85">
                本遊戲設計遵循臺北市私立復興實驗高級中學校園安全規範：禁止奔跑、攀爬、跳躍，不可進入管制區或正在上課之教室，亦不可打擾老師、行政人員或拍攝其他學生。若校史館未開放，請直接使用關卡內的數位校史檔案作答。
              </p>
            </div>

            <div className="max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
              {officialSources.map((src) => (
                <a
                  key={src.title}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-[#213155]/12 bg-[#EAF0FA] p-3.5 transition hover:border-[#103FA0]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#F9CF00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#103FA0]">
                      {src.category}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#103FA0]" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#213155]">{src.title}</p>
                  <p className="mt-0.5 text-xs text-[#213155]/65">{src.note}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
