"use client";

import React, { useMemo, useState } from "react";
import type {
  GameSettings,
  PublicMission,
  SolvedMissionDetail,
} from "@/types/game";
import InteractiveEmblem from "./InteractiveEmblem";
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Sparkles,
  ZoomIn,
  X,
} from "lucide-react";

interface PuzzlePlayfieldProps {
  mode: "detail" | "puzzle";
  mission: PublicMission;
  settings: GameSettings;
  isSolved: boolean;
  solvedDetail?: SolvedMissionDetail;
  allSolvedDetails: Record<number, SolvedMissionDetail>;
  hintsRevealed: number;
  submitting: boolean;
  feedback: { type: "error" | "success"; message: string } | null;
  onStartPuzzle: () => void;
  onBackToMap: () => void;
  onBackToDetail: () => void;
  onOpenHint: (stage: 1 | 2) => void;
  onSubmitAnswer: (answer: unknown) => void;
}

export default function PuzzlePlayfield({
  mode,
  mission,
  settings,
  isSolved,
  solvedDetail,
  allSolvedDetails,
  hintsRevealed,
  submitting,
  feedback,
  onStartPuzzle,
  onBackToMap,
  onBackToDetail,
  onOpenHint,
  onSubmitAnswer,
}: PuzzlePlayfieldProps) {
  const payload = mission.puzzlePayload;

  // 1. Image Recognition state (M01)
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // 2. Logic Wheel state (M02)
  const [logicAnswers, setLogicAnswers] = useState<Record<string, string>>({});

  // 3. Generic Matching state (M03, M05, M06 pairs, M07)
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [pairAnswers, setPairAnswers] = useState<Record<string, string>>({});

  // 4. Timeline Order state (M04)
  const initialTimelineOrder = useMemo(() => {
    const items = (payload.items as { id: string }[] | undefined) ?? [];
    return items.map((item) => item.id);
  }, [payload.items]);
  const [timelineOrder, setTimelineOrder] = useState<string[]>(initialTimelineOrder);

  // 5. Eco Safety answer (M06)
  const [ecoSafety, setEcoSafety] = useState<string>("");

  // 6. Final Synthesis state (M08)
  const [synthAnswers, setSynthAnswers] = useState<Record<string, string>>({});
  const [showClueDrawer, setShowClueDrawer] = useState(false);

  // Museum fallback expanded state
  const [showMuseumArchive, setShowMuseumArchive] = useState(!settings.historyMuseumOpen);

  // Move timeline item up/down
  const moveTimelineItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= timelineOrder.length) return;
    const next = [...timelineOrder];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setTimelineOrder(next);
  };

  // Tap-to-pair helper
  const handlePairSelect = (rightId: string) => {
    if (!activeLeftId) return;
    setPairAnswers((prev) => ({
      ...prev,
      [activeLeftId]: rightId,
    }));
    setActiveLeftId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switch (mission.puzzleType) {
      case "image-recognition":
        onSubmitAnswer(selectedImageId);
        break;
      case "logic-choice":
        onSubmitAnswer(logicAnswers);
        break;
      case "map-matching":
      case "symbol-decode":
      case "office-matching":
        onSubmitAnswer(pairAnswers);
        break;
      case "timeline-sort":
        onSubmitAnswer(timelineOrder);
        break;
      case "eco-matching":
        onSubmitAnswer({ pairs: pairAnswers, safety: ecoSafety });
        break;
      case "final-synthesis":
        onSubmitAnswer(synthAnswers);
        break;
    }
  };

  // SCREEN 06: MISSION DETAIL
  if (mode === "detail") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          type="button"
          onClick={onBackToMap}
          className="inline-flex items-center gap-1.5 text-sm text-[#D9B978] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> 返回互動校園地圖
        </button>

        <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D9B978]/15 px-3 py-1 font-mono text-xs font-semibold text-[#D9B978]">
                MISSION {mission.id.toString().padStart(2, "0")}・10 分
              </span>
              <h1 className="mt-2 font-serif text-2xl font-bold text-[#F3F1EA] sm:text-3xl">
                {mission.title}
              </h1>
              <p className="mt-1 text-sm text-[#D9B978]/90">{mission.subtitle}</p>
            </div>

            {isSolved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#65C99A]/15 px-3.5 py-1.5 text-xs font-semibold text-[#65C99A]">
                <CheckCircle2 className="h-4 w-4" /> 已完成任務
              </span>
            )}
          </div>

          {/* Location Card */}
          <div className="archive-inset rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F1EA]">
              <MapPin className="h-4 w-4 text-[#D9B978]" />
              探索地點：{mission.locationName}
            </div>
            <p className="flex items-center gap-2 text-xs text-[#F3F1EA]/65 pl-6">
              <Compass className="h-3.5 w-3.5" />
              {mission.locationNote}
            </p>
          </div>

          {/* Story Background */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B978]">
              檔案故事背景
            </h2>
            <p className="text-base leading-relaxed text-[#F3F1EA]/90">
              {mission.storyBackground}
            </p>
          </div>

          {/* History Museum Status Notice for Mission 04 */}
          {mission.id === 4 && (
            <div
              className={`rounded-2xl border p-4 ${
                settings.historyMuseumOpen
                  ? "border-[#65C99A]/35 bg-[#65C99A]/10"
                  : "border-[#D9B978]/45 bg-[#D9B978]/10"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F1EA]">
                <Archive className="h-4 w-4 text-[#D9B978]" />
                {settings.historyMuseumOpen
                  ? "目前設定：校史館開放中（亦可隨時查閱內建數位校史檔案）"
                  : "目前設定：校史館休館中 — 已啟用數位校史替代檔案室"}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#F3F1EA]/80">
                {settings.historyMuseumOpen
                  ? "歡迎安靜觀察校史相關資訊，解謎時若需校對年份也可直接使用遊戲內的官方資料夾。"
                  : "校史館未開放沒關係！進入關卡後系統將自動提供完整官方校史文獻，讓你可以安靜坐在安全區域順利通關。"}
              </p>
            </div>
          )}

          {/* Safety Rule */}
          <div className="rounded-2xl border border-[#D9B978]/25 bg-[#101827] p-4 flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#D9B978]" />
            <div>
              <p className="text-xs font-semibold text-[#D9B978]">校園探索安全守則</p>
              <p className="mt-1 text-xs leading-relaxed text-[#F3F1EA]/80">
                {mission.safetyNotice}
              </p>
            </div>
          </div>

          {/* Fragment Preview & Source */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F1EA]/10 pt-4 text-xs text-[#F3F1EA]/70">
            <span>過關獎勵：記憶碎片「{mission.fragmentName}」</span>
            <a
              href={mission.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#D9B978] hover:underline"
            >
              參考出處：{mission.sourceTitle} <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={onStartPuzzle}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3.5 text-base font-bold text-[#101827] transition hover:bg-[#E4C98F] shadow-[0_12px_32px_rgba(217,185,120,0.28)]"
          >
            <Sparkles className="h-5 w-5" />
            {isSolved ? "進入關卡（查看解答與複習）" : "開始解開謎題"}
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 07 + 08: PUZZLE INTERFACE + HINTS
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToDetail}
          className="inline-flex items-center gap-1.5 text-sm text-[#D9B978] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> 返回關卡說明
        </button>
        <span className="font-mono text-xs text-[#F3F1EA]/65">
          MISSION {mission.id.toString().padStart(2, "0")}・{mission.title}
        </span>
      </div>

      {/* Already solved review card */}
      {isSolved && solvedDetail && (
        <div className="rounded-2xl border border-[#65C99A]/45 bg-[#65C99A]/10 p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#65C99A]">
            <CheckCircle2 className="h-5 w-5" />
            你已成功獲得碎片「{solvedDetail.fragmentName}」（+10 分）
          </div>
          <p className="text-sm leading-relaxed text-[#F3F1EA]/90">
            {solvedDetail.explanation}
          </p>
          <p className="text-xs text-[#D9B978]">{solvedDetail.clueSummary}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="archive-card rounded-3xl p-5 sm:p-8 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D9B978]/15 px-3 py-1 text-xs font-semibold text-[#D9B978]">
            互動解謎挑戰
          </span>
          <h2 className="font-serif text-xl font-bold leading-snug text-[#F3F1EA] sm:text-2xl">
            {mission.promptText}
          </h2>
        </div>

        {/* PUZZLE 1: IMAGE RECOGNITION */}
        {mission.puzzleType === "image-recognition" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              (payload.options as {
                id: string;
                label: string;
                caption: string;
                imageUrl: string;
              }[]) ?? []
            ).map((opt) => {
              const active = selectedImageId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedImageId(opt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedImageId(opt.id);
                    }
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border transition ${
                    active
                      ? "border-[#D9B978] bg-[#101827] ring-2 ring-[#D9B978]/40"
                      : "border-[#F3F1EA]/15 bg-[#101827]/70 hover:border-[#D9B978]/55"
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D1422]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={opt.imageUrl}
                      alt={opt.caption}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomImageUrl(opt.imageUrl);
                      }}
                      aria-label={`放大檢視${opt.label}`}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#101827]/80 text-[#F3F1EA] hover:bg-[#D9B978] hover:text-[#101827]"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#D9B978]">
                        {opt.label}
                      </span>
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#D9B978] px-2 py-0.5 text-[11px] font-bold text-[#101827]">
                          <Check className="h-3 w-3" /> 已選取
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[#F3F1EA]/85">
                      {opt.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PUZZLE 2: LOGIC CHOICE (FOUR-WORD MOTTO) */}
        {mission.puzzleType === "logic-choice" && (
          <div className="space-y-5">
            {/* Live Preview of the 4-character Motto */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 rounded-2xl border border-[#D9B978]/25 bg-[#101827] py-4 px-3">
              {(
                (payload.slots as {
                  id: string;
                  prefix: string;
                  choices: string[];
                  desc: string;
                }[]) ?? []
              ).map((slot, idx) => (
                <div
                  key={slot.id}
                  className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl border border-[#D9B978]/50 bg-[#1B2A40] font-serif text-2xl font-bold text-[#D9B978] shadow-inner"
                >
                  {logicAnswers[slot.id] || (
                    <span className="text-base text-[#F3F1EA]/30">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {(
                (payload.slots as {
                  id: string;
                  prefix: string;
                  choices: string[];
                  desc: string;
                }[]) ?? []
              ).map((slot, idx) => (
                <div
                  key={slot.id}
                  className="archive-inset rounded-2xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#F3F1EA]">
                      第 {idx + 1} 字：{slot.prefix}「＿」
                    </span>
                  </div>
                  <p className="text-xs text-[#F3F1EA]/65">{slot.desc}</p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {slot.choices.map((ch) => {
                      const picked = logicAnswers[slot.id] === ch;
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            setLogicAnswers((prev) => ({ ...prev, [slot.id]: ch }))
                          }
                          className={`min-h-[44px] rounded-xl font-serif text-lg font-bold transition ${
                            picked
                              ? "bg-[#D9B978] text-[#101827] shadow"
                              : "border border-[#F3F1EA]/15 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978]/60"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PUZZLE 3 & 5 & 7: TAP-TO-PAIR MATCHING */}
        {(mission.puzzleType === "map-matching" ||
          mission.puzzleType === "symbol-decode" ||
          mission.puzzleType === "office-matching") && (
          <div className="space-y-6">
            {mission.puzzleType === "symbol-decode" && (
              <InteractiveEmblem
                activeSymbol={activeLeftId}
                onSelectSymbol={(symId) => setActiveLeftId(symId)}
              />
            )}

            <div className="rounded-xl border border-[#D9B978]/20 bg-[#101827] px-3.5 py-2.5 text-xs text-[#D9B978]">
              操作方式：先點選左側（上方）一項題目卡片，再點選右側（下方）對應的選項即可完成配對！
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Left Column: Items to Match */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F3F1EA]/60">
                  ① 選擇要配對的項目
                </p>
                {(() => {
                  const leftList =
                    mission.puzzleType === "map-matching"
                      ? ((payload.leftItems as { id: string; label: string }[]) ?? []).map(
                          (i) => ({ id: i.id, title: i.label, sub: "" })
                        )
                      : mission.puzzleType === "symbol-decode"
                      ? ((payload.symbols as { id: string; label: string }[]) ?? []).map(
                          (i) => ({ id: i.id, title: i.label, sub: "" })
                        )
                      : ((
                          payload.scenarios as {
                            id: string;
                            student: string;
                            situation: string;
                          }[]
                        ) ?? []).map((i) => ({
                          id: i.id,
                          title: i.student,
                          sub: i.situation,
                        }));

                  const rightList =
                    mission.puzzleType === "map-matching"
                      ? ((payload.rightItems as { id: string; text: string }[]) ?? []).map(
                          (r) => ({ id: r.id, label: r.text })
                        )
                      : mission.puzzleType === "symbol-decode"
                      ? ((payload.meanings as { id: string; text: string }[]) ?? []).map(
                          (r) => ({ id: r.id, label: r.text })
                        )
                      : ((
                          payload.offices as { id: string; label: string; note: string }[]
                        ) ?? []).map((r) => ({
                          id: r.id,
                          label: `${r.label}（${r.note}）`,
                        }));

                  return leftList.map((item, idx) => {
                    const isFocused = activeLeftId === item.id;
                    const matchedRightId = pairAnswers[item.id];
                    const matchedObj = rightList.find((r) => r.id === matchedRightId);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveLeftId(item.id)}
                        className={`w-full rounded-2xl border p-3.5 text-left transition ${
                          isFocused
                            ? "border-[#D9B978] bg-[#101827] ring-2 ring-[#D9B978]/40"
                            : matchedObj
                            ? "border-[#65C99A]/45 bg-[#101827]/90"
                            : "border-[#F3F1EA]/15 bg-[#101827]/70 hover:border-[#D9B978]/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-[#F3F1EA]">
                            <span className="mr-1.5 font-mono text-[#D9B978]">
                              0{idx + 1}.
                            </span>
                            {item.title}
                          </span>
                          {isFocused && (
                            <span className="shrink-0 rounded-full bg-[#D9B978] px-2 py-0.5 text-[10px] font-bold text-[#101827]">
                              配對中
                            </span>
                          )}
                        </div>
                        {item.sub && (
                          <p className="mt-1.5 text-xs leading-relaxed text-[#F3F1EA]/80">
                            {item.sub}
                          </p>
                        )}
                        {matchedObj && (
                          <p className="mt-2 rounded-lg bg-[#65C99A]/15 px-2.5 py-1.5 text-xs text-[#65C99A]">
                            已配對：{matchedObj.label}
                          </p>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Right Column: Target Options */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F3F1EA]/60">
                  ② 點選對應說明／單位
                </p>
                {(() => {
                  const rightList =
                    mission.puzzleType === "map-matching"
                      ? ((payload.rightItems as { id: string; text: string }[]) ?? []).map(
                          (r) => ({ id: r.id, title: r.text, note: "" })
                        )
                      : mission.puzzleType === "symbol-decode"
                      ? ((payload.meanings as { id: string; text: string }[]) ?? []).map(
                          (r) => ({ id: r.id, title: r.text, note: "" })
                        )
                      : ((
                          payload.offices as { id: string; label: string; note: string }[]
                        ) ?? []).map((r) => ({
                          id: r.id,
                          title: r.label,
                          note: r.note,
                        }));

                  return rightList.map((opt) => {
                    const assignedKeys = Object.entries(pairAnswers)
                      .filter(([, val]) => val === opt.id)
                      .map(([k]) => k);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!activeLeftId}
                        onClick={() => handlePairSelect(opt.id)}
                        className={`min-h-[54px] w-full rounded-2xl border p-3.5 text-left transition ${
                          activeLeftId
                            ? "cursor-pointer border-[#D9B978]/50 bg-[#1B2A40] hover:border-[#D9B978] hover:bg-[#233550]"
                            : "border-[#F3F1EA]/12 bg-[#131F31] opacity-85"
                        }`}
                      >
                        <p className="text-sm font-medium leading-relaxed text-[#F3F1EA]">
                          {opt.title}
                        </p>
                        {opt.note && (
                          <p className="mt-1 text-xs text-[#D9B978]/85">{opt.note}</p>
                        )}
                        {assignedKeys.length > 0 && (
                          <span className="mt-2 inline-block rounded-full bg-[#65C99A]/15 px-2.5 py-0.5 text-[11px] text-[#65C99A]">
                            已被選取（{assignedKeys.length}）
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* PUZZLE 4: TIMELINE SORTING (+ Museum Closed Archival Fallback) */}
        {mission.puzzleType === "timeline-sort" && (
          <div className="space-y-5">
            {/* History Museum Fallback Archive Box */}
            <div className="rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#D9B978]">
                  <Archive className="h-4 w-4" />
                  {settings.historyMuseumOpen
                    ? "官方校史參考卷宗（校史館開放時亦可隨時對照）"
                    : "校史館目前休館 — 數位校史替代檔案室（免進館即可作答）"}
                </div>
                <button
                  type="button"
                  onClick={() => setShowMuseumArchive((v) => !v)}
                  className="rounded-lg border border-[#D9B978]/40 px-3 py-1 text-xs font-medium text-[#D9B978] hover:bg-[#D9B978]/10"
                >
                  {showMuseumArchive ? "收合校史檔案" : "展開閱讀校史檔案"}
                </button>
              </div>

              {showMuseumArchive && (
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {(
                    (payload.museumFallbackArchive as {
                      period: string;
                      heading: string;
                      detail: string;
                    }[]) ?? []
                  ).map((arc) => (
                    <div
                      key={arc.period}
                      className="rounded-xl border border-[#F3F1EA]/10 bg-[#1B2A40] p-3 space-y-1"
                    >
                      <p className="text-[11px] font-bold text-[#D9B978]">
                        {arc.period}
                      </p>
                      <p className="text-xs font-semibold text-[#F3F1EA]">
                        {arc.heading}
                      </p>
                      <p className="text-xs leading-relaxed text-[#F3F1EA]/75">
                        {arc.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <p className="text-xs text-[#F3F1EA]/75">
                請使用右側的「上移 ↑ / 下移 ↓」按鈕，將四個歷史事件依時間「由最早（第 1 名）到最晚（第 4 名）」排好：
              </p>
              {timelineOrder.map((itemId, index) => {
                const itemsList =
                  (payload.items as { id: string; eraTag: string; label: string }[]) ??
                  [];
                const item = itemsList.find((x) => x.id === itemId);
                if (!item) return null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#D9B978]/30 bg-[#101827] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D9B978] font-mono text-sm font-bold text-[#101827]">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-[11px] font-semibold text-[#D9B978]">
                          {index === 0
                            ? "最早階段"
                            : index === timelineOrder.length - 1
                            ? "最晚階段"
                            : `第 ${index + 1} 順位`}
                        </span>
                        <p className="text-sm font-semibold leading-snug text-[#F3F1EA]">
                          {item.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTimelineItem(index, -1)}
                        aria-label="往上移動"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9B978]/35 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978] disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === timelineOrder.length - 1}
                        onClick={() => moveTimelineItem(index, 1)}
                        aria-label="往下移動"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9B978]/35 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978] disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PUZZLE 6: ECO MATCHING + SAFETY ETHICS */}
        {mission.puzzleType === "eco-matching" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#D9B978]/20 bg-[#101827] px-3.5 py-2.5 text-xs text-[#D9B978]">
              第一部分：先點選左側綠色理念，再點選右側對應的環境教育意涵。
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2.5">
                {(
                  (payload.items as { id: string; title: string }[]) ?? []
                ).map((item, idx) => {
                  const targets =
                    (payload.targets as { id: string; text: string }[]) ?? [];
                  const matched = targets.find((t) => t.id === pairAnswers[item.id]);
                  const focused = activeLeftId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveLeftId(item.id)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition ${
                        focused
                          ? "border-[#D9B978] bg-[#101827] ring-2 ring-[#D9B978]/40"
                          : matched
                          ? "border-[#65C99A]/45 bg-[#101827]"
                          : "border-[#F3F1EA]/15 bg-[#101827]/70 hover:border-[#D9B978]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#F3F1EA]">
                          0{idx + 1}. {item.title}
                        </span>
                        {focused && (
                          <span className="rounded-full bg-[#D9B978] px-2 py-0.5 text-[10px] font-bold text-[#101827]">
                            選取配對中
                          </span>
                        )}
                      </div>
                      {matched && (
                        <p className="mt-2 rounded-lg bg-[#65C99A]/15 px-2.5 py-1.5 text-xs text-[#65C99A]">
                          已配對：{matched.text}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {(
                  (payload.targets as { id: string; text: string }[]) ?? []
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!activeLeftId}
                    onClick={() => handlePairSelect(t.id)}
                    className={`min-h-[54px] w-full rounded-2xl border p-3.5 text-left text-sm leading-relaxed transition ${
                      activeLeftId
                        ? "border-[#D9B978]/50 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978]"
                        : "border-[#F3F1EA]/12 bg-[#131F31] text-[#F3F1EA]/80"
                    }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Part 2: Campus Safety Ethics */}
            {Boolean(payload.safetyQuestion) && (
              <div className="archive-inset rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-[#D9B978]">
                  第二部分：{(payload.safetyQuestion as { prompt: string }).prompt}
                </p>
                <div className="space-y-2">
                  {(
                    (
                      payload.safetyQuestion as {
                        options: { id: string; text: string }[];
                      }
                    ).options ?? []
                  ).map((opt) => {
                    const picked = ecoSafety === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEcoSafety(opt.id)}
                        className={`flex min-h-[46px] w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                          picked
                            ? "border-[#65C99A] bg-[#65C99A]/15 text-[#F3F1EA]"
                            : "border-[#F3F1EA]/15 bg-[#1B2A40] text-[#F3F1EA]/85 hover:border-[#D9B978]/50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            picked
                              ? "border-[#65C99A] bg-[#65C99A] text-[#101827]"
                              : "border-[#F3F1EA]/35"
                          }`}
                        >
                          {picked && <Check className="h-3.5 w-3.5" />}
                        </span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PUZZLE 8: MULTI-CLUE FINAL SYNTHESIS */}
        {mission.puzzleType === "final-synthesis" && (
          <div className="space-y-5">
            {/* Collected Clues Reference Drawer */}
            <div className="rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#D9B978]">
                  <BookOpen className="h-4 w-4" />
                  前七關已收集的記憶線索檔案（{Object.keys(allSolvedDetails).filter((id) => Number(id) < 8).length} / 7）
                </span>
                <button
                  type="button"
                  onClick={() => setShowClueDrawer((v) => !v)}
                  className="rounded-lg border border-[#D9B978]/40 px-3 py-1 text-xs font-medium text-[#D9B978] hover:bg-[#D9B978]/10"
                >
                  {showClueDrawer ? "收合線索卡" : "調閱我的線索卡"}
                </button>
              </div>
              {showClueDrawer && (
                <div className="mt-3 space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((id) => {
                    const detail = allSolvedDetails[id];
                    return (
                      <div
                        key={id}
                        className="rounded-xl border border-[#F3F1EA]/10 bg-[#1B2A40] px-3 py-2 text-xs text-[#F3F1EA]/85"
                      >
                        {detail ? (
                          <span>{detail.clueSummary}</span>
                        ) : (
                          <span className="text-[#F3F1EA]/45">
                            線索 0{id}：尚未取得（若在管理員測試模式，可由管理員控制台直接解鎖體驗）
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Three Synthesis Questions */}
            {(
              (payload.questions as {
                id: string;
                label: string;
                prompt: string;
                options?: string[];
                subParts?: { id: string; label: string; options: string[] }[];
              }[]) ?? []
            ).map((q) => (
              <div key={q.id} className="archive-inset rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-[#D9B978]">{q.label}</p>
                <p className="text-sm leading-relaxed text-[#F3F1EA]">{q.prompt}</p>

                {q.options && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {q.options.map((opt) => {
                      const picked = synthAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSynthAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={`min-h-[44px] rounded-xl font-mono text-sm font-bold transition ${
                            picked
                              ? "bg-[#D9B978] text-[#101827]"
                              : "border border-[#F3F1EA]/15 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978]"
                          }`}
                        >
                          民國 {opt} 年
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.subParts && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {q.subParts.map((sp) => {
                      const answerKey = `${q.id}_${sp.id}`;
                      return (
                        <div key={sp.id} className="space-y-1.5">
                          <p className="text-xs text-[#F3F1EA]/70">{sp.label}：</p>
                          <div className="grid grid-cols-3 gap-2">
                            {sp.options.map((opt) => {
                              const picked = synthAnswers[answerKey] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setSynthAnswers((prev) => ({
                                      ...prev,
                                      [answerKey]: opt,
                                    }))
                                  }
                                  className={`min-h-[44px] rounded-xl px-2 text-xs font-bold transition ${
                                    picked
                                      ? "bg-[#D9B978] text-[#101827]"
                                      : "border border-[#F3F1EA]/15 bg-[#1B2A40] text-[#F3F1EA] hover:border-[#D9B978]"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Warm Friendly Feedback Banner */}
        {feedback && (
          <div
            role="status"
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              feedback.type === "success"
                ? "border-[#65C99A]/50 bg-[#65C99A]/15 text-[#65C99A]"
                : "border-[#D9B978]/50 bg-[#D9B978]/10 text-[#F3F1EA]"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#65C99A]" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D9B978]" />
            )}
            <p className="text-sm leading-relaxed">{feedback.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3.5 text-base font-bold text-[#101827] transition hover:bg-[#E4C98F] disabled:opacity-60 shadow-[0_12px_32px_rgba(217,185,120,0.24)]"
        >
          {submitting ? "檔案驗證中..." : isSolved ? "再次驗證答案" : "提交探索答案"}
        </button>
      </form>

      {/* SCREEN 08: HINT INTERFACE (TWO-STAGE, ZERO PENALTY) */}
      <div className="archive-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#D9B978]" />
            <h3 className="text-sm font-bold text-[#F3F1EA]">
              探索提示匣（使用提示完全不扣分）
            </h3>
          </div>
          <span className="text-xs text-[#65C99A]">已開啟 {hintsRevealed} / 2 階提示</span>
        </div>

        <div className="space-y-3">
          {hintsRevealed >= 1 ? (
            <div className="rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-4 space-y-1">
              <p className="text-xs font-bold text-[#D9B978]">第一階段提示</p>
              <p className="text-sm leading-relaxed text-[#F3F1EA]/90">{mission.hint1}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenHint(1)}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#D9B978]/40 bg-[#101827] px-4 py-2.5 text-sm font-semibold text-[#D9B978] transition hover:bg-[#D9B978]/10"
            >
              <HelpCircle className="h-4 w-4" />
              需要一點靈感嗎？開啟第一個提示（不扣分）
            </button>
          )}

          {hintsRevealed >= 2 ? (
            <div className="rounded-2xl border border-[#65C99A]/35 bg-[#101827] p-4 space-y-1">
              <p className="text-xs font-bold text-[#65C99A]">第二階段進階提示</p>
              <p className="text-sm leading-relaxed text-[#F3F1EA]/90">{mission.hint2}</p>
            </div>
          ) : (
            hintsRevealed >= 1 && (
              <button
                type="button"
                onClick={() => onOpenHint(2)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#65C99A]/40 bg-[#101827] px-4 py-2.5 text-sm font-semibold text-[#65C99A] transition hover:bg-[#65C99A]/10"
              >
                <HelpCircle className="h-4 w-4" />
                再靠近一點：開啟第二個提示（不扣分）
              </button>
            )
          )}
        </div>
      </div>

      {/* Image Zoom Lightbox Modal (for Mission 01) */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div className="relative max-w-3xl w-full">
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              aria-label="關閉放大圖片"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1B2A40] text-[#F3F1EA] hover:bg-[#D9B978] hover:text-[#101827]"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImageUrl}
              alt="放大檢視校園建築"
              className="w-full rounded-2xl border border-[#D9B978]/35 object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
