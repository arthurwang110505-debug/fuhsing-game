"use client";

import React from "react";
import type { PublicMission } from "@/types/game";
import { findMissingFields, getAnswerSheet, type AnswerField } from "@/lib/answer-sheets";
import { AlertCircle, CheckCircle2, ExternalLink, FileText, NotebookPen, Stamp } from "lucide-react";

interface AnswerSheetProps {
  mission: PublicMission;
  isSolved: boolean;
  submitting: boolean;
  feedback: { type: "error" | "success"; message: string } | null;
  onSubmitAnswer: (answer: unknown) => void;
}

function FeedbackBanner({ feedback }: { feedback: AnswerSheetProps["feedback"] }) {
  if (!feedback) return null;
  const isError = feedback.type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-2xl border p-4 text-sm leading-relaxed ${
        isError ? "border-[#D21E14]/40 bg-[#D21E14]/5 text-[#7A1F14]" : "border-[#008250]/40 bg-[#008250]/10 text-[#00633D]"
      }`}
    >
      {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{feedback.message}</span>
    </div>
  );
}

function FieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: AnswerField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const base =
    "mt-1.5 w-full rounded-xl border border-[#103FA0]/30 bg-white px-3 py-2 text-sm text-[#213155] outline-none transition focus:border-[#103FA0] focus:ring-2 focus:ring-[#103FA0]/20 disabled:bg-[#EAF0FA]/60 disabled:text-[#213155]/60";

  if (field.kind === "select") {
    return (
      <select aria-label={field.label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={base}>
        <option value="">— 請選擇 —</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.kind === "textarea") {
    return (
      <textarea
        aria-label={field.label}
        value={value}
        disabled={disabled}
        rows={2}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={base}
      />
    );
  }

  return (
    <input
      aria-label={field.label}
      type="text"
      value={value}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={base}
    />
  );
}

export default function AnswerSheet({ mission, isSolved, submitting, feedback, onSubmitAnswer }: AnswerSheetProps) {
  const sheet = getAnswerSheet(mission.id);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [localError, setLocalError] = React.useState<string | null>(null);

  if (!sheet) {
    return (
      <p className="rounded-2xl border border-[#D21E14]/40 bg-[#D21E14]/5 p-4 text-sm text-[#213155]">
        找不到本關的作答表，請重新載入遊戲資料。
      </p>
    );
  }

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setLocalError(null);
  };

  const handleSubmit = () => {
    const missing = findMissingFields(sheet, values);
    if (missing.length > 0) {
      setLocalError(`還有 ${missing.length} 個欄位沒有填：${missing.slice(0, 3).join("、")}${missing.length > 3 ? "…" : ""}`);
      return;
    }
    setLocalError(null);
    onSubmitAnswer(sheet.build(values));
  };

  const selectFields = sheet.fields.filter((field) => field.kind === "select");
  const textFields = sheet.fields.filter((field) => field.kind !== "select");

  return (
    <div className="space-y-5">
      {/* 紙本線索提示：網站不重現線索內容 */}
      <div className="rounded-2xl border border-[#103FA0]/30 bg-[#EAF0FA] p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#103FA0]">
          <FileText className="h-4 w-4" /> 本關線索在紙本：{sheet.cardTitle}
        </div>
        <p className="text-xs leading-relaxed text-[#213155]/80">
          系統只負責收答案，不重現題目資料——這樣紙本就是唯一線索來源。請拿出影印的學生手冊，翻到這張線索卡。
        </p>
        <ul className="grid gap-1 text-xs text-[#213155]/80 sm:grid-cols-2">
          {sheet.supplies.map((item) => (
            <li key={item} className="flex gap-1.5">
              <span className="text-[#103FA0]">・</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={encodeURI(mission.materialUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#103FA0]/35 bg-white px-3 py-2 text-xs font-semibold text-[#103FA0] transition hover:bg-[#103FA0]/10"
          >
            <ExternalLink className="h-3.5 w-3.5" /> 開啟／列印線索卡手冊
          </a>
          <span className="text-xs text-[#213155]/65">{sheet.answerFocus}</span>
        </div>
      </div>

      {selectFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#103FA0]">
            <Stamp className="h-3.5 w-3.5" /> 配對與分類
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectFields.map((field) => (
              <label key={field.id} className="block rounded-2xl border border-[#213155]/10 bg-white/70 p-3">
                <span className="text-xs font-semibold text-[#213155]">{field.label}</span>
                <FieldControl field={field} value={values[field.id] ?? ""} disabled={isSolved || submitting} onChange={(value) => setValue(field.id, value)} />
              </label>
            ))}
          </div>
        </div>
      )}

      {textFields.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#103FA0]">
            <NotebookPen className="h-3.5 w-3.5" /> 文字作答
          </div>
          <div className="space-y-3">
            {textFields.map((field) => (
              <label key={field.id} className="block rounded-2xl border border-[#213155]/10 bg-white/70 p-3">
                <span className="text-xs font-semibold text-[#213155]">{field.label}</span>
                <FieldControl field={field} value={values[field.id] ?? ""} disabled={isSolved || submitting} onChange={(value) => setValue(field.id, value)} />
              </label>
            ))}
          </div>
        </div>
      )}

      {localError && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-[#B98A00]/40 bg-[#F9CF00]/15 p-3 text-xs text-[#7A5B00]">
          <AlertCircle className="h-3.5 w-3.5" /> {localError}
        </p>
      )}

      <FeedbackBanner feedback={feedback} />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || isSolved}
        className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F9CF00] px-6 py-3.5 text-base font-bold text-[#213155] shadow-[0_12px_32px_rgba(249,207,0,0.28)] transition hover:bg-[#FFDD33] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Stamp className="h-5 w-5" />
        {isSolved ? "本關已完成" : submitting ? "送出中…" : "送出答案"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#213155]/55">
        <CheckCircle2 className="h-3 w-3" /> 送出後系統只回覆判讀方向，不會告訴你哪一欄錯。
      </p>
    </div>
  );
}
