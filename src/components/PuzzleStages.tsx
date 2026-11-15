"use client";

import React, { useMemo, useState } from "react";
import type { GameSettings, PublicMission, SolvedMissionDetail } from "@/types/game";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  MoveHorizontal,
  RotateCcw,
} from "lucide-react";

export interface MissionStageProps {
  mission: PublicMission;
  settings: GameSettings;
  isSolved: boolean;
  submitting: boolean;
  feedback: { type: "error" | "success"; message: string } | null;
  allSolvedDetails: Record<number, SolvedMissionDetail>;
  onSubmitAnswer: (answer: unknown) => void;
}

/* ------------------------------------------------------------------ */
/* 共用元件                                                            */
/* ------------------------------------------------------------------ */

function HelperNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#103FA0]/20 bg-[#EAF0FA] px-3.5 py-2.5 text-xs leading-relaxed text-[#103FA0]">
      <MoveHorizontal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: MissionStageProps["feedback"] }) {
  if (!feedback) return null;
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        feedback.type === "success"
          ? "border-[#008250]/50 bg-[#008250]/15 text-[#008250]"
          : "border-[#103FA0]/50 bg-[#F9CF00]/10 text-[#213155]"
      }`}
    >
      {feedback.type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#008250]" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#103FA0]" />
      )}
      <p className="text-sm leading-relaxed">{feedback.message}</p>
    </div>
  );
}

function SubmitBar({
  submitting,
  isSolved,
  onSubmit,
}: {
  submitting: boolean;
  isSolved: boolean;
  onSubmit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={submitting}
      className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3.5 text-base font-bold text-[#213155] shadow-[0_12px_32px_rgba(249,207,0,0.24)] transition hover:bg-[#FFDD33] disabled:opacity-60"
    >
      {submitting ? "檔案驗證中..." : isSolved ? "再次驗證答案" : "提交探索答案"}
    </button>
  );
}

function StepTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#103FA0]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#103FA0]">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* M01 三欄證據審查                                                    */
/* ------------------------------------------------------------------ */

interface EvidenceCard {
  id: string;
  order: number;
  text: string;
  sourceKey: string;
  token?: string;
}
interface EvidenceColumn {
  id: string;
  label: string;
  note: string;
}
interface EvidenceSource {
  title: string;
  url: string;
  excerpt: string;
}

function EvidenceClassifyStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    columns?: EvidenceColumn[];
    cards?: EvidenceCard[];
    sources?: EvidenceSource[];
    lockLabel?: string;
    reasonPrompt?: string;
  };
  const columns = payload.columns ?? [];
  const cards = useMemo(() => [...(payload.cards ?? [])].sort((a, b) => a.order - b.order), [payload.cards]);
  const sources = payload.sources ?? [];

  const [placement, setPlacement] = useState<Record<string, string>>({});
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [lock, setLock] = useState("");
  const [reason, setReason] = useState("");
  const [openSource, setOpenSource] = useState<string | null>(null);

  const placeCard = (cardId: string, columnId: string) => {
    setPlacement((previous) => {
      const next = { ...previous };
      if (next[cardId] === columnId) delete next[cardId];
      else next[cardId] = columnId;
      return next;
    });
    setActiveCard(null);
  };

  const unplaced = cards.filter((card) => !placement[card.id]);
  const tokenPreview = cards
    .filter((card) => placement[card.id] === "confirmed")
    .map((card) => card.token || "・")
    .join("");

  return (
    <div className="space-y-5">
      <HelperNote>
        手機操作：先點一張證詞卡，再點要放入的證據欄；已放入的卡片可點「移回」重新分類。
      </HelperNote>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">官方來源原文（可隨時展開核對）</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {sources.map((source) => (
            <div key={source.title} className="rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3">
              <button
                type="button"
                onClick={() => setOpenSource((previous) => (previous === source.title ? null : source.title))}
                className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-[#103FA0]"
              >
                <span>{source.title}</span>
                <span className="text-[10px] font-normal text-[#213155]/60">{openSource === source.title ? "收合" : "展開"}</span>
              </button>
              {openSource === source.title && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs leading-relaxed text-[#213155]/85">{source.excerpt}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#103FA0] hover:underline"
                  >
                    官方頁面 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">
          待分類證詞卡（{unplaced.length} 張）
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {unplaced.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-pressed={activeCard === card.id}
              onClick={() => setActiveCard((previous) => (previous === card.id ? null : card.id))}
              className={`rounded-2xl border p-3 text-left text-sm leading-relaxed transition ${
                activeCard === card.id
                  ? "border-[#103FA0] bg-[#F9CF00]/15 text-[#213155] ring-2 ring-[#103FA0]/40"
                  : "border-[#213155]/15 bg-[#EAF0FA] text-[#213155]/90 hover:border-[#103FA0]/60"
              }`}
            >
              <span className="mr-2 font-mono text-xs font-bold text-[#103FA0]">#{card.order}</span>
              {card.text}
            </button>
          ))}
          {unplaced.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#008250]/40 bg-[#008250]/5 p-3 text-xs text-[#008250]">
              所有證詞卡都已分類，接著讀取校驗字。
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => {
          const columnCards = cards.filter((card) => placement[card.id] === column.id);
          return (
            <div
              key={column.id}
              className="flex min-h-[150px] flex-col gap-2 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA]/70 p-3"
            >
              <div>
                <p className="text-sm font-bold text-[#213155]">{column.label}</p>
                <p className="text-[11px] leading-relaxed text-[#213155]/60">{column.note}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {columnCards.map((card) => (
                  <div key={card.id} className="rounded-xl border border-[#008250]/35 bg-[#008250]/10 p-2 text-xs leading-relaxed text-[#213155]">
                    <span className="mr-1 font-mono text-[10px] font-bold text-[#008250]">#{card.order}</span>
                    {card.text}
                    <button
                      type="button"
                      onClick={() => placeCard(card.id, column.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#103FA0] hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" /> 移回
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={!activeCard}
                onClick={() => activeCard && placeCard(activeCard, column.id)}
                className={`min-h-[40px] rounded-xl border text-xs font-semibold transition ${
                  activeCard
                    ? "border-[#103FA0] bg-[#F9CF00] text-[#213155] hover:bg-[#FFDD33]"
                    : "border-[#213155]/15 bg-[#EAF0FA] text-[#213155]/40"
                }`}
              >
                {activeCard ? `放入「${column.label}」` : "先選一張證詞卡"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-4">
        <label htmlFor="evidence-lock" className="block text-xs font-semibold text-[#103FA0]">
          {payload.lockLabel ?? "檔案鎖校驗字"}
        </label>
        <p className="font-mono text-sm tracking-[0.3em] text-[#213155]/50">{tokenPreview || "尚未取得校驗字"}</p>
        <input
          id="evidence-lock"
          value={lock}
          onChange={(event) => setLock(event.target.value)}
          placeholder="輸入校驗字"
          className="min-h-[44px] w-full rounded-xl border border-[#103FA0]/35 bg-white px-3 text-sm text-[#213155] outline-none focus:border-[#103FA0]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="evidence-reason" className="block text-xs font-semibold text-[#213155]/75">
          {payload.reasonPrompt ?? "寫下你的判斷理由（不計分，供教師檢核）"}
        </label>
        <textarea
          id="evidence-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          className="w-full rounded-xl border border-[#213155]/20 bg-[#EAF0FA] px-3 py-2 text-sm text-[#213155] outline-none focus:border-[#103FA0]"
        />
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer({ placement, lock, reason })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M02 語意選詩・藏頭密令                                              */
/* ------------------------------------------------------------------ */

interface AcrosticSlot {
  id: string;
  label: string;
  requirement: string;
}
interface AcrosticLine {
  id: string;
  lead: string;
  text: string;
}

function AcrosticStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as { slots?: AcrosticSlot[]; lines?: AcrosticLine[] };
  const slots = payload.slots ?? [];
  const lines = payload.lines ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(slots[0]?.id ?? null);

  const usedLineIds = Object.values(answers);

  const assign = (lineId: string) => {
    const slotId = activeSlot ?? slots.find((slot) => !answers[slot.id])?.id;
    if (!slotId) return;
    setAnswers((previous) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(previous)) {
        if (value !== lineId) next[key] = value;
      }
      next[slotId] = lineId;
      return next;
    });
    setActiveSlot(slots.find((slot) => slot.id !== slotId && !answers[slot.id])?.id ?? null);
  };

  const motto = slots
    .map((slot) => {
      const line = lines.find((item) => item.id === answers[slot.id]);
      return line ? line.lead : "＿";
    })
    .join("");

  return (
    <div className="space-y-5">
      <HelperNote>
        先點一個語意槽位，再點你認為符合該語意的詩行；同一行只能使用一次。未填滿前密令會以「＿」遮罩。
      </HelperNote>

      <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] px-3 py-4">
        {slots.map((slot) => {
          const line = lines.find((item) => item.id === answers[slot.id]);
          return (
            <div key={slot.id} className="flex flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#103FA0]/50 bg-[#EAF0FA] font-serif text-2xl font-bold text-[#103FA0] shadow-inner sm:h-16 sm:w-16">
                {line ? line.lead : <span className="text-base text-[#213155]/30">＿</span>}
              </div>
              <span className="text-[10px] text-[#213155]/60">{slot.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-center font-mono text-xs text-[#213155]/70">目前密令：{motto}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const chosen = lines.find((item) => item.id === answers[slot.id]);
          const isActive = activeSlot === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveSlot(slot.id)}
              className={`rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-[#103FA0] bg-[#F9CF00]/10 ring-2 ring-[#103FA0]/40"
                  : "border-[#213155]/15 bg-[#EAF0FA]/70 hover:border-[#103FA0]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <StepTag>{slot.label}</StepTag>
                {isActive && <span className="text-[10px] font-bold text-[#103FA0]">選詩中</span>}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#213155]/75">{slot.requirement}</p>
              <p className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs ${chosen ? "bg-[#008250]/15 text-[#008250]" : "bg-[#213155]/5 text-[#213155]/45"}`}>
                {chosen ? `${chosen.id}. ${chosen.lead}${chosen.text}` : "尚未選擇詩行"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">檔案中的八行詩（含抄錄者的干擾句）</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {lines.map((line) => {
            const used = usedLineIds.includes(line.id);
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => assign(line.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  used
                    ? "border-[#008250]/40 bg-[#008250]/10 text-[#213155]/70"
                    : "border-[#213155]/15 bg-[#EAF0FA] text-[#213155] hover:border-[#103FA0]/60"
                }`}
              >
                <span className="mr-2 font-mono text-xs font-bold text-[#103FA0]">{line.id}</span>
                <span className="font-serif font-bold">{line.lead}</span>
                {line.text}
                {used && <span className="ml-2 text-[10px] text-[#008250]">已使用</span>}
              </button>
            );
          })}
        </div>
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer(answers)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M03 6×6 邏輯矩陣                                                    */
/* ------------------------------------------------------------------ */

type GridMark = "possible" | "excluded";

function LogicGridStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    leftItems?: { id: string; label: string }[];
    rightItems?: { id: string; text: string }[];
    clues?: string[];
  };
  const leftItems = payload.leftItems ?? [];
  const rightItems = payload.rightItems ?? [];
  const clues = payload.clues ?? [];
  const [marks, setMarks] = useState<Record<string, GridMark>>({});
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [showClues, setShowClues] = useState(true);

  const setMark = (leftId: string, rightId: string) => {
    const key = `${leftId}:${rightId}`;
    setMarks((previous) => {
      const next = { ...previous };
      if (next[key] === "possible") {
        delete next[key];
        return next;
      }
      // 標記「可能」時，自動把同列、同欄的其他候選標為排除
      for (const otherLeft of leftItems) {
        if (otherLeft.id !== leftId) next[`${otherLeft.id}:${rightId}`] = "excluded";
      }
      for (const otherRight of rightItems) {
        if (otherRight.id !== rightId) next[`${leftId}:${otherRight.id}`] = "excluded";
      }
      next[key] = "possible";
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <HelperNote>
        點格子會在「可能／排除」之間切換；標記「可能」時系統會自動排除同列與同欄的其他候選，但不會替你在下方作答。
      </HelperNote>

      <div className="rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3.5">
        <button
          type="button"
          onClick={() => setShowClues((previous) => !previous)}
          className="flex w-full items-center justify-between text-sm font-bold text-[#103FA0]"
        >
          <span>線索筆記（{clues.length} 條）</span>
          <span className="text-[11px] font-normal text-[#213155]/60">{showClues ? "收合" : "展開"}</span>
        </button>
        {showClues && (
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#213155]/85">
            {clues.map((clue) => (
              <li key={clue} className="rounded-lg bg-white/60 px-2.5 py-1.5">
                {clue}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[#EAF0FA] p-1.5 text-left font-semibold text-[#213155]/70">名稱 \ 任務</th>
              {rightItems.map((right, index) => (
                <th key={right.id} className="p-1.5 text-center font-mono font-semibold text-[#103FA0]">
                  {String.fromCharCode(65 + index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leftItems.map((left) => (
              <tr key={left.id}>
                <th className="sticky left-0 bg-[#EAF0FA] p-1.5 text-left font-semibold text-[#213155]">{left.label}</th>
                {rightItems.map((right) => {
                  const mark = marks[`${left.id}:${right.id}`];
                  return (
                    <td key={right.id} className="p-1">
                      <button
                        type="button"
                        aria-label={`${left.label} 對 ${right.text}`}
                        onClick={() => setMark(left.id, right.id)}
                        className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold transition ${
                          mark === "possible"
                            ? "border-[#008250] bg-[#008250]/20 text-[#008250]"
                            : mark === "excluded"
                            ? "border-[#213155]/15 bg-[#213155]/5 text-[#213155]/30"
                            : "border-[#213155]/15 bg-white text-transparent hover:border-[#103FA0]/50"
                        }`}
                      >
                        {mark === "possible" ? "○" : mark === "excluded" ? "✕" : "·"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">正式配對（提交用）</p>
        {rightItems.map((right, index) => (
          <p key={right.id} className="text-[11px] leading-relaxed text-[#213155]/75">
            <span className="mr-1.5 font-mono font-bold text-[#103FA0]">{String.fromCharCode(65 + index)}</span>
            {right.text}
          </p>
        ))}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {leftItems.map((left) => (
            <label key={left.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-2.5 py-2 text-xs">
              <span className="font-semibold text-[#213155]">{left.label}</span>
              <select
                value={pairs[left.id] ?? ""}
                onChange={(event) =>
                  setPairs((previous) => {
                    const next = { ...previous };
                    if (event.target.value) next[left.id] = event.target.value;
                    else delete next[left.id];
                    return next;
                  })
                }
                className="min-h-[36px] rounded-lg border border-[#103FA0]/30 bg-[#EAF0FA] px-1.5 text-xs text-[#213155]"
              >
                <option value="">尚未選擇</option>
                {rightItems.map((right, index) => (
                  <option key={right.id} value={right.id}>
                    任務 {String.fromCharCode(65 + index)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer(pairs)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M04 時間排序＋年份換算                                              */
/* ------------------------------------------------------------------ */

interface TimelineItem {
  id: string;
  label: string;
  clue: string;
}

function TimelineYearsStage({ mission, settings, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    formula?: string;
    items?: TimelineItem[];
    museumFallbackArchive?: { period: string; heading: string; detail: string }[];
  };
  const items = payload.items ?? [];
  const archive = payload.museumFallbackArchive ?? [];
  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const [years, setYears] = useState<Record<string, string>>({});
  const [unit, setUnit] = useState<"ce" | "roc">("ce");
  const [showArchivePanel, setShowArchivePanel] = useState(!settings.historyMuseumOpen);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((previous) => {
      const next = [...previous];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const submit = () => {
    const ceYears: Record<string, string> = {};
    for (const [id, value] of Object.entries(years)) {
      const digits = value.replace(/[^0-9]/g, "");
      if (!digits) continue;
      ceYears[id] = unit === "roc" ? String(Number(digits) + 1911) : String(Number(digits));
    }
    onSubmitAnswer({ order, years: ceYears });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#103FA0]/35 bg-[#EAF0FA] p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#103FA0]">
            <BookOpen className="h-4 w-4" />
            {settings.historyMuseumOpen
              ? "官方校史參考卷宗（校史館開放時亦可隨時對照）"
              : "校史館目前休館 — 數位校史替代檔案室（免進館即可作答）"}
          </div>
          <button
            type="button"
            onClick={() => setShowArchivePanel((value) => !value)}
            className="rounded-lg border border-[#103FA0]/40 px-3 py-1 text-xs font-medium text-[#103FA0] hover:bg-[#103FA0]/10"
          >
            {showArchivePanel ? "收合校史檔案" : "展開閱讀校史檔案"}
          </button>
        </div>
        <p className="text-xs text-[#213155]/75">換算規則：{payload.formula ?? "民國年 + 1911 = 西元年"}</p>
        {showArchivePanel && (
          <div className="grid gap-2 sm:grid-cols-2">
            {archive.map((entry) => (
              <div key={entry.period} className="rounded-xl border border-[#213155]/10 bg-white/70 p-2.5">
                <p className="text-[11px] font-bold text-[#103FA0]">{entry.period}</p>
                <p className="text-xs font-semibold text-[#213155]">{entry.heading}</p>
                <p className="text-[11px] leading-relaxed text-[#213155]/75">{entry.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <HelperNote>用「上移／下移」把八個事件由最早排到最晚，並在每張卡填入換算後的年份。</HelperNote>
        <div className="flex items-center gap-1 rounded-full border border-[#103FA0]/30 bg-[#EAF0FA] p-1">
          <button
            type="button"
            onClick={() => setUnit("ce")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${unit === "ce" ? "bg-[#103FA0] text-white" : "text-[#103FA0]"}`}
          >
            西元
          </button>
          <button
            type="button"
            onClick={() => setUnit("roc")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${unit === "roc" ? "bg-[#103FA0] text-white" : "text-[#103FA0]"}`}
          >
            民國
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {order.map((itemId, index) => {
          const item = items.find((candidate) => candidate.id === itemId);
          if (!item) return null;
          const value = years[item.id] ?? "";
          const digits = Number(value.replace(/[^0-9]/g, ""));
          const converted = digits
            ? unit === "ce"
              ? `民國 ${digits - 1911} 年`
              : `西元 ${digits + 1911} 年`
            : "";
          return (
            <div key={item.id} className="rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F9CF00] font-mono text-sm font-bold text-[#213155]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-snug text-[#213155]">{item.label}</p>
                    <p className="text-[11px] leading-relaxed text-[#213155]/65">{item.clue}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="往上移動"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#103FA0]/35 bg-white text-[#213155] hover:border-[#103FA0] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="往下移動"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#103FA0]/35 bg-white text-[#213155] hover:border-[#103FA0] disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 pl-11">
                <input
                  value={value}
                  inputMode="numeric"
                  onChange={(event) => setYears((previous) => ({ ...previous, [item.id]: event.target.value }))}
                  placeholder={unit === "ce" ? "西元年份" : "民國年份"}
                  className="min-h-[38px] w-32 rounded-lg border border-[#103FA0]/30 bg-white px-2 font-mono text-sm text-[#213155] outline-none focus:border-[#103FA0]"
                />
                <span className="text-[11px] text-[#213155]/60">{converted}</span>
              </div>
            </div>
          );
        })}
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={submit} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M05 雙層配對＋索引字密文                                            */
/* ------------------------------------------------------------------ */

function EmblemLayersStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    components?: { id: string; label: string; layer: string; order: number }[];
    meanings?: { id: string; text: string; indexChar?: string }[];
    codeLabel?: string;
  };
  const components = payload.components ?? [];
  const meanings = payload.meanings ?? [];
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [activeComponent, setActiveComponent] = useState<string | null>(components[0]?.id ?? null);
  const [code, setCode] = useState("");

  const assign = (meaningId: string) => {
    if (!activeComponent) return;
    setPairs((previous) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(previous)) {
        if (value !== meaningId) next[key] = value;
      }
      next[activeComponent] = meaningId;
      return next;
    });
    setActiveComponent(components.find((component) => component.id !== activeComponent && !pairs[component.id])?.id ?? null);
  };

  const allPaired = components.every((component) => pairs[component.id]);
  const readOrder = [...components].sort((a, b) => a.order - b.order);
  const indexChars = readOrder.map((component) => {
    const meaning = meanings.find((item) => item.id === pairs[component.id]);
    return { component, char: meaning?.indexChar ?? "" };
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3.5 text-xs leading-relaxed text-[#103FA0]">
        第一階段：先點一張構件卡，再點對應的意涵卡完成六組配對。第二階段（索引字）在第一階段完成後才會顯示。
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">① 構件（外形→植物→數量→器物→造型→邊界）</p>
          {readOrder.map((component) => {
            const meaning = meanings.find((item) => item.id === pairs[component.id]);
            const isActive = activeComponent === component.id;
            return (
              <button
                key={component.id}
                type="button"
                onClick={() => setActiveComponent(component.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-[#103FA0] bg-[#F9CF00]/10 ring-2 ring-[#103FA0]/40"
                    : meaning
                    ? "border-[#008250]/40 bg-[#EAF0FA]"
                    : "border-[#213155]/15 bg-[#EAF0FA]/70 hover:border-[#103FA0]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#213155]">
                    {component.label}
                    <span className="ml-2 text-[10px] font-normal text-[#213155]/55">{component.layer}</span>
                  </span>
                  {isActive && <span className="text-[10px] font-bold text-[#103FA0]">配對中</span>}
                </div>
                {meaning && <p className="mt-1.5 text-xs leading-relaxed text-[#008250]">已配對：{meaning.text}</p>}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">② 意涵卡（順序已打亂）</p>
          {meanings.map((meaning) => {
            const used = Object.values(pairs).includes(meaning.id);
            return (
              <button
                key={meaning.id}
                type="button"
                disabled={!activeComponent}
                onClick={() => assign(meaning.id)}
                className={`min-h-[52px] w-full rounded-2xl border p-3 text-left text-xs leading-relaxed transition ${
                  used
                    ? "border-[#008250]/40 bg-[#008250]/10 text-[#213155]/70"
                    : "border-[#103FA0]/35 bg-[#EAF0FA] text-[#213155] hover:border-[#103FA0]"
                }`}
              >
                {meaning.text}
                {used && <span className="ml-2 text-[10px] text-[#008250]">已配對</span>}
              </button>
            );
          })}
        </div>
      </div>

      {allPaired ? (
        <div className="space-y-3 rounded-2xl border border-[#008250]/40 bg-[#EAF0FA] p-4">
          <p className="text-xs font-bold text-[#008250]">第二階段：翻開意涵卡右下角的索引字</p>
          <div className="flex flex-wrap gap-2">
            {indexChars.map(({ component, char }, index) => (
              <div key={component.id} className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#103FA0]/45 bg-white font-serif text-2xl font-bold text-[#103FA0] shadow-sm">
                  {char || "・"}
                </div>
                <span className="text-[10px] text-[#213155]/60">
                  {index + 1}. {component.label}
                </span>
              </div>
            ))}
          </div>
          <label htmlFor="emblem-code" className="block text-xs font-semibold text-[#103FA0]">
            {payload.codeLabel ?? "第二層校驗詞"}
          </label>
          <input
            id="emblem-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="輸入六個索引字"
            className="min-h-[44px] w-full rounded-xl border border-[#103FA0]/35 bg-white px-3 text-sm text-[#213155] outline-none focus:border-[#103FA0]"
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#213155]/25 bg-[#EAF0FA]/50 p-4 text-xs text-[#213155]/55">
          第二層密碼封存中：完成六組配對後才會顯示索引字。
        </p>
      )}

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer({ pairs, code })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M06 因果循環＋概念追問                                              */
/* ------------------------------------------------------------------ */

function CycleFlowStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    nodes?: { id: string; label: string }[];
    questions?: { id: string; label: string; prompt: string; placeholder?: string }[];
    factBoundary?: string;
  };
  const nodes = payload.nodes ?? [];
  const questions = payload.questions ?? [];
  const [order, setOrder] = useState<string[]>(() => nodes.map((node) => node.id));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Record<string, string>>({});

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    setOrder((previous) => {
      const next = [...previous];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <HelperNote>先排出四張概念卡的循環順序（第一個是「產生養分」的起點），再用一句話回答三個追問。</HelperNote>

      <div className="space-y-2">
        {order.map((nodeId, index) => {
          const node = nodes.find((candidate) => candidate.id === nodeId);
          if (!node) return null;
          return (
            <div key={node.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F9CF00] font-mono text-sm font-bold text-[#213155]">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-[#213155]">{node.label}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="往上移動"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#103FA0]/35 bg-white hover:border-[#103FA0] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="往下移動"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#103FA0]/35 bg-white hover:border-[#103FA0] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        <p className="text-center text-xs text-[#213155]/55">↻ 最後一張的水回到養殖系統後，再接回第一張</p>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <div key={question.id} className="rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StepTag>{question.label}</StepTag>
              <select
                aria-label={`${question.label} 證據標籤`}
                value={tags[question.id] ?? ""}
                onChange={(event) => setTags((previous) => ({ ...previous, [question.id]: event.target.value }))}
                className="rounded-lg border border-[#103FA0]/30 bg-white px-2 py-1 text-[11px] text-[#213155]"
              >
                <option value="">標籤：已知／可推論／未知</option>
                <option value="known">已知</option>
                <option value="inferred">可推論</option>
                <option value="unknown">未知</option>
              </select>
            </div>
            <p className="text-sm leading-relaxed text-[#213155]">{question.prompt}</p>
            <input
              value={answers[question.id] ?? ""}
              onChange={(event) => setAnswers((previous) => ({ ...previous, [question.id]: event.target.value }))}
              placeholder={question.placeholder ?? "用一句話回答"}
              className="min-h-[42px] w-full rounded-xl border border-[#103FA0]/30 bg-white px-3 text-sm text-[#213155] outline-none focus:border-[#103FA0]"
            />
          </div>
        ))}
      </div>

      {payload.factBoundary && (
        <p className="rounded-xl border border-[#B98A00]/35 bg-[#F9CF00]/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#213155]/80">
          {payload.factBoundary}
        </p>
      )}

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer({ order, answers, tags })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M07 受限配額分派                                                    */
/* ------------------------------------------------------------------ */

function OfficeQuotaStage({ mission, submitting, isSolved, feedback, onSubmitAnswer }: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    records?: { id: string; main: string; aside: string }[];
    offices?: { id: string; label: string; note: string; quota?: number }[];
  };
  const records = payload.records ?? [];
  const offices = payload.offices ?? [];
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [activeRecord, setActiveRecord] = useState<string | null>(null);

  const assign = (recordId: string, officeId: string | null) => {
    setAssignments((previous) => {
      const next = { ...previous };
      if (!officeId) delete next[recordId];
      else next[recordId] = officeId;
      return next;
    });
    setActiveRecord(null);
  };

  return (
    <div className="space-y-5">
      <HelperNote>
        先點一份紀錄，再點要放入的處室收件匣。每份紀錄只能放一次，每個收件匣只能收兩件。
      </HelperNote>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#213155]/60">八份求助紀錄</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {records.map((record) => {
            const officeId = assignments[record.id];
            const isActive = activeRecord === record.id;
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => setActiveRecord((previous) => (previous === record.id ? null : record.id))}
                className={`rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-[#103FA0] bg-[#F9CF00]/15 ring-2 ring-[#103FA0]/40"
                    : officeId
                    ? "border-[#008250]/40 bg-[#008250]/5"
                    : "border-[#213155]/15 bg-[#EAF0FA] hover:border-[#103FA0]/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#103FA0]">檔案 {record.id}</span>
                  {officeId && (
                    <span className="text-[10px] text-[#008250]">{offices.find((office) => office.id === officeId)?.label}</span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-[#213155]">{record.main}</p>
                <p className="mt-0.5 text-[11px] text-[#213155]/55">（順便想問：{record.aside}）</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {offices.map((office) => {
          const inbox = records.filter((record) => assignments[record.id] === office.id).map((record) => record.id).sort();
          const quota = office.quota ?? 2;
          const over = inbox.length > quota;
          return (
            <div
              key={office.id}
              className={`flex min-h-[140px] flex-col gap-2 rounded-2xl border p-3 ${
                over ? "border-[#D21E14]/50 bg-[#D21E14]/5" : "border-[#103FA0]/25 bg-[#EAF0FA]/70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[#213155]">{office.label}</p>
                  <p className="text-[11px] leading-relaxed text-[#213155]/60">{office.note}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${over ? "bg-[#D21E14]/15 text-[#D21E14]" : "bg-[#103FA0]/10 text-[#103FA0]"}`}>
                  {inbox.length} / {quota}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inbox.map((recordId) => (
                  <button
                    key={recordId}
                    type="button"
                    onClick={() => assign(recordId, null)}
                    className="rounded-lg border border-[#008250]/40 bg-[#008250]/10 px-2 py-1 font-mono text-[11px] font-bold text-[#008250]"
                    title="點一下移回"
                  >
                    {recordId}
                  </button>
                ))}
              </div>
              {inbox.length > 0 && (
                <p className="text-[10px] text-[#213155]/55">字母排序：{inbox.join("、")}</p>
              )}
              <button
                type="button"
                disabled={!activeRecord}
                onClick={() => activeRecord && assign(activeRecord, office.id)}
                className={`mt-auto min-h-[38px] rounded-xl border text-xs font-semibold transition ${
                  activeRecord
                    ? "border-[#103FA0] bg-[#F9CF00] text-[#213155] hover:bg-[#FFDD33]"
                    : "border-[#213155]/15 bg-[#EAF0FA] text-[#213155]/40"
                }`}
              >
                {activeRecord ? `放入 ${office.label}` : "先選一份紀錄"}
              </button>
            </div>
          );
        })}
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar submitting={submitting} isSolved={isSolved} onSubmit={() => onSubmitAnswer(assignments)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* M08 跨關交叉校驗＋終章口令                                          */
/* ------------------------------------------------------------------ */

function FinalCrosscheckStage({
  mission,
  submitting,
  isSolved,
  feedback,
  allSolvedDetails,
  onSubmitAnswer,
}: MissionStageProps) {
  const payload = mission.puzzlePayload as {
    checks?: { id: string; label: string; placeholder?: string; keep?: string }[];
    passphrase?: { label: string; prompt: string };
    promises?: string[];
  };
  const checks = payload.checks ?? [];
  const promises = payload.promises ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [passphrase, setPassphrase] = useState("");
  const [showClueDrawer, setShowClueDrawer] = useState(false);
  const [showPromises, setShowPromises] = useState(false);

  const solvedCount = Object.keys(allSolvedDetails).filter((id) => Number(id) < 8).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#103FA0]/35 bg-[#EAF0FA] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#103FA0]">
            <BookOpen className="h-4 w-4" />
            前七關已收集的線索卡（{solvedCount} / 7）
          </span>
          <button
            type="button"
            onClick={() => setShowClueDrawer((value) => !value)}
            className="rounded-lg border border-[#103FA0]/40 px-3 py-1 text-xs font-medium text-[#103FA0] hover:bg-[#103FA0]/10"
          >
            {showClueDrawer ? "收合線索卡" : "調閱我的線索卡"}
          </button>
        </div>
        {showClueDrawer && (
          <div className="mt-3 space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((id) => {
              const detail = allSolvedDetails[id];
              return (
                <div key={id} className="rounded-xl border border-[#213155]/10 bg-white/70 px-3 py-2 text-xs text-[#213155]/85">
                  {detail ? detail.clueSummary : <span className="text-[#213155]/45">線索 0{id}：尚未取得。</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {checks.map((check, index) => (
          <label key={check.id} className="block rounded-2xl border border-[#103FA0]/25 bg-[#EAF0FA] p-3.5">
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#213155]">
                {index + 1}. {check.label}
              </span>
              {check.keep && <span className="text-[10px] text-[#213155]/50">{check.keep}</span>}
            </span>
            <input
              value={answers[check.id] ?? ""}
              onChange={(event) => setAnswers((previous) => ({ ...previous, [check.id]: event.target.value }))}
              placeholder={check.placeholder ?? "輸入答案"}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-[#103FA0]/30 bg-white px-3 text-sm text-[#213155] outline-none focus:border-[#103FA0]"
            />
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-[#B98A00]/40 bg-[#F9CF00]/10 p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#213155]">{payload.passphrase?.label ?? "終章口令"}</p>
          <button
            type="button"
            onClick={() => setShowPromises((value) => !value)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#103FA0]/40 px-2.5 py-1 text-[11px] text-[#103FA0] hover:bg-[#103FA0]/10"
          >
            <HelpCircle className="h-3 w-3" />
            {showPromises ? "收合四句承諾提示" : "需要四句承諾的句型提示？"}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-[#213155]/75">{payload.passphrase?.prompt}</p>
        {showPromises && (
          <ul className="space-y-1 text-[11px] leading-relaxed text-[#213155]/75">
            {promises.map((promise) => (
              <li key={promise} className="rounded-lg bg-white/70 px-2.5 py-1.5">
                {promise.replace(/^(把.)/, "$1…")}
              </li>
            ))}
            <li className="text-[#B98A00]">提示只顯示句型，不會告訴你哪些字是動詞。</li>
          </ul>
        )}
        <input
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="輸入終章口令"
          className="min-h-[46px] w-full rounded-xl border border-[#103FA0]/35 bg-white px-3 text-center font-serif text-base font-bold tracking-[0.2em] text-[#213155] outline-none focus:border-[#103FA0]"
        />
      </div>

      <FeedbackBanner feedback={feedback} />
      <SubmitBar
        submitting={submitting}
        isSolved={isSolved}
        onSubmit={() => onSubmitAnswer({ ...answers, passphrase })}
      />
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#213155]/55">
        <Check className="h-3 w-3" /> 通過後會取得最後一枚碎片，並可前往終章信紙完成四句承諾的重組。
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 題型分派                                                            */
/* ------------------------------------------------------------------ */

export function MissionPuzzleStage(props: MissionStageProps) {
  switch (props.mission.puzzleType) {
    case "evidence-classify":
      return <EvidenceClassifyStage {...props} />;
    case "acrostic-select":
      return <AcrosticStage {...props} />;
    case "logic-grid":
      return <LogicGridStage {...props} />;
    case "timeline-years":
      return <TimelineYearsStage {...props} />;
    case "emblem-layers":
      return <EmblemLayersStage {...props} />;
    case "cycle-flow":
      return <CycleFlowStage {...props} />;
    case "office-quota":
      return <OfficeQuotaStage {...props} />;
    case "final-crosscheck":
      return <FinalCrosscheckStage {...props} />;
    default:
      return (
        <p className="rounded-2xl border border-[#D21E14]/40 bg-[#D21E14]/5 p-4 text-sm text-[#213155]">
          未知題型，請重新載入遊戲資料。
        </p>
      );
  }
}
