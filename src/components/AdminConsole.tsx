"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AdminMission, GameSession, GameSettings } from "@/types/game";
import CampusMapSVG from "./CampusMapSVG";
import {
  Archive,
  CheckCircle2,
  Eye,
  KeyRound,
  LockOpen,
  LogOut,
  MapPin,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  X,
} from "lucide-react";

interface AdminConsoleProps {
  activeSession: GameSession | null;
  onClose: () => void;
  onRefreshGameData: () => Promise<void>;
  onDirectTestMission: (missionId: number) => Promise<void>;
  onResetCurrentSession: () => Promise<void>;
}

export default function AdminConsole({
  activeSession,
  onClose,
  onRefreshGameData,
  onDirectTestMission,
  onResetCurrentSession,
}: AdminConsoleProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    id: 1,
    historyMuseumOpen: true,
    forceUnlockAll: false,
  });
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [editingId, setEditingId] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Local editable form state for the selected mission
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formLocationName, setFormLocationName] = useState("");
  const [formLocationNote, setFormLocationNote] = useState("");
  const [formMapX, setFormMapX] = useState(250);
  const [formMapY, setFormMapY] = useState(500);
  const [formPrompt, setFormPrompt] = useState("");
  const [formHint1, setFormHint1] = useState("");
  const [formHint2, setFormHint2] = useState("");
  const [formUnlocked, setFormUnlocked] = useState(true);
  const [formAnswerJson, setFormAnswerJson] = useState("");
  const lastFormMissionRef = useRef<AdminMission | null>(null);

  const loadAdminState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setMissions(data.missions || []);
      if (data.settings) setSettings(data.settings);
      setSessions(data.sessions || []);
      setAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This effect intentionally starts the authenticated data-fetch lifecycle on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdminState();
  }, []);

  // Populate editor form whenever editingId or missions changes
  useEffect(() => {
    const m = missions.find((item) => item.id === editingId);
    if (!m) return;
    const previous = lastFormMissionRef.current;
    if (previous?.id === m.id) {
      const { mapX: _previousX, mapY: _previousY, ...previousContent } = previous;
      const { mapX: _nextX, mapY: _nextY, ...nextContent } = m;
      if (JSON.stringify(previousContent) === JSON.stringify(nextContent)) {
        // A drag only changed marker coordinates; preserve unsaved editor fields.
        setFormMapX(m.mapX);
        setFormMapY(m.mapY);
        lastFormMissionRef.current = m;
        return;
      }
    }
    // Keep the editable form synchronized when its selected record changes.
    setFormTitle(m.title);
    setFormSubtitle(m.subtitle);
    setFormLocationName(m.locationName);
    setFormLocationNote(m.locationNote);
    setFormMapX(m.mapX);
    setFormMapY(m.mapY);
    setFormPrompt(m.promptText);
    setFormHint1(m.hint1);
    setFormHint2(m.hint2);
    setFormUnlocked(m.defaultUnlocked);
    setFormAnswerJson(JSON.stringify(m.correctAnswer, null, 2));
    lastFormMissionRef.current = m;
  }, [editingId, missions]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "驗證失敗");
        return;
      }
      setPasscode("");
      await loadAdminState();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setMissions([]);
  };

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggleSetting = async (
    key: "historyMuseumOpen" | "forceUnlockAll",
    value: boolean
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update-settings",
          settings: { [key]: value },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions);
        setSettings(data.settings);
        await onRefreshGameData();
        notify(
          key === "historyMuseumOpen"
            ? `已切換校史館狀態為：${value ? "開放中" : "休館中（自動啟用替代檔案）"}`
            : `已切換全域解鎖測試模式為：${value ? "全部關卡開放" : "依正常進度解鎖"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMissionPositionChange = async (
    missionId: number,
    x: number,
    y: number,
    committed: boolean
  ) => {
    setMissions((current) => current.map((mission) =>
      mission.id === missionId ? { ...mission, mapX: x, mapY: y } : mission
    ));
    if (missionId === editingId) {
      setFormMapX(x);
      setFormMapY(y);
    }
    if (!committed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update-mission",
          missionId,
          patch: { mapX: x, mapY: y },
        }),
      });
      if (res.ok) {
        await onRefreshGameData();
        notify(`Mission ${String(missionId).padStart(2, "0")} 地圖位置已儲存（X ${x}、Y ${y}）。`);
      } else {
        const data = await res.json();
        notify(data.error || "地圖位置儲存失敗，請稍後再試。");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedAnswer: unknown;
    try {
      parsedAnswer = JSON.parse(formAnswerJson);
    } catch {
      notify("正確答案 JSON 格式有誤，請檢查引號與括號後再儲存。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update-mission",
          missionId: editingId,
          patch: {
            title: formTitle,
            subtitle: formSubtitle,
            locationName: formLocationName,
            locationNote: formLocationNote,
            mapX: formMapX,
            mapY: formMapY,
            promptText: formPrompt,
            hint1: formHint1,
            hint2: formHint2,
            defaultUnlocked: formUnlocked,
            correctAnswer: parsedAnswer,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions);
        await onRefreshGameData();
        notify(`Mission 0${editingId}「${formTitle}」已儲存並即時生效！`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDefaults = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reset-defaults" }),
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions);
        setSettings(data.settings);
        await onRefreshGameData();
        notify("已將所有八個關卡與系統設定還原至初始驗證版本！");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetTargetSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reset-session", sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (activeSession?.id === sessionId) {
          await onRefreshGameData();
        }
        notify("已重置該探索檔案的進度與積分。");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedMission = missions.find((m) => m.id === editingId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#070B14]/90 p-3 sm:p-6 backdrop-blur-sm">
      <div className="archive-card my-auto w-full max-w-5xl rounded-3xl p-5 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9B978]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D9B978]/15 text-[#D9B978]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#F3F1EA]">
                管理員與教師測試控制台
              </h2>
              <p className="text-xs text-[#F3F1EA]/65">
                檢視解答、調整關卡內容與地圖座標、模擬校史館開關、重置進度與直達測試
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#F3F1EA]/20 bg-[#101827] px-3 py-2 text-xs text-[#F3F1EA]/80 hover:border-[#D9B978]"
              >
                <LogOut className="h-3.5 w-3.5" /> 登出管理員
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉管理員控制台"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3F1EA]/20 bg-[#101827] text-[#F3F1EA] hover:border-[#D9B978]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Passcode Gate */}
        {authenticated === false && (
          <form onSubmit={handleLogin} className="mx-auto max-w-md space-y-4 py-6">
            <div className="rounded-2xl border border-[#D9B978]/25 bg-[#101827] p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#D9B978]">
                <KeyRound className="h-4 w-4" />
                請輸入管理員驗證通行碼
              </div>
              <p className="text-xs leading-relaxed text-[#F3F1EA]/70">
                為避免一般學生在探索期間直接看到題目解答，測試與編輯控制台受伺服器端安全驗證保護。教師或工作人員請輸入後台通行碼（預設值可於教師手冊或環境變數 `ADMIN_PASSCODE` 設定）。
              </p>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="請輸入管理員通行碼"
                className="w-full rounded-xl border border-[#D9B978]/35 bg-[#1B2A40] px-4 py-3 text-sm text-[#F3F1EA] placeholder:text-[#F3F1EA]/40 focus:border-[#D9B978] focus:outline-none"
                required
              />
              {authError && <p className="text-xs text-rose-300">{authError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D9B978] py-3 text-sm font-bold text-[#101827] transition hover:bg-[#E4C98F] disabled:opacity-60"
              >
                {loading ? "驗證中..." : "解鎖管理員控制台"}
              </button>
            </div>
          </form>
        )}

        {/* Authenticated Admin Body */}
        {authenticated && (
          <div className="space-y-6">
            {statusMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-[#65C99A]/45 bg-[#65C99A]/15 px-4 py-2.5 text-sm text-[#65C99A]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {statusMessage}
              </div>
            )}

            {/* Global Toggles & Reset Tools */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleToggleSetting("historyMuseumOpen", !settings.historyMuseumOpen)
                }
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  settings.historyMuseumOpen
                    ? "border-[#65C99A]/45 bg-[#101827]"
                    : "border-[#D9B978]/55 bg-[#D9B978]/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Archive className="h-5 w-5 text-[#D9B978]" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      settings.historyMuseumOpen
                        ? "bg-[#65C99A]/20 text-[#65C99A]"
                        : "bg-[#D9B978] text-[#101827]"
                    }`}
                  >
                    {settings.historyMuseumOpen ? "開放中" : "休館模擬中"}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#F3F1EA]">
                    模擬校史館開／閉狀態
                  </p>
                  <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
                    點擊切換；休館時 M04 自動呈現數位替代檔案
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleToggleSetting("forceUnlockAll", !settings.forceUnlockAll)
                }
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                  settings.forceUnlockAll
                    ? "border-[#D9B978] bg-[#D9B978]/15"
                    : "border-[#F3F1EA]/15 bg-[#101827]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <LockOpen className="h-5 w-5 text-[#D9B978]" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      settings.forceUnlockAll
                        ? "bg-[#D9B978] text-[#101827]"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {settings.forceUnlockAll ? "全解鎖測試 ON" : "正常解鎖流程"}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#F3F1EA]">
                    任務解鎖狀態覆寫
                  </p>
                  <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
                    開啟後 M08 與任意關卡皆可直接進入測試
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading || !activeSession}
                onClick={async () => {
                  await onResetCurrentSession();
                  await loadAdminState();
                  notify("已重置目前遊戲探索進度！");
                }}
                className="flex flex-col justify-between rounded-2xl border border-[#F3F1EA]/15 bg-[#101827] p-4 text-left transition hover:border-[#D9B978] disabled:opacity-45"
              >
                <RotateCcw className="h-5 w-5 text-[#D9B978]" />
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#F3F1EA]">
                    重置目前玩家進度
                  </p>
                  <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
                    {activeSession
                      ? `目前檔案：${activeSession.sessionCode}（${activeSession.score} 分）`
                      : "目前尚未啟動探索檔案"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleRestoreDefaults}
                className="flex flex-col justify-between rounded-2xl border border-[#F3F1EA]/15 bg-[#101827] p-4 text-left transition hover:border-[#65C99A]"
              >
                <RefreshCw className="h-5 w-5 text-[#65C99A]" />
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#F3F1EA]">
                    還原預設題庫與座標
                  </p>
                  <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
                    將八道關卡題目、解答與地圖座標重置為驗證預設值
                  </p>
                </div>
              </button>
            </div>

            {/* Mission Selector Tabs + Editor */}
            <div className="grid gap-5 lg:grid-cols-12">
              {/* Left: All 8 Missions List */}
              <div className="lg:col-span-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D9B978]">
                  選擇關卡檢視／編輯／直接測試
                </p>
                {missions.map((m) => {
                  const selected = m.id === editingId;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-3 transition ${
                        selected
                          ? "border-[#D9B978] bg-[#101827]"
                          : "border-[#F3F1EA]/12 bg-[#101827]/60 hover:border-[#D9B978]/45"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(m.id)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#D9B978]">
                              {m.code}
                            </span>
                            <span className="text-sm font-bold text-[#F3F1EA]">
                              {m.title}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#F3F1EA]/60">
                            {m.locationName}・({m.mapX}, {m.mapY})
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDirectTestMission(m.id);
                          }}
                          title="直接測試此關卡"
                          className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#D9B978] px-2.5 text-xs font-bold text-[#101827] hover:bg-[#E4C98F]"
                        >
                          <Play className="h-3 w-3" /> 測試
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Selected Mission Inspector & Editor */}
              {selectedMission && (
                <form
                  onSubmit={handleSaveMission}
                  className="lg:col-span-8 rounded-2xl border border-[#D9B978]/25 bg-[#101827] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F1EA]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-[#D9B978]" />
                      <h3 className="font-serif text-lg font-bold text-[#F3F1EA]">
                        編輯 {selectedMission.code}：{selectedMission.title}
                      </h3>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-[#F3F1EA]/85 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUnlocked}
                        onChange={(e) => setFormUnlocked(e.target.checked)}
                        className="h-4 w-4 accent-[#D9B978]"
                      />
                      預設解鎖狀態（defaultUnlocked）
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-[#F3F1EA]/70">任務名稱</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-sm text-[#F3F1EA]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#F3F1EA]/70">副標題</label>
                      <input
                        type="text"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-sm text-[#F3F1EA]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#F3F1EA]/70">探索地點名稱</label>
                      <input
                        type="text"
                        value={formLocationName}
                        onChange={(e) => setFormLocationName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-sm text-[#F3F1EA]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#F3F1EA]/70">地點示意註記</label>
                      <input
                        type="text"
                        value={formLocationNote}
                        onChange={(e) => setFormLocationNote(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-sm text-[#F3F1EA]"
                      />
                    </div>
                  </div>

                  {/* Schematic Map Coordinate Adjustment */}
                  <div className="rounded-xl border border-[#D9B978]/25 bg-[#1B2A40]/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#D9B978]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        示意地圖座標位置微調（SVG 1000×650）
                      </span>
                      <span className="font-mono">
                        X: {formMapX} / Y: {formMapY}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-[#D9B978]/20">
                      <CampusMapSVG
                        missions={missions.map((mission) =>
                          mission.id === editingId
                            ? { ...mission, mapX: formMapX, mapY: formMapY }
                            : mission
                        )}
                        completedMissions={[]}
                        unlockedIds={missions.map((mission) => mission.id)}
                        onSelectMission={(mission) => setEditingId(mission.id)}
                        adminEditable
                        selectedMissionId={editingId}
                        onMissionPositionChange={handleMissionPositionChange}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-[#F3F1EA]/75">
                        水平位置 X（40–960）
                        <input
                          type="range"
                          min={40}
                          max={960}
                          value={formMapX}
                          onChange={(e) => setFormMapX(Number(e.target.value))}
                          className="mt-1 w-full accent-[#D9B978]"
                        />
                      </label>
                      <label className="text-xs text-[#F3F1EA]/75">
                        垂直位置 Y（40–610）
                        <input
                          type="range"
                          min={40}
                          max={610}
                          value={formMapY}
                          onChange={(e) => setFormMapY(Number(e.target.value))}
                          className="mt-1 w-full accent-[#D9B978]"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#F3F1EA]/70">題目敘述</label>
                    <textarea
                      rows={2}
                      value={formPrompt}
                      onChange={(e) => setFormPrompt(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-sm text-[#F3F1EA]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-[#D9B978]">第一個提示（不扣分）</label>
                      <textarea
                        rows={2}
                        value={formHint1}
                        onChange={(e) => setFormHint1(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-xs text-[#F3F1EA]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#65C99A]">第二個提示（不扣分）</label>
                      <textarea
                        rows={2}
                        value={formHint2}
                        onChange={(e) => setFormHint2(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#F3F1EA]/15 bg-[#1B2A40] px-3 py-2 text-xs text-[#F3F1EA]"
                      />
                    </div>
                  </div>

                  {/* Verified Correct Answer Inspector */}
                  <div className="rounded-xl border border-[#65C99A]/35 bg-[#131F31] p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#65C99A]">
                      <Eye className="h-4 w-4" />
                      正確答案檢視與編輯（僅管理員可見・JSON 格式）
                    </div>
                    <textarea
                      rows={3}
                      value={formAnswerJson}
                      onChange={(e) => setFormAnswerJson(e.target.value)}
                      className="w-full rounded-xl border border-[#65C99A]/30 bg-[#101827] px-3 py-2 font-mono text-xs text-[#65C99A]"
                    />
                    <p className="text-[11px] text-[#F3F1EA]/65">
                      答案說明：{selectedMission.explanation}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D9B978] px-5 py-2 text-sm font-bold text-[#101827] hover:bg-[#E4C98F] disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      儲存此關卡修改
                    </button>
                    <button
                      type="button"
                      onClick={() => onDirectTestMission(selectedMission.id)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#65C99A]/45 bg-[#1B2A40] px-4 py-2 text-sm font-semibold text-[#65C99A] hover:bg-[#65C99A]/10"
                    >
                      <Play className="h-4 w-4" />
                      立即進入此關卡測試
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Active Sessions Overview */}
            {sessions.length > 0 && (
              <div className="rounded-2xl border border-[#F3F1EA]/12 bg-[#101827] p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D9B978]">
                  最近探索檔案紀錄（PostgreSQL 資料庫即時狀態）
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sessions.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#F3F1EA]/10 bg-[#1B2A40] px-3 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#F3F1EA]">
                          {s.mode === "team" && s.teamName
                            ? `${s.teamName} (${s.playerName})`
                            : s.playerName}
                        </p>
                        <p className="font-mono text-[11px] text-[#D9B978]">
                          {s.sessionCode}・{s.completedMissions.length}/8 關・{s.score}分
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResetTargetSession(s.id)}
                        className="rounded-lg border border-[#F3F1EA]/20 px-2 py-1 text-[11px] text-[#F3F1EA]/75 hover:border-[#D9B978] hover:text-[#D9B978]"
                      >
                        重置
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
