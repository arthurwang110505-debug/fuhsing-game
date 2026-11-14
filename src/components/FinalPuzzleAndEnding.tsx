"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type {
  FinalPuzzleMeta,
  GameSession,
  OfficialSourceItem,
  PublicMission,
} from "@/types/game";
import { FragmentSymbolIcon } from "./MissionCompleteModal";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  BookOpen,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

interface FinalPuzzleViewProps {
  meta: FinalPuzzleMeta;
  missions: PublicMission[];
  submitting: boolean;
  feedback: { type: "error" | "success"; message: string } | null;
  onBack: () => void;
  onSubmitOrder: (order: string[]) => void;
}

export function FinalPuzzleView({
  meta,
  missions,
  submitting,
  feedback,
  onBack,
  onSubmitOrder,
}: FinalPuzzleViewProps) {
  const [order, setOrder] = useState<string[]>(meta.shuffledLines.map((l) => l.id));
  const [showHint, setShowHint] = useState(false);

  const moveLine = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setOrder(next);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#D9B978] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> 返回檔案總覽
      </button>

      <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9B978]/50 bg-[#101827] text-[#D9B978] shadow-[0_0_28px_rgba(217,185,120,0.3)]">
            <Flame className="h-8 w-8" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#65C99A]">
            FINAL SYNTHESIS・+10 分 + 全探索加成 10 分
          </p>
          <h1 className="font-serif text-2xl font-bold text-[#F3F1EA] sm:text-3xl">
            {meta.title}
          </h1>
          <p className="text-sm text-[#D9B978]">{meta.subtitle}</p>
        </div>

        {/* 8 Collected Fragments Crest Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#65C99A]/25 bg-[#101827] p-3">
          {missions.map((m) => (
            <div
              key={m.id}
              title={m.fragmentName}
              className="flex items-center gap-1.5 rounded-full border border-[#65C99A]/40 bg-[#1B2A40] px-2.5 py-1 text-xs text-[#65C99A]"
            >
              <FragmentSymbolIcon symbol={m.fragmentSymbol} className="h-3.5 w-3.5" />
              <span>{m.fragmentName}</span>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-[#F3F1EA]/90">{meta.storyPrompt}</p>

        {/* Torch Spirit Ordering Letter */}
        <div className="rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-5 space-y-4">
          <p className="font-serif text-base font-bold text-[#D9B978]">
            {meta.openingLine}
          </p>

          <div className="space-y-2.5">
            {order.map((lineId, idx) => {
              const item = meta.shuffledLines.find((l) => l.id === lineId);
              if (!item) return null;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#D9B978]/30 bg-[#1B2A40] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D9B978] font-mono text-xs font-bold text-[#101827]">
                      {idx + 1}
                    </span>
                    <span className="font-serif text-base font-semibold text-[#F3F1EA]">
                      {item.text}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveLine(idx, -1)}
                      aria-label="上移一個片語"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9B978]/35 bg-[#101827] text-[#F3F1EA] hover:border-[#D9B978] disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === order.length - 1}
                      onClick={() => moveLine(idx, 1)}
                      aria-label="下移一個片語"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9B978]/35 bg-[#101827] text-[#F3F1EA] hover:border-[#D9B978] disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="font-serif text-sm italic text-[#D9B978]/90 text-right">
            {meta.closingLine}
          </p>
        </div>

        {/* Hint */}
        <div>
          {showHint ? (
            <div className="rounded-2xl border border-[#D9B978]/35 bg-[#101827] p-4 text-sm text-[#F3F1EA]/90">
              <span className="font-bold text-[#D9B978]">提示（不扣分）：</span>
              {meta.hint}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B978] hover:underline"
            >
              <HelpCircle className="h-4 w-4" /> 需要排序提示嗎？（不扣分）
            </button>
          )}
        </div>

        {feedback && (
          <div className="rounded-2xl border border-[#D9B978]/45 bg-[#D9B978]/10 p-4 flex items-start gap-3 text-sm text-[#F3F1EA]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D9B978]" />
            <span>{feedback.message}</span>
          </div>
        )}

        <button
          type="button"
          disabled={submitting}
          onClick={() => onSubmitOrder(order)}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#65C99A] px-6 py-3.5 text-base font-bold text-[#101827] transition hover:bg-[#7AD6AA] disabled:opacity-60 shadow-[0_12px_32px_rgba(101,201,154,0.28)]"
        >
          <Sparkles className="h-5 w-5" />
          {submitting ? "正在封緘時光回信..." : "完成誓言・封緘寄出時光的回信"}
        </button>
      </div>
    </div>
  );
}

interface EndingScreenViewProps {
  session: GameSession;
  missions: PublicMission[];
  endingStory: string[];
  officialSources: OfficialSourceItem[];
  elapsedFormatted: string;
  onReturnDashboard: () => void;
  onStartNewAdventure: () => void;
}

export function EndingScreenView({
  session,
  missions,
  endingStory,
  officialSources,
  elapsedFormatted,
  onReturnDashboard,
  onStartNewAdventure,
}: EndingScreenViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Hero Ending Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="archive-card relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#D9B978] bg-[#101827] text-[#D9B978] shadow-[0_0_45px_rgba(217,185,120,0.35)]"
        >
          <Trophy className="h-11 w-11" />
        </motion.div>

        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#65C99A]">
          FUHSING CHRONICLES COMPLETE
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-[#F3F1EA] sm:text-4xl">
          時光的回信已送達
        </h1>
        <p className="mt-2 text-sm text-[#D9B978]">
          感謝你完成了《復興檔案：時光的邀請》全校園探索
        </p>

        {/* Score & Stats Grid */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3 text-left">
          <div className="archive-inset rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#F3F1EA]/65">
              <User className="h-4 w-4 text-[#D9B978]" />
              本機探索檔案
            </div>
            <p className="mt-1.5 font-serif text-lg font-bold text-[#F3F1EA]">
              {session.playerName}
            </p>
            <p className="mt-0.5 text-xs text-[#D9B978]">
              進度儲存於此瀏覽器
            </p>
          </div>

          <div className="archive-inset rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#F3F1EA]/65">
              <Award className="h-4 w-4 text-[#65C99A]" />
              探索總積分
            </div>
            <p className="mt-1.5 font-mono text-3xl font-bold text-[#65C99A]">
              {session.score} <span className="text-sm text-[#F3F1EA]/60">/ 100 分</span>
            </p>
            <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
              八關任務 80 + 終章 10 + 全收集 10
            </p>
          </div>

          <div className="archive-inset rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#F3F1EA]/65">
              <Clock className="h-4 w-4 text-[#D9B978]" />
              校園探索歷時
            </div>
            <p className="mt-1.5 font-mono text-3xl font-bold text-[#F3F1EA]">
              {elapsedFormatted}
            </p>
            <p className="mt-0.5 text-xs text-[#F3F1EA]/65">
              建議時長 50 分鐘・無倒數自由探索
            </p>
          </div>
        </div>
      </motion.div>

      {/* Warm Ending Story */}
      <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#D9B978]">
          寫給每一位復興探索員的回信
        </h2>
        <div className="space-y-4 text-base leading-relaxed text-[#F3F1EA]/90">
          {endingStory.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-[#D9B978]/30 bg-[#101827] p-4 text-center font-serif text-sm text-[#D9B978]">
          「我們是復興的小火炬，是世上的光；把責任與榮譽給自己，把友誼與溫暖給同學，把服務與奉獻給社會，把愛與關懷給世界。」
        </div>
      </div>

      {/* 8 Memory Fragments Complete Gallery */}
      <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-xl font-bold text-[#F3F1EA]">
          八枚記憶碎片完整圖鑑（8 / 8）
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {missions.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-[#65C99A]/35 bg-[#101827] p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#65C99A]">
                  #{m.id.toString().padStart(2, "0")}
                </span>
                <span className="text-[#D9B978]">
                  <FragmentSymbolIcon symbol={m.fragmentSymbol} className="h-5 w-5" />
                </span>
              </div>
              <p className="font-serif text-base font-bold text-[#F3F1EA]">
                {m.fragmentName}
              </p>
              <p className="text-xs leading-relaxed text-[#F3F1EA]/70">
                {m.fragmentPoem}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Sources Verification Directory */}
      <div className="archive-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#D9B978]" />
          <h2 className="font-serif text-xl font-bold text-[#F3F1EA]">
            官方校史與校園資料來源一覽
          </h2>
        </div>
        <p className="text-xs text-[#F3F1EA]/70">
          本遊戲所有校史年份、建築名稱、校徽意涵、環境教育與行政職責皆嚴格核對臺北市私立復興實驗高級中學公開官方資訊：
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {officialSources.map((src) => (
            <a
              key={src.title}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-[#F3F1EA]/12 bg-[#101827] p-3.5 transition hover:border-[#D9B978]/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-[#D9B978]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D9B978]">
                  {src.category}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-[#D9B978] opacity-70 group-hover:opacity-100" />
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#F3F1EA] group-hover:text-[#D9B978]">
                {src.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#F3F1EA]/65">
                {src.note}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReturnDashboard}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[#D9B978]/40 bg-[#1B2A40] px-6 py-3 text-sm font-semibold text-[#F3F1EA] transition hover:border-[#D9B978]"
        >
          返回檔案總覽與地圖
        </button>
        <button
          type="button"
          onClick={onStartNewAdventure}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D9B978] px-6 py-3 text-sm font-bold text-[#101827] transition hover:bg-[#E4C98F]"
        >
          <RotateCcw className="h-4 w-4" />
          開啟新的探索檔案（重新遊玩）
        </button>
      </div>
    </div>
  );
}
