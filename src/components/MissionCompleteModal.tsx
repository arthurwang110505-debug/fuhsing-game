"use client";

import React from "react";
import { motion } from "framer-motion";
import type { PublicMission, SolvedMissionDetail } from "@/types/game";
import {
  Award,
  Bell,
  BookOpen,
  Building2,
  Compass,
  ExternalLink,
  Flame,
  Hourglass,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

interface MissionCompleteModalProps {
  mission: PublicMission;
  solvedDetail: SolvedMissionDetail;
  allEightDone: boolean;
  onContinueMap: () => void;
  onContinueDashboard: () => void;
  onGoFinalPuzzle: () => void;
}

export function FragmentSymbolIcon({ symbol, className = "h-8 w-8" }: { symbol: string; className?: string }) {
  switch (symbol) {
    case "compass":
      return <Compass className={className} />;
    case "bell":
      return <Bell className={className} />;
    case "building":
      return <Building2 className={className} />;
    case "hourglass":
      return <Hourglass className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "leaf":
      return <Leaf className={className} />;
    case "shield":
      return <ShieldCheck className={className} />;
    default:
      return <Star className={className} />;
  }
}

export default function MissionCompleteModal({
  mission,
  solvedDetail,
  allEightDone,
  onContinueMap,
  onContinueDashboard,
  onGoFinalPuzzle,
}: MissionCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090E18]/85 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="archive-card relative my-auto w-full max-w-xl rounded-3xl p-6 sm:p-8"
      >
        {/* Crest & Fragment Reveal */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -14 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 210, damping: 16 }}
            className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#65C99A]/50 bg-[#101827] text-[#D9B978] shadow-[0_0_32px_rgba(101,201,154,0.28)]"
          >
            <FragmentSymbolIcon symbol={solvedDetail.fragmentSymbol} className="h-10 w-10" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#65C99A] text-[#101827]"
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
          </motion.div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65C99A]">
            MISSION {mission.id.toString().padStart(2, "0")} COMPLETE・+10 分
          </p>
          <h2 className="mt-1.5 font-serif text-2xl font-bold text-[#F3F1EA] sm:text-3xl">
            獲得記憶碎片：『{solvedDetail.fragmentName}』
          </h2>
          <p className="mt-2 max-w-md font-serif text-sm italic text-[#D9B978]">
            「{solvedDetail.fragmentPoem}」
          </p>
        </div>

        {/* Clue Unlocked Banner */}
        <div className="mt-5 rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D9B978]">
            <Award className="h-4 w-4" />
            已收錄至檔案線索匣
          </div>
          <p className="mt-1.5 text-sm text-[#F3F1EA]/90">{solvedDetail.clueSummary}</p>
        </div>

        {/* Official Knowledge Explanation */}
        <div className="mt-4 rounded-2xl border border-[#F3F1EA]/10 bg-[#131F31] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#65C99A]">
            <BookOpen className="h-4 w-4" />
            校園記憶解析
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#F3F1EA]/85">
            {solvedDetail.explanation}
          </p>
          <div className="mt-3 border-t border-[#F3F1EA]/10 pt-2.5 flex items-center justify-between gap-2 text-xs text-[#F3F1EA]/65">
            <span>資料來源：{solvedDetail.sourceTitle}</span>
            <a
              href={solvedDetail.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-[#D9B978] hover:underline"
            >
              查看官方出處 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {allEightDone ? (
            <button
              type="button"
              onClick={onGoFinalPuzzle}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#65C99A] px-5 py-3 text-sm font-bold text-[#101827] transition hover:bg-[#7AD6AA] shadow-[0_10px_28px_rgba(101,201,154,0.28)]"
            >
              <Sparkles className="h-4 w-4" />
              集齊八枚碎片！前往最終謎題
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinueMap}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#D9B978] px-5 py-3 text-sm font-bold text-[#101827] transition hover:bg-[#E4C98F]"
            >
              返回校園互動地圖繼續探索
            </button>
          )}
          <button
            type="button"
            onClick={onContinueDashboard}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#D9B978]/35 bg-[#101827] px-5 py-3 text-sm font-medium text-[#F3F1EA] transition hover:border-[#D9B978]"
          >
            查看檔案總覽
          </button>
        </div>
      </motion.div>
    </div>
  );
}
