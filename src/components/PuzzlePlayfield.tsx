"use client";

import React from "react";
import type {
  GameSettings,
  HintStage,
  PublicMission,
  SolvedMissionDetail,
} from "@/types/game";
import { MAX_HINT_STAGE } from "@/types/game";
import { MissionPuzzleStage } from "./PuzzleStages";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Compass,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface PuzzlePlayfieldProps {
  mode: "detail" | "puzzle";
  mission: PublicMission;
  settings: GameSettings;
  isSolved: boolean;
  solvedDetail?: SolvedMissionDetail;
  allSolvedDetails: Record<number, SolvedMissionDetail>;
  hintsRevealed: number;
  revealedHints: Partial<Record<HintStage, string>>;
  submitting: boolean;
  feedback: { type: "error" | "success"; message: string } | null;
  onStartPuzzle: () => void;
  onBackToMap: () => void;
  onBackToDetail: () => void;
  onOpenHint: (stage: HintStage) => void;
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
  revealedHints,
  submitting,
  feedback,
  onStartPuzzle,
  onBackToMap,
  onBackToDetail,
  onOpenHint,
  onSubmitAnswer,
}: PuzzlePlayfieldProps) {
  // SCREEN 06: MISSION DETAIL
  if (mode === "detail") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          type="button"
          onClick={onBackToMap}
          className="inline-flex items-center gap-1.5 text-sm text-[#103FA0] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> 返回互動校園地圖
        </button>

        <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9CF00]/15 px-3 py-1 font-mono text-xs font-semibold text-[#103FA0]">
                MISSION {mission.id.toString().padStart(2, "0")}・10 分
              </span>
              <h1 className="mt-2 font-serif text-2xl font-bold text-[#213155] sm:text-3xl">
                {mission.title}
              </h1>
              <p className="mt-1 text-sm text-[#103FA0]/90">{mission.subtitle}</p>
            </div>

            {isSolved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#008250]/15 px-3.5 py-1.5 text-xs font-semibold text-[#008250]">
                <CheckCircle2 className="h-4 w-4" /> 已完成任務
              </span>
            )}
          </div>

          {/* Location Card */}
          <div className="archive-inset rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#213155]">
              <MapPin className="h-4 w-4 text-[#103FA0]" />
              探索地點：{mission.locationName}
            </div>
            <p className="flex items-center gap-2 pl-6 text-xs text-[#213155]/65">
              <Compass className="h-3.5 w-3.5" />
              {mission.locationNote}
            </p>
          </div>

          {/* Story Background */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#103FA0]">
              檔案故事背景
            </h2>
            <p className="font-hand text-base leading-relaxed text-[#213155]/90">
              {mission.storyBackground}
            </p>
          </div>

          {/* History Museum Status Notice for Mission 04 */}
          {mission.id === 4 && (
            <div
              className={`rounded-2xl border p-4 ${
                settings.historyMuseumOpen
                  ? "border-[#008250]/35 bg-[#008250]/10"
                  : "border-[#103FA0]/45 bg-[#F9CF00]/10"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#213155]">
                <Archive className="h-4 w-4 text-[#103FA0]" />
                {settings.historyMuseumOpen
                  ? "目前設定：校史館開放中（亦可隨時查閱內建數位校史檔案）"
                  : "目前設定：校史館休館中 — 已啟用數位校史替代檔案室"}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#213155]/80">
                {settings.historyMuseumOpen
                  ? "歡迎安靜觀察校史相關資訊，解謎時若需校對年份也可直接使用遊戲內的官方資料夾。"
                  : "校史館未開放沒關係！進入關卡後系統將自動提供完整官方校史文獻，讓你可以安靜坐在安全區域順利通關。"}
              </p>
            </div>
          )}

          {/* Safety Rule */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#103FA0]" />
            <div>
              <p className="text-xs font-semibold text-[#103FA0]">校園探索安全守則</p>
              <p className="mt-1 text-xs leading-relaxed text-[#213155]/80">
                {mission.safetyNotice}
              </p>
            </div>
          </div>

          {/* Fragment Preview & Source */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#213155]/10 pt-4 text-xs text-[#213155]/70">
            <span>過關獎勵：記憶碎片「{mission.fragmentName}」</span>
            <a
              href={encodeURI(mission.materialUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#103FA0] hover:underline"
            >
              列印素材：{mission.materialTitle} <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={onStartPuzzle}
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3.5 text-base font-bold text-[#213155] shadow-[0_12px_32px_rgba(249,207,0,0.28)] transition hover:bg-[#FFDD33]"
          >
            <Sparkles className="h-5 w-5" />
            {isSolved ? "進入關卡（查看解答與複習）" : "開始解開謎題"}
          </button>
        </div>
      </div>
    );
  }

  const hintStages: HintStage[] = [1, 2, 3];
  const hintLabels: Record<HintStage, string> = {
    1: "第一階段提示（觀察方向）",
    2: "第二階段提示（推理策略）",
    3: "第三階段提示（關鍵關係）",
  };

  // SCREEN 07 + 08: PUZZLE INTERFACE + HINTS
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToDetail}
          className="inline-flex items-center gap-1.5 text-sm text-[#103FA0] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> 返回關卡說明
        </button>
        <span className="font-mono text-xs text-[#213155]/65">
          MISSION {mission.id.toString().padStart(2, "0")}・{mission.title}
        </span>
      </div>

      {/* Already solved review card */}
      {isSolved && solvedDetail && (
        <div className="rounded-2xl border border-[#008250]/45 bg-[#008250]/10 p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#008250]">
            <CheckCircle2 className="h-5 w-5" />
            你已成功獲得碎片「{solvedDetail.fragmentName}」（+10 分）
          </div>
          <p className="text-sm leading-relaxed text-[#213155]/90">{solvedDetail.explanation}</p>
          <p className="text-xs text-[#103FA0]">{solvedDetail.clueSummary}</p>
        </div>
      )}

      <div className="archive-card rounded-3xl p-5 sm:p-8 space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F9CF00]/15 px-3 py-1 text-xs font-semibold text-[#103FA0]">
            互動解謎挑戰
          </span>
          <h2 className="font-serif text-xl font-bold leading-snug text-[#213155] sm:text-2xl">
            {mission.promptText}
          </h2>
        </div>

        <MissionPuzzleStage
          mission={mission}
          settings={settings}
          isSolved={isSolved}
          submitting={submitting}
          feedback={feedback}
          allSolvedDetails={allSolvedDetails}
          onSubmitAnswer={onSubmitAnswer}
        />
      </div>

      {/* SCREEN 08: THREE-STAGE HINT INTERFACE, 1 POINT PER STAGE */}
      <div className="archive-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#103FA0]" />
            <h3 className="text-sm font-bold text-[#213155]">
              探索提示匣（每開啟一階提示，該關 −1 分）
            </h3>
          </div>
          <span className={hintsRevealed > 0 ? "text-xs font-semibold text-[#B98A00]" : "text-xs text-[#008250]"}>
            已開啟 {hintsRevealed} / {MAX_HINT_STAGE} 階提示
            {hintsRevealed > 0 ? `（本關 −${hintsRevealed} 分）` : ""}
          </span>
        </div>

        <div className="space-y-3">
          {hintStages.map((stage) => {
            const revealed = revealedHints[stage];
            if (revealed) {
              return (
                <div key={stage} className="rounded-2xl border border-[#103FA0]/35 bg-[#EAF0FA] p-4 space-y-1">
                  <p className="text-xs font-bold text-[#103FA0]">{hintLabels[stage]}</p>
                  <p className="text-sm leading-relaxed text-[#213155]/90">{revealed}</p>
                </div>
              );
            }
            const unlocked = hintsRevealed >= stage - 1;
            if (!unlocked) return null;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => onOpenHint(stage)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#103FA0]/40 bg-[#EAF0FA] px-4 py-2.5 text-sm font-semibold text-[#103FA0] transition hover:bg-[#103FA0]/10"
              >
                <HelpCircle className="h-4 w-4" />
                {stage === 1
                  ? "需要一點靈感嗎？開啟第一階段提示（−1 分）"
                  : `開啟${hintLabels[stage]}（再 −1 分）`}
              </button>
            );
          })}
          {hintsRevealed >= MAX_HINT_STAGE && !revealedHints[3] && (
            <p className="text-xs text-[#213155]/60">三階提示已全部開啟；剩下的推理請交回自己。</p>
          )}
        </div>
      </div>
    </div>
  );
}
