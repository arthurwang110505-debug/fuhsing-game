import type { GameSettings, HintStage, PublicMission, SolvedMissionDetail } from "@/types/game";
import { MAX_HINT_STAGE } from "@/types/game";
import { FINAL_PUZZLE_DATA, SEED_MISSIONS, type SeedMission } from "./seed-data";

/** 每開啟一階提示，該關扣 1 分；每關最多三階提示（困難模式規格） */
export const HINT_PENALTY_POINTS = 1;

/** Local-only game rules and seed data. No API, database, or server access is used. */
export function getLocalMissions(): PublicMission[] {
  return SEED_MISSIONS.map((mission) => ({ ...mission }));
}

export function getLocalSettings(): GameSettings {
  return { historyMuseumOpen: true };
}

export function extractSolvedDetail(mission: SeedMission): SolvedMissionDetail {
  return {
    id: mission.id,
    explanation: mission.explanation,
    fragmentName: mission.fragmentName,
    fragmentPoem: mission.fragmentPoem,
    fragmentSymbol: mission.fragmentSymbol,
    clueSummary: mission.clueSummary,
    sourceTitle: mission.sourceTitle,
    sourceUrl: mission.sourceUrl,
  };
}

export function getHintText(mission: Pick<SeedMission, "hint1" | "hint2" | "hint3">, stage: HintStage): string {
  if (stage === 1) return mission.hint1;
  if (stage === 2) return mission.hint2;
  return mission.hint3;
}

export function computeUnlockedMissionIds(
  missionList: Pick<SeedMission, "id" | "defaultUnlocked">[],
  completedMissions: number[]
): number[] {
  const completed = new Set(completedMissions);
  const firstSevenDone = [1, 2, 3, 4, 5, 6, 7].every((id) => completed.has(id));
  return missionList.filter((mission) =>
    completed.has(mission.id) ||
    (mission.id === 8 ? firstSevenDone || mission.defaultUnlocked : mission.defaultUnlocked)
  ).map((mission) => mission.id);
}

export function computeHintPenalty(completedMissions: number[], hintsUsed: Record<string, number> = {}): number {
  const completed = new Set(completedMissions);
  let hintCount = 0;
  for (const [key, value] of Object.entries(hintsUsed)) {
    const id = Number(key);
    const used = Math.max(0, Math.min(MAX_HINT_STAGE, Number(value) || 0));
    if (completed.has(id)) hintCount += used;
  }
  return hintCount * HINT_PENALTY_POINTS;
}

export function computeTotalScore(
  completedMissions: number[],
  finalSolved: boolean,
  hintsUsed: Record<string, number> = {}
): number {
  const count = new Set(completedMissions.filter((id) => id >= 1 && id <= 8)).size;
  const base = Math.min(100, count * 10 + (finalSolved ? 10 : 0) + (count === 8 && finalSolved ? 10 : 0));
  return Math.max(0, base - computeHintPenalty(completedMissions, hintsUsed));
}

/**
 * 答案正規化：去除空白（含全形空白）、統一全形／半形，並移除常見標點。
 * 中文答案不得只用「包含」比對，因此正規化後仍要求整段相等或符合題目設定的概念條件。
 */
export function normalizeAnswer(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[，,。.、；;：:！!？?「」『』（）()／/《》〈〉【】"'’”“—–-]/g, "")
    .toLowerCase();
}

interface KeywordRule {
  requiredGroups?: string[][];
  forbiddenTerms?: string[];
}

function matchesKeywordRule(answer: string, rule: KeywordRule): boolean {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  if (Array.isArray(rule.forbiddenTerms)) {
    for (const term of rule.forbiddenTerms) {
      const normalizedTerm = normalizeAnswer(term);
      if (normalizedTerm && normalized.includes(normalizedTerm)) return false;
    }
  }
  if (Array.isArray(rule.requiredGroups)) {
    return rule.requiredGroups.every((group) =>
      group.some((term) => {
        const normalizedTerm = normalizeAnswer(term);
        return normalizedTerm.length > 0 && normalized.includes(normalizedTerm);
      })
    );
  }
  return true;
}

function wrongCount(total: number, correct: number): number {
  return Math.max(0, total - correct);
}

/** 由題庫資料與正解推導 M01 的檔案鎖校驗字，避免另存一份明文答案 */
export function deriveEvidenceLock(mission: SeedMission): string {
  const payload = mission.puzzlePayload as {
    cards?: { id: string; order: number; token?: string }[];
  };
  const placement = (mission.correctAnswer as { placement?: Record<string, string> }).placement ?? {};
  const cards = [...(payload.cards ?? [])].sort((a, b) => a.order - b.order);
  return cards
    .filter((card) => placement[card.id] === "confirmed")
    .map((card) => card.token ?? "")
    .join("");
}

export function gradeMissionAnswer(
  mission: SeedMission,
  submission: unknown
): { isCorrect: boolean; feedback: string } {
  const expected = mission.correctAnswer as unknown;
  const sub = (submission && typeof submission === "object" ? submission : {}) as Record<string, unknown>;

  switch (mission.puzzleType) {
    case "evidence-classify": {
      const exp = expected as { placement: Record<string, string>; lock: string };
      const placement = (sub.placement && typeof sub.placement === "object" ? sub.placement : {}) as Record<string, string>;
      const cardIds = Object.keys(exp.placement);
      if (cardIds.some((id) => !placement[id])) {
        return { isCorrect: false, feedback: "還有證詞卡沒有放進證據欄，請先完成七張卡的分類。" };
      }
      if (!normalizeAnswer(sub.lock)) {
        return { isCorrect: false, feedback: "分類完成了，但檔案鎖還沒輸入校驗字；請讀取可證實卡片背面的字。" };
      }
      const correctPlacements = cardIds.filter((id) => placement[id] === exp.placement[id]).length;
      const placementOk = correctPlacements === cardIds.length;
      const lockOk = normalizeAnswer(sub.lock) === normalizeAnswer(exp.lock);
      if (placementOk && lockOk) {
        return { isCorrect: true, feedback: "證據審查通過：每個結論都能由來源支持，檔案鎖也打開了。" };
      }
      if (placementOk && !lockOk) {
        return {
          isCorrect: false,
          feedback: "七張卡的分類都正確，但檔案鎖校驗字不對；請依卡號順序重讀可證實卡片的字，未載與矛盾卡不取字。",
        };
      }
      if (lockOk && !placementOk) {
        return {
          isCorrect: false,
          feedback: `校驗字正確，但分類還有 ${wrongCount(cardIds.length, correctPlacements)} 張卡放錯欄位；請重新分辨「矛盾」與「未載」。`,
        };
      }
      return {
        isCorrect: false,
        feedback: `檔案鎖尚未回應；目前有 ${wrongCount(cardIds.length, correctPlacements)} 張證詞卡需要重新檢查欄位。`,
      };
    }

    case "acrostic-select": {
      const exp = expected as Record<string, string>;
      const slotIds = Object.keys(exp);
      if (slotIds.some((id) => !sub[id])) {
        return { isCorrect: false, feedback: "四個語意槽位都要放入詩行才能讀出密令。" };
      }
      const correct = slotIds.filter((id) => sub[id] === exp[id]).length;
      if (correct === slotIds.length) {
        return { isCorrect: true, feedback: "鐘塔傳來清脆的共鳴！四行密令完全正確。" };
      }
      return {
        isCorrect: false,
        feedback: `密令尚未成形：有 ${wrongCount(slotIds.length, correct)} 個槽位的語意選擇需要重新檢查（注意被偷換概念的那一行）。`,
      };
    }

    case "logic-grid": {
      const exp = expected as Record<string, string>;
      const keys = Object.keys(exp);
      if (keys.some((key) => !sub[key])) {
        return { isCorrect: false, feedback: "還有空間沒有完成配對，請六組都選好再送出。" };
      }
      const correct = keys.filter((key) => sub[key] === exp[key]).length;
      if (correct === keys.length) {
        return { isCorrect: true, feedback: "邏輯矩陣收斂成功：六座空間的身分全部確認。" };
      }
      return {
        isCorrect: false,
        feedback: `尚有 ${wrongCount(keys.length, correct)} 組衝突；回到線索與矩陣記號重新檢查關係。`,
      };
    }

    case "timeline-years": {
      const exp = expected as { order: string[]; years: Record<string, string> };
      const order = Array.isArray(sub.order) ? (sub.order as string[]) : [];
      const years = (sub.years && typeof sub.years === "object" ? sub.years : {}) as Record<string, string>;
      const yearKeys = Object.keys(exp.years);
      if (yearKeys.some((key) => !normalizeAnswer(years[key]))) {
        return { isCorrect: false, feedback: "只排序不算完成：請為每張事件卡填入換算後的西元年份。" };
      }
      if (order.length !== exp.order.length) {
        return { isCorrect: false, feedback: `請確認 ${exp.order.length} 個校史事件都已排入時間軸。` };
      }
      const orderCorrect = exp.order.filter((id, index) => order[index] === id).length;
      const yearsCorrect = yearKeys.filter((key) => normalizeAnswer(years[key]) === normalizeAnswer(exp.years[key])).length;
      const orderOk = orderCorrect === exp.order.length;
      const yearsOk = yearsCorrect === yearKeys.length;
      if (orderOk && yearsOk) {
        return { isCorrect: true, feedback: "時間齒輪順利轉動：排序與年份換算完全一致。" };
      }
      if (orderOk && !yearsOk) {
        return {
          isCorrect: false,
          feedback: `排序正確，但年份換算還有 ${wrongCount(yearKeys.length, yearsCorrect)} 處不一致；請用「民國年 + 1911」重新計算。`,
        };
      }
      if (!orderOk && yearsOk) {
        return {
          isCorrect: false,
          feedback: `年份都換算正確了，但時間順序還有 ${wrongCount(exp.order.length, orderCorrect)} 個位置要調整。`,
        };
      }
      return {
        isCorrect: false,
        feedback: "時間軸尚未復原：排序與年份換算都還有需要調整的地方，先確認錨點事件再推導其餘年份。",
      };
    }

    case "emblem-layers": {
      const exp = expected as { pairs: Record<string, string>; code: string };
      const pairs = (sub.pairs && typeof sub.pairs === "object" ? sub.pairs : {}) as Record<string, string>;
      const keys = Object.keys(exp.pairs);
      if (keys.some((key) => !pairs[key])) {
        return { isCorrect: false, feedback: "請先完成六組構件與意涵的一對一配對，第二層密碼才會出現。" };
      }
      const pairCorrect = keys.filter((key) => pairs[key] === exp.pairs[key]).length;
      if (pairCorrect !== keys.length) {
        return {
          isCorrect: false,
          feedback: `第一層還有 ${wrongCount(keys.length, pairCorrect)} 組配對衝突；梅花、五片花瓣與兩種火焰造型要分開處理。`,
        };
      }
      if (normalizeAnswer(sub.code) !== normalizeAnswer(exp.code)) {
        return { isCorrect: false, feedback: "配對全部正確，但第二層校驗詞不正確；請依外形→植物→數量→器物→造型→邊界重讀索引字。" };
      }
      return { isCorrect: true, feedback: "雙層密碼同時解開：構件配對與索引字密文都正確。" };
    }

    case "cycle-flow": {
      const exp = expected as {
        order: string[];
        answers: Record<string, string>;
        rules?: Record<string, KeywordRule>;
      };
      const order = Array.isArray(sub.order) ? (sub.order as string[]) : [];
      const answers = (sub.answers && typeof sub.answers === "object" ? sub.answers : {}) as Record<string, string>;
      const questionIds = Object.keys(exp.answers);
      const ruleFor = (id: string): KeywordRule =>
        exp.rules?.[id] ?? { requiredGroups: [[exp.answers[id]]] };
      if (order.length !== exp.order.length) {
        return { isCorrect: false, feedback: "請把四張概念卡都排入循環流程。" };
      }
      if (questionIds.some((id) => !normalizeAnswer(answers[id]))) {
        return { isCorrect: false, feedback: "三個追問都要用一句話回答，才能完成缺頁。" };
      }
      const orderOk = exp.order.every((id, index) => order[index] === id);
      if (!orderOk) {
        return { isCorrect: false, feedback: "循環流程還沒接上：請確認養分從哪裡產生、由誰利用、最後如何回流。" };
      }
      const correctAnswers = questionIds.filter((id) => matchesKeywordRule(answers[id], ruleFor(id))).length;
      if (correctAnswers === questionIds.length) {
        return { isCorrect: true, feedback: "循環與三層證據邊界都通過：已知、可推論與未知分得很清楚。" };
      }
      return {
        isCorrect: false,
        feedback: `循環順序正確，但概念追問還有 ${wrongCount(questionIds.length, correctAnswers)} 題需要重新檢查（注意「理念」與「設備」、「不能推得」與「已證明」的差別）。`,
      };
    }

    case "office-quota": {
      const exp = expected as Record<string, string>;
      const recordIds = Object.keys(exp);
      if (recordIds.some((id) => !sub[id])) {
        return { isCorrect: false, feedback: "還有紀錄沒有放進收件匣，請把八份都分派完成。" };
      }
      const payload = mission.puzzlePayload as { offices?: { id: string; quota?: number }[] };
      const quotas = new Map<string, number>();
      for (const office of payload.offices ?? []) quotas.set(office.id, office.quota ?? 2);
      const counts = new Map<string, number>();
      for (const id of recordIds) {
        const officeId = String(sub[id]);
        counts.set(officeId, (counts.get(officeId) ?? 0) + 1);
      }
      const quotaBroken = [...quotas.entries()].filter(([officeId, quota]) => (counts.get(officeId) ?? 0) !== quota).length;
      if (quotaBroken > 0) {
        return {
          isCorrect: false,
          feedback: `件數衝突：有 ${quotaBroken} 個收件匣的件數不符合配額，先把每匣調整為兩件。`,
        };
      }
      const correct = recordIds.filter((id) => sub[id] === exp[id]).length;
      if (correct === recordIds.length) {
        return { isCorrect: true, feedback: "配額與分類同時成立：八份紀錄都回到正確的處室。" };
      }
      return {
        isCorrect: false,
        feedback: `配額符合，仍有 ${wrongCount(recordIds.length, correct)} 筆分類矛盾；請只看每份紀錄的主要待辦。`,
      };
    }

    case "final-crosscheck": {
      const exp = expected as Record<string, string>;
      const keys = Object.keys(exp);
      const missing = keys.filter((key) => !normalizeAnswer(sub[key]));
      if (missing.length > 0) {
        return {
          isCorrect: false,
          feedback: "四個校驗欄與終章口令都要填寫，才算完成最後一道檔案鎖。",
        };
      }
      const correct = keys.filter((key) => normalizeAnswer(sub[key]) === normalizeAnswer(exp[key])).length;
      if (correct === keys.length) {
        return { isCorrect: true, feedback: "八方記憶匯流成功！最後一枚碎片已為你點亮。" };
      }
      return {
        isCorrect: false,
        feedback: `交叉校驗還有 ${wrongCount(keys.length, correct)} 項未通過；請回查年份、校訓與核心素養，並確認口令的字詞順序。`,
      };
    }

    default:
      return { isCorrect: false, feedback: "未知題型，請重新載入遊戲資料後再試。" };
  }
}

export function gradeFinalSeal(order: unknown): { isCorrect: boolean; feedback: string } {
  const arr = Array.isArray(order) ? (order as string[]) : [];
  const expected = FINAL_PUZZLE_DATA.correctOrder;
  if (arr.length !== expected.length) {
    return { isCorrect: false, feedback: "請將四句火炬精神承諾都排進信紙中。" };
  }
  const exact = expected.every((id, idx) => arr[idx] === id);
  if (exact) {
    return { isCorrect: true, feedback: "火炬之光已全數點亮，時光的回信正式寄出！" };
  }
  const matches = expected.filter((id, idx) => arr[idx] === id).length;
  return {
    isCorrect: false,
    feedback: `已經排對 ${matches} 句了！試著依「自己 → 同學 → 社會 → 世界」的同心圓順序再調整看看！`,
  };
}
