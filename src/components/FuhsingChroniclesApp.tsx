"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  FinalPuzzleMeta,
  GameScreen,
  GameSession,
  GameSettings,
  OfficialSourceItem,
  PublicMission,
  SolvedMissionDetail,
} from "@/types/game";
import CampusMapSVG from "./CampusMapSVG";
import PuzzlePlayfield from "./PuzzlePlayfield";
import MissionCompleteModal, { FragmentSymbolIcon } from "./MissionCompleteModal";
import { EndingScreenView, FinalPuzzleView } from "./FinalPuzzleAndEnding";
import AdminConsole from "./AdminConsole";
import { FINAL_PUZZLE_DATA } from "@/lib/seed-data";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  KeyRound,
  LayoutGrid,
  Lock,
  Map as MapIcon,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

const STORAGE_SESSION_KEY = "fuhsing_chronicles_session_id";

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FuhsingChroniclesApp() {
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<GameScreen>("opening");

  const [missions, setMissions] = useState<PublicMission[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    id: 1,
    historyMuseumOpen: true,
    forceUnlockAll: false,
  });
  const [session, setSession] = useState<GameSession | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<number[]>([]);
  const [solvedDetails, setSolvedDetails] = useState<Record<number, SolvedMissionDetail>>({});
  const [officialSources, setOfficialSources] = useState<OfficialSourceItem[]>([]);
  const [finalPuzzleMeta, setFinalPuzzleMeta] = useState<FinalPuzzleMeta | null>(null);

  // Active Mission & Completion Modal state
  const [activeMissionId, setActiveMissionId] = useState<number>(1);
  const [justSolvedModal, setJustSolvedModal] = useState<{
    mission: PublicMission;
    detail: SolvedMissionDetail;
  } | null>(null);

  // Setup Form state
  const [setupMode, setSetupMode] = useState<"solo" | "team">("solo");
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [teamNameInput, setTeamNameInput] = useState("");
  const [resumeCodeInput, setResumeCodeInput] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);

  // Puzzle Submission & Feedback state
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [puzzleFeedback, setPuzzleFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Overlays
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [endingStory, setEndingStory] = useState<string[]>(FINAL_PUZZLE_DATA.endingStory);

  const applyBootstrapPayload = useCallback(
    (data: {
      missions?: PublicMission[];
      settings?: GameSettings;
      session?: GameSession | null;
      unlockedIds?: number[];
      solvedDetails?: Record<number, SolvedMissionDetail>;
      officialSources?: OfficialSourceItem[];
      finalPuzzleMeta?: FinalPuzzleMeta;
    }) => {
      if (data.missions) setMissions(data.missions);
      if (data.settings) setSettings(data.settings);
      if (data.unlockedIds) setUnlockedIds(data.unlockedIds);
      if (data.solvedDetails) setSolvedDetails(data.solvedDetails);
      if (data.officialSources) setOfficialSources(data.officialSources);
      if (data.finalPuzzleMeta) setFinalPuzzleMeta(data.finalPuzzleMeta);

      if (data.session !== undefined) {
        setSession(data.session);
        if (data.session) {
          setElapsedSeconds(data.session.elapsedSeconds || 0);
          try {
            localStorage.setItem(STORAGE_SESSION_KEY, data.session.id);
          } catch {
            // ignore storage errors
          }
        }
      }
    },
    []
  );

  const loadBootstrap = useCallback(
    async (explicitSessionId?: string | null) => {
      let sid = explicitSessionId;
      if (sid === undefined) {
        try {
          sid = localStorage.getItem(STORAGE_SESSION_KEY);
        } catch {
          sid = null;
        }
      }

      const url = sid
        ? `/api/game/bootstrap?sessionId=${encodeURIComponent(sid)}`
        : "/api/game/bootstrap";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      applyBootstrapPayload(data);
      return data;
    },
    [applyBootstrapPayload]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await loadBootstrap();
        if (data?.session) {
          setScreen(data.session.finalSolved ? "ending" : "dashboard");
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [loadBootstrap]);

  // Non-pressured elapsed time ticker
  const isPlayActive =
    Boolean(session) &&
    !session?.finalSolved &&
    ["dashboard", "map", "mission-detail", "puzzle", "final-puzzle"].includes(screen);

  useEffect(() => {
    if (!isPlayActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayActive]);

  // Periodic sync of elapsedSeconds to PostgreSQL every 15s
  useEffect(() => {
    if (!session || !isPlayActive || elapsedSeconds === 0) return;
    if (elapsedSeconds % 15 !== 0) return;
    void fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elapsedSeconds }),
    });
  }, [elapsedSeconds, isPlayActive, session]);

  const activeMission = useMemo(
    () => missions.find((m) => m.id === activeMissionId) ?? missions[0],
    [activeMissionId, missions]
  );

  const completedSet = useMemo(
    () => new Set(session?.completedMissions ?? []),
    [session?.completedMissions]
  );

  const allEightDone = useMemo(
    () => [1, 2, 3, 4, 5, 6, 7, 8].every((id) => completedSet.has(id)),
    [completedSet]
  );

  // Handlers
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    setSetupBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: setupMode,
          playerName: playerNameInput,
          teamName: setupMode === "team" ? teamNameInput : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || "建立探索檔案失敗");
        return;
      }
      applyBootstrapPayload(data);
      setScreen("dashboard");
    } finally {
      setSetupBusy(false);
    }
  };

  const handleResumeByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    setSetupBusy(true);
    try {
      const res = await fetch(
        `/api/sessions?code=${encodeURIComponent(resumeCodeInput.trim().toUpperCase())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error || "找不到探索代碼");
        return;
      }
      applyBootstrapPayload(data);
      setScreen(data.session?.finalSolved ? "ending" : "dashboard");
    } finally {
      setSetupBusy(false);
    }
  };

  const handleSelectMission = (mission: PublicMission) => {
    setActiveMissionId(mission.id);
    setPuzzleFeedback(null);
    setScreen("mission-detail");
  };

  const handleOpenHint = async (stage: 1 | 2) => {
    if (!session || !activeMission) return;
    const key = String(activeMission.id);
    const current = session.hintsUsed?.[key] || 0;
    const nextStage = Math.max(current, stage);

    setSession((prev) =>
      prev
        ? {
            ...prev,
            hintsUsed: { ...(prev.hintsUsed || {}), [key]: nextStage },
          }
        : prev
    );

    await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        elapsedSeconds,
        hintOpened: { missionId: activeMission.id, stage },
      }),
    });
  };

  const handleSubmitMissionAnswer = async (answer: unknown) => {
    if (!session || !activeMission) return;
    setSubmittingAnswer(true);
    setPuzzleFeedback(null);
    try {
      const res = await fetch(`/api/missions/${activeMission.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          answer,
          elapsedSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPuzzleFeedback({
          type: "error",
          message: data.error || "目前無法送出答案，請稍後再試。",
        });
        return;
      }

      if (data.session) setSession(data.session);
      if (data.unlockedIds) setUnlockedIds(data.unlockedIds);

      if (!data.isCorrect) {
        setPuzzleFeedback({
          type: "error",
          message: data.feedback,
        });
        return;
      }

      if (data.solvedDetail) {
        setSolvedDetails((prev) => ({
          ...prev,
          [activeMission.id]: data.solvedDetail,
        }));
        setJustSolvedModal({
          mission: activeMission,
          detail: data.solvedDetail,
        });
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSubmitFinalPuzzle = async (order: string[]) => {
    if (!session) return;
    setSubmittingAnswer(true);
    setPuzzleFeedback(null);
    try {
      const res = await fetch("/api/final-puzzle/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          order,
          elapsedSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.isCorrect) {
        setPuzzleFeedback({
          type: "error",
          message: data.feedback || data.error || "順序還差一點點，再檢查看看！",
        });
        return;
      }
      if (data.session) setSession(data.session);
      if (data.endingStory) setEndingStory(data.endingStory);
      setScreen("ending");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDirectTestMission = async (missionId: number) => {
    let targetSession = session;
    if (!targetSession) {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "solo",
          playerName: "管理員測試員",
          isAdminTestSession: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        applyBootstrapPayload(data);
        targetSession = data.session;
      }
    } else {
      await loadBootstrap(targetSession.id);
    }
    setActiveMissionId(missionId);
    setPuzzleFeedback(null);
    setShowAdmin(false);
    setScreen("puzzle");
  };

  const handleResetCurrentSession = async () => {
    if (!session) return;
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    if (res.ok) {
      const data = await res.json();
      applyBootstrapPayload(data);
      setJustSolvedModal(null);
      setPuzzleFeedback(null);
      setScreen("dashboard");
    }
  };

  const handleStartFreshAdventure = () => {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
    setSession(null);
    setSolvedDetails({});
    setElapsedSeconds(0);
    setPlayerNameInput("");
    setTeamNameInput("");
    setResumeCodeInput("");
    setPuzzleFeedback(null);
    setScreen("setup");
  };

  if (booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#101827] px-6 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D9B978]/30 border-t-[#D9B978]" />
        <p className="mt-4 font-serif text-sm tracking-widest text-[#D9B978]">
          正在開啟復興檔案室⋯
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101827] text-[#F3F1EA] flex flex-col">
      {/* Persistent Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-[#D9B978]/20 bg-[#101827]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setScreen(session ? "dashboard" : "opening")}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9B978]/45 bg-[#1B2A40] text-[#D9B978]">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold tracking-wide text-[#F3F1EA] sm:text-base">
                復興檔案：時光的邀請
              </p>
              <p className="hidden text-[10px] tracking-[0.18em] text-[#D9B978] sm:block">
                TAIPEI FUHSING PRIVATE SCHOOL
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {session && (
              <div className="hidden items-center gap-3 rounded-xl border border-[#D9B978]/25 bg-[#1B2A40] px-3 py-1.5 text-xs md:flex">
                <span className="inline-flex items-center gap-1 text-[#D9B978]">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
                </span>
                <span className="h-3 w-px bg-[#F3F1EA]/20" />
                <span className="font-mono font-semibold text-[#65C99A]">
                  {session.score} / 100 分
                </span>
                <span className="h-3 w-px bg-[#F3F1EA]/20" />
                <span className="text-[#F3F1EA]/85">
                  碎片 {session.completedMissions.length}/8
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-2.5 text-xs text-[#F3F1EA]/85 transition hover:border-[#D9B978] hover:text-[#D9B978]"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">資料來源與安全</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              aria-label="管理員與測試模式"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D9B978]/35 bg-[#1B2A40] px-2.5 text-xs font-medium text-[#D9B978] transition hover:bg-[#D9B978]/15"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">管理員</span>
            </button>
          </div>
        </div>

        {/* Mobile Secondary Status Strip during active play */}
        {session && (
          <div className="flex items-center justify-between border-t border-[#D9B978]/10 bg-[#142033] px-4 py-2 text-xs md:hidden">
            <span className="font-medium text-[#F3F1EA]/85 truncate max-w-[140px]">
              {session.mode === "team" && session.teamName
                ? session.teamName
                : session.playerName}
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-[#D9B978]">{formatDuration(elapsedSeconds)}</span>
              <span className="text-[#65C99A]">{session.score}分</span>
              <span className="text-[#F3F1EA]">碎片 {session.completedMissions.length}/8</span>
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
                      src="/images/fuhsing-campus-hero.png"
                      alt="臺北市私立復興實驗高級中學 校園紅磚建築與鐘樓意象"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A40] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#1B2A40]" />
                    <div className="absolute left-4 top-4 rounded-full border border-[#D9B978]/40 bg-[#101827]/85 px-3 py-1 font-mono text-[11px] text-[#D9B978]">
                      建議探索時間：50 分鐘
                    </div>
                  </div>

                  {/* Right Cinematic Typography */}
                  <div className="flex flex-col justify-center p-6 sm:p-10 md:col-span-6 space-y-6">
                    <div className="space-y-3">
                      <p className="font-display text-xs uppercase tracking-[0.26em] text-[#D9B978]">
                        FUHSING CHRONICLES : THE INVITATION THROUGH TIME
                      </p>
                      <h1 className="font-serif text-3xl font-bold leading-tight text-[#F3F1EA] sm:text-4xl">
                        復興檔案
                        <span className="mt-1 block text-[#D9B978]">時光的邀請</span>
                      </h1>
                      <p className="text-sm leading-relaxed text-[#F3F1EA]/80">
                        獻給臺北市私立復興實驗高級中學探索員的一場校園解謎旅程。透過八個實境推理任務，找回散落在紅磚校舍、鐘樓與綠意中庭裡的校園記憶。
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#D9B978]/20 bg-[#101827] p-3 text-center">
                      <div>
                        <p className="font-mono text-lg font-bold text-[#D9B978]">08</p>
                        <p className="text-[11px] text-[#F3F1EA]/70">校園探索關卡</p>
                      </div>
                      <div className="border-x border-[#F3F1EA]/10">
                        <p className="font-mono text-lg font-bold text-[#65C99A]">100</p>
                        <p className="text-[11px] text-[#F3F1EA]/70">滿分積分</p>
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-[#F3F1EA]">50m</p>
                        <p className="text-[11px] text-[#F3F1EA]/70">無壓力體驗</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setScreen("intro")}
                        className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3.5 text-base font-bold text-[#101827] transition hover:bg-[#E4C98F] shadow-[0_12px_32px_rgba(217,185,120,0.3)]"
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
                          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#65C99A]/45 bg-[#101827] px-5 py-2.5 text-sm font-semibold text-[#65C99A] transition hover:bg-[#65C99A]/10"
                        >
                          繼續先前的探索（檔案 {session.sessionCode}）
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
                    alt="來自過去的時光邀請信封與黃銅羅盤"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A40] via-[#1B2A40]/35 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#D9B978]">
                      PROLOGUE・故事序章
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-bold text-[#F3F1EA] sm:text-3xl">
                      一封來自過去的信
                    </h2>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <div className="space-y-3.5 text-base leading-relaxed text-[#F3F1EA]/90">
                    <p>
                      某一天，復興實中的檔案室裡出現了一封蓋著梅花與火炬蠟印的舊信封。信紙上工整地記錄著這座校園從民國三十五年起步至今的故事，以及八個散落在校園各個角落、等待被重新看見的秘密。
                    </p>
                    <p>
                      你將以「校園探索員」的身份接下這份特別的委託：從校門口出發，透過觀察建築、推敲校史、解讀校徽、認識綠色生態與校園幕後團隊，逐一找回
                      <span className="font-semibold text-[#D9B978]"> 八枚記憶碎片 </span>
                      ，並在最後解開時光的最終謎題。
                    </p>
                  </div>

                  {/* Safety Pledge */}
                  <div className="rounded-2xl border border-[#65C99A]/35 bg-[#101827] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#65C99A]">
                      <ShieldCheck className="h-5 w-5" />
                      校園探索員安全與禮儀約定
                    </div>
                    <ul className="grid gap-1.5 text-xs text-[#F3F1EA]/80 sm:grid-cols-2">
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
                      className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#F3F1EA]/20 bg-[#101827] px-6 py-3 text-sm font-medium text-[#F3F1EA]/85 hover:border-[#D9B978]"
                    >
                      返回封面
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("setup")}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3 text-base font-bold text-[#101827] transition hover:bg-[#E4C98F]"
                    >
                      登錄探索員檔案並出發
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* SCREEN 03: PLAYER SETUP */}
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
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#D9B978]">
                    EXPLORER REGISTRATION
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#F3F1EA]">
                    選擇探索模式與建立檔案
                  </h2>
                  <p className="mt-1 text-xs text-[#F3F1EA]/70">
                    使用單一裝置即可進行單人或小組探索；系統將保存進度於雲端資料庫與本機，重新整理不會遺失紀錄。
                  </p>
                </div>

                {/* Mode Switcher */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupMode("solo")}
                    className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                      setupMode === "solo"
                        ? "border-[#D9B978] bg-[#101827] ring-2 ring-[#D9B978]/35"
                        : "border-[#F3F1EA]/15 bg-[#101827]/60 hover:border-[#D9B978]/50"
                    }`}
                  >
                    <User className="h-5 w-5 text-[#D9B978]" />
                    <div>
                      <p className="text-sm font-bold text-[#F3F1EA]">A. 單人模式</p>
                      <p className="text-xs text-[#F3F1EA]/65">獨立展開校園解謎</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupMode("team")}
                    className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                      setupMode === "team"
                        ? "border-[#D9B978] bg-[#101827] ring-2 ring-[#D9B978]/35"
                        : "border-[#F3F1EA]/15 bg-[#101827]/60 hover:border-[#D9B978]/50"
                    }`}
                  >
                    <Users className="h-5 w-5 text-[#65C99A]" />
                    <div>
                      <p className="text-sm font-bold text-[#F3F1EA]">B. 組隊模式</p>
                      <p className="text-xs text-[#F3F1EA]/65">同學共用一支手機合作</p>
                    </div>
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#D9B978]">
                      {setupMode === "team" ? "隊長／主要記錄員名稱" : "探索員名稱"}
                    </label>
                    <input
                      type="text"
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      placeholder="例如：八年仁班 小光"
                      maxLength={40}
                      className="mt-1.5 w-full rounded-xl border border-[#D9B978]/30 bg-[#101827] px-4 py-3 text-sm text-[#F3F1EA] placeholder:text-[#F3F1EA]/35 focus:border-[#D9B978] focus:outline-none"
                      required
                    />
                  </div>

                  {setupMode === "team" && (
                    <div>
                      <label className="block text-xs font-semibold text-[#65C99A]">
                        探索小隊名稱
                      </label>
                      <input
                        type="text"
                        value={teamNameInput}
                        onChange={(e) => setTeamNameInput(e.target.value)}
                        placeholder="例如：紅磚火炬探索隊"
                        maxLength={40}
                        className="mt-1.5 w-full rounded-xl border border-[#65C99A]/35 bg-[#101827] px-4 py-3 text-sm text-[#F3F1EA] placeholder:text-[#F3F1EA]/35 focus:border-[#65C99A] focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  {setupError && (
                    <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200">
                      {setupError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={setupBusy}
                    className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3.5 text-base font-bold text-[#101827] transition hover:bg-[#E4C98F] disabled:opacity-60"
                  >
                    {setupBusy ? "建立檔案中..." : "領取探索羅盤・進入校園總覽"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>

                {/* Resume via Session Code */}
                <div className="border-t border-[#F3F1EA]/10 pt-5">
                  <form onSubmit={handleResumeByCode} className="space-y-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#F3F1EA]/75">
                      <KeyRound className="h-3.5 w-3.5 text-[#D9B978]" />
                      已有先前建立的探索檔案代碼？輸入代碼繼續探險：
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resumeCodeInput}
                        onChange={(e) => setResumeCodeInput(e.target.value.toUpperCase())}
                        placeholder="輸入 6 碼代碼（例：FH9K2A）"
                        maxLength={8}
                        className="flex-1 rounded-xl border border-[#F3F1EA]/15 bg-[#101827] px-3.5 py-2.5 font-mono text-sm uppercase text-[#F3F1EA] placeholder:text-[#F3F1EA]/35 focus:border-[#D9B978] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={setupBusy || !resumeCodeInput.trim()}
                        className="rounded-xl border border-[#D9B978]/45 bg-[#101827] px-4 py-2.5 text-xs font-bold text-[#D9B978] hover:bg-[#D9B978]/15 disabled:opacity-45"
                      >
                        載入進度
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.section>
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#D9B978]/15 px-3 py-1 text-xs font-semibold text-[#D9B978]">
                        {session.mode === "team" ? (
                          <Users className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                        {session.mode === "team" ? "組隊探索模式" : "單人探索模式"}
                      </span>
                      <span className="rounded-full border border-[#F3F1EA]/15 bg-[#101827] px-3 py-1 font-mono text-xs text-[#F3F1EA]/80">
                        檔案代碼：{session.sessionCode}
                      </span>
                    </div>

                    <h1 className="font-serif text-2xl font-bold text-[#F3F1EA] sm:text-3xl">
                      {session.mode === "team" && session.teamName
                        ? `${session.teamName}・${session.playerName}`
                        : `${session.playerName} 的復興檔案`}
                    </h1>
                    <p className="text-xs text-[#F3F1EA]/70">
                      建議以 50 分鐘漫步校園節奏進行探索（無倒數計時，請放心觀察與推理）
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setScreen("map")}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3 text-sm font-bold text-[#101827] transition hover:bg-[#E4C98F] shadow-[0_10px_28px_rgba(217,185,120,0.28)]"
                    >
                      <MapIcon className="h-4 w-4" />
                      開啟互動校園地圖
                    </button>

                    <button
                      type="button"
                      disabled={!allEightDone && !settings.forceUnlockAll}
                      onClick={() => {
                        setPuzzleFeedback(null);
                        setScreen(session.finalSolved ? "ending" : "final-puzzle");
                      }}
                      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${
                        allEightDone || settings.forceUnlockAll
                          ? "bg-[#65C99A] text-[#101827] hover:bg-[#7AD6AA]"
                          : "cursor-not-allowed border border-[#F3F1EA]/15 bg-[#101827] text-[#F3F1EA]/45"
                      }`}
                    >
                      {session.finalSolved ? (
                        <>
                          <Sparkles className="h-4 w-4" /> 查看結局與成績單
                        </>
                      ) : allEightDone || settings.forceUnlockAll ? (
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

                {/* Progress Stats Row */}
                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#F3F1EA]/65">已完成任務</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#F3F1EA]">
                      {session.completedMissions.length}{" "}
                      <span className="text-sm text-[#F3F1EA]/50">/ 8</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#F3F1EA]/65">記憶碎片收集</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#65C99A]">
                      {session.fragmentsCollected.length}{" "}
                      <span className="text-sm text-[#F3F1EA]/50">/ 8 枚</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#F3F1EA]/65">目前積分</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#D9B978]">
                      {session.score}{" "}
                      <span className="text-sm text-[#F3F1EA]/50">/ 100</span>
                    </p>
                  </div>
                  <div className="archive-inset rounded-2xl p-3.5">
                    <p className="text-xs text-[#F3F1EA]/65">已探索時間</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[#F3F1EA]">
                      {formatDuration(elapsedSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Memory Fragments Collection */}
              <div className="archive-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-lg font-bold text-[#F3F1EA] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#D9B978]" />
                    記憶碎片典藏盒（{session.completedMissions.length} / 8）
                  </h2>
                  <span className="text-xs text-[#F3F1EA]/60">
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
                            ? "border-[#65C99A]/45 bg-[#101827] text-[#65C99A] shadow-[0_0_20px_rgba(101,201,154,0.14)]"
                            : "border-[#F3F1EA]/10 bg-[#101827]/50 text-[#F3F1EA]/35"
                        }`}
                      >
                        <div className="mb-1.5">
                          {collected ? (
                            <FragmentSymbolIcon symbol={m.fragmentSymbol} className="h-6 w-6 text-[#D9B978]" />
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
                  <h2 className="font-serif text-lg font-bold text-[#F3F1EA] flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-[#D9B978]" />
                    八大校園探索任務清單
                  </h2>
                  <button
                    type="button"
                    onClick={() => setScreen("map")}
                    className="text-xs font-semibold text-[#D9B978] hover:underline"
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
                            ? "border-[#65C99A]/40 bg-[#101827] hover:border-[#65C99A]"
                            : isUnlocked
                            ? "border-[#D9B978]/30 bg-[#101827] hover:border-[#D9B978]"
                            : "cursor-not-allowed border-[#F3F1EA]/10 bg-[#101827]/45 opacity-60"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#D9B978]">
                              {m.code}
                            </span>
                            <span className="font-serif text-base font-bold text-[#F3F1EA]">
                              {m.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#F3F1EA]/70">{m.locationName}</p>
                        </div>

                        <span className="shrink-0 pt-0.5">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#65C99A]/15 px-2.5 py-1 text-[11px] font-semibold text-[#65C99A]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> 完成
                            </span>
                          ) : isUnlocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#D9B978]/15 px-2.5 py-1 text-[11px] font-semibold text-[#D9B978]">
                              <Compass className="h-3.5 w-3.5" /> 探索
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
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
                  <h1 className="font-serif text-2xl font-bold text-[#F3F1EA]">
                    復興校園探索互動地圖
                  </h1>
                  <p className="text-xs text-[#F3F1EA]/70">
                    點擊地圖上的發光任務節點開始探索，可自由縮放或拖曳查看各區建築特色。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen("dashboard")}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D9B978]/35 bg-[#1B2A40] px-4 py-2 text-xs font-semibold text-[#D9B978] hover:bg-[#D9B978]/10"
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

      {/* SCREEN 12: ADMIN CONSOLE OVERLAY */}
      {showAdmin && (
        <AdminConsole
          activeSession={session}
          onClose={() => setShowAdmin(false)}
          onRefreshGameData={async () => {
            await loadBootstrap(session?.id ?? null);
          }}
          onDirectTestMission={handleDirectTestMission}
          onResetCurrentSession={handleResetCurrentSession}
        />
      )}

      {/* OFFICIAL SOURCES & SAFETY MODAL */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070B14]/85 p-4 backdrop-blur-sm">
          <div className="archive-card my-auto w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#D9B978]/20 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#D9B978]" />
                <h2 className="font-serif text-xl font-bold text-[#F3F1EA]">
                  官方資料來源與校園安全守則
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                aria-label="關閉資料來源視窗"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F3F1EA]/20 bg-[#101827] text-[#F3F1EA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-[#65C99A]/35 bg-[#101827] p-4 space-y-1.5">
              <p className="text-xs font-bold text-[#65C99A]">活動安全守則</p>
              <p className="text-xs leading-relaxed text-[#F3F1EA]/85">
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
                  className="block rounded-xl border border-[#F3F1EA]/12 bg-[#101827] p-3.5 transition hover:border-[#D9B978]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#D9B978]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D9B978]">
                      {src.category}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#D9B978]" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#F3F1EA]">{src.title}</p>
                  <p className="mt-0.5 text-xs text-[#F3F1EA]/65">{src.note}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
