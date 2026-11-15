/**
 * 紙本線索卡 ↔ 系統作答表
 *
 * 設計原則（本版改動的核心）：
 * 1. 每一個關卡的「線索」只印在紙本手冊的線索卡上；網站不再重現題目資料。
 * 2. 網站只負責輸入答案：欄位代號（空間卡 A、任務卡 ①、事件卡 A…）與紙本完全一致。
 * 3. 欄位定義同時驅動三處，避免紙本與網站說法不一致：
 *    - 網站作答介面（src/components/AnswerSheet.tsx）
 *    - 學生手冊的作答欄（scripts/generate-booklets.ts）
 *    - 教師解答本的欄位對照
 */

export type AnswerFieldKind = "select" | "text" | "textarea";

export interface AnswerOption {
  /** 送去評分的值（對應 seed-data 的 id） */
  value: string;
  /** 紙本與畫面顯示的代號，例如「A」「①」「教務處」 */
  label: string;
}

export interface AnswerField {
  id: string;
  /** 作答欄名稱，紙本與網站共用 */
  label: string;
  kind: AnswerFieldKind;
  options?: AnswerOption[];
  placeholder?: string;
  /** 只印在紙本上的補充說明（例如「不是遷址年份」） */
  paperNote?: string;
}

export interface AnswerSheet {
  missionId: number;
  code: string;
  /** 線索卡標題（紙本頁首／網站提示） */
  cardTitle: string;
  /** 這張線索卡提供哪些資料（網站只列項目，不列內容） */
  supplies: string[];
  /** 這關要帶回系統的答案（一句話） */
  answerFocus: string;
  fields: AnswerField[];
  /** payload id → 紙本代號（學生手冊印資料時使用） */
  entityCodes: Record<string, string>;
  /** 把作答欄的值組成評分用的送審物件 */
  build: (values: Record<string, string>) => Record<string, unknown>;
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];

function circled(index: number): string {
  return CIRCLED[index] ?? String(index + 1);
}

function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

const EVIDENCE_COLUMNS: AnswerOption[] = [
  { value: "confirmed", label: "可證實" },
  { value: "contradicted", label: "與來源矛盾" },
  { value: "unrecorded", label: "資料未載" },
];

const EVIDENCE_CARD_IDS = ["k1", "k2", "k3", "k4", "k5", "k6", "k7"];

const ACROSTIC_SLOTS: { id: string; label: string }[] = [
  { id: "tone", label: "情緒槽位" },
  { id: "method", label: "方法槽位" },
  { id: "ambition", label: "志向槽位" },
  { id: "horizon", label: "時間視野槽位" },
];

const ACROSTIC_LINE_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const GRID_LEFT_IDS = ["b1", "b2", "b3", "b4", "b5", "b6"];
const GRID_RIGHT_IDS = ["r1", "r2", "r3", "r4", "r5", "r6"];

const TIMELINE_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const EMBLEM_COMPONENT_IDS = ["tri", "plum", "petal", "torch", "dove", "circle"];
const EMBLEM_MEANING_IDS = ["m1", "m2", "m3", "m4", "m5", "m6"];

/** 概念卡印在紙上的順序＝payload nodes 的順序（刻意打亂，代號依序 A–D） */
const CYCLE_NODE_IDS = ["n3", "n1", "n4", "n2"];

const OFFICE_RECORD_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const OFFICE_OPTIONS: AnswerOption[] = [
  { value: "academic", label: "教務處" },
  { value: "student", label: "學務處" },
  { value: "general", label: "總務處" },
  { value: "counseling", label: "輔導室" },
];

export const ANSWER_SHEETS: AnswerSheet[] = [
  {
    missionId: 1,
    code: "M01",
    cardTitle: "線索卡 M01・校史證詞與出處",
    supplies: [
      "七張證詞卡全文（卡號 ①–⑦）",
      "每張卡背面的校驗字",
      "三個證據欄的判準說明",
      "三則可逐字核對的官方來源節錄",
    ],
    answerFocus: "把七張證詞卡各放進一個證據欄，再輸入五個字的檔案鎖。",
    fields: [
      ...EVIDENCE_CARD_IDS.map((id, index) => ({
        id: `place_${id}`,
        label: `證詞卡 ${circled(index)}`,
        kind: "select" as const,
        options: EVIDENCE_COLUMNS,
        paperNote: "填這一張卡該放進的證據欄。",
      })),
      {
        id: "lock",
        label: "檔案鎖校驗字（五個字）",
        kind: "text" as const,
        placeholder: "依卡號順序讀取可證實卡片的卡背字",
      },
    ],
    entityCodes: Object.fromEntries(EVIDENCE_CARD_IDS.map((id, index) => [id, circled(index)])),
    build: (values) => ({
      placement: Object.fromEntries(EVIDENCE_CARD_IDS.map((id) => [id, values[`place_${id}`] ?? ""])),
      lock: values.lock ?? "",
    }),
  },
  {
    missionId: 2,
    code: "M02",
    cardTitle: "線索卡 M02・鐘樓殘詩與語意條件",
    supplies: [
      "四個語意槽位的條件說明",
      "八行殘詩（代號 A–H，含四行偷換概念的干擾句）",
      "四字校訓的讀取方式（每行第一個字）",
    ],
    answerFocus: "為四個槽位各選一行詩，系統會依首字檢查四字密令。",
    fields: ACROSTIC_SLOTS.map((slot) => ({
      id: slot.id,
      label: slot.label,
      kind: "select" as const,
      options: ACROSTIC_LINE_IDS.map((id) => ({ value: id, label: id })),
      paperNote: "填入你選定的詩行代號。",
    })),
    entityCodes: {
      ...Object.fromEntries(ACROSTIC_SLOTS.map((slot, index) => [slot.id, circled(index)])),
      ...Object.fromEntries(ACROSTIC_LINE_IDS.map((id) => [id, id])),
    },
    build: (values) => ({
      tone: values.tone ?? "",
      method: values.method ?? "",
      ambition: values.ambition ?? "",
      horizon: values.horizon ?? "",
    }),
  },
  {
    missionId: 3,
    code: "M03",
    cardTitle: "線索卡 M03・六座空間與任務卡",
    supplies: [
      "空間卡 A–F（成賢樓、勤學樓、慎思樓、國學館、校史館、中學圖書館）",
      "任務卡 ①–⑥（六張待配對的任務說明）",
      "五條邏輯線索",
      "6×6 排除矩陣（可自行畫在空白處）",
    ],
    answerFocus: "為空間卡 A–F 各選一張任務卡；每張任務卡只會被用到一次。",
    fields: GRID_LEFT_IDS.map((id, index) => ({
      id,
      label: `空間卡 ${letter(index)}`,
      kind: "select" as const,
      options: GRID_RIGHT_IDS.map((rid, rindex) => ({ value: rid, label: circled(rindex) })),
      paperNote: "填入任務卡編號。",
    })),
    entityCodes: {
      ...Object.fromEntries(GRID_LEFT_IDS.map((id, index) => [id, letter(index)])),
      ...Object.fromEntries(GRID_RIGHT_IDS.map((id, index) => [id, circled(index)])),
    },
    build: (values) => Object.fromEntries(GRID_LEFT_IDS.map((id) => [id, values[id] ?? ""])),
  },
  {
    missionId: 4,
    code: "M04",
    cardTitle: "線索卡 M04・校史事件卡與年代表",
    supplies: [
      "事件卡 A–H（事件名稱與被刮除的年份提示）",
      "民國年換算規則：民國年 + 1911 = 西元年",
      "校史檔案摘錄（校史館休館時同樣可用）",
    ],
    answerFocus: "八張事件卡都要填西元年，並選出它的時間順序（1 最早）。",
    fields: TIMELINE_IDS.flatMap((id) => [
      {
        id: `year_${id}`,
        label: `事件卡 ${id}・西元年`,
        kind: "text" as const,
        placeholder: "例：1946",
      },
      {
        id: `rank_${id}`,
        label: `事件卡 ${id}・時間順序`,
        kind: "select" as const,
        options: TIMELINE_IDS.map((_, index) => ({ value: String(index + 1), label: String(index + 1) })),
        paperNote: "1＝最早、8＝最晚。",
      },
    ]),
    entityCodes: Object.fromEntries(TIMELINE_IDS.map((id) => [id, id])),
    build: (values) => {
      const order = [...TIMELINE_IDS].sort(
        (a, b) => (Number(values[`rank_${a}`]) || 99) - (Number(values[`rank_${b}`]) || 99)
      );
      return {
        order,
        years: Object.fromEntries(TIMELINE_IDS.map((id) => [id, values[`year_${id}`] ?? ""])),
      };
    },
  },
  {
    missionId: 5,
    code: "M05",
    cardTitle: "線索卡 M05・校徽構件與意涵卡",
    supplies: [
      "構件卡 A–F（三角形、梅花、五片花瓣、火炬、鴿形火焰、外圍圓形）",
      "意涵卡 ①–⑥（含右下角的索引字）",
      "索引字讀取順序：外形 → 植物 → 數量 → 器物 → 造型 → 邊界",
    ],
    answerFocus: "完成六組配對，再依讀取順序輸入第二層校驗詞。",
    fields: [
      ...EMBLEM_COMPONENT_IDS.map((id, index) => ({
        id,
        label: `構件卡 ${letter(index)}`,
        kind: "select" as const,
        options: EMBLEM_MEANING_IDS.map((mid, mindex) => ({ value: mid, label: circled(mindex) })),
        paperNote: "填入意涵卡編號。",
      })),
      {
        id: "code",
        label: "第二層校驗詞（六個字）",
        kind: "text" as const,
        placeholder: "依索引字順序讀出",
      },
    ],
    entityCodes: {
      ...Object.fromEntries(EMBLEM_COMPONENT_IDS.map((id, index) => [id, letter(index)])),
      ...Object.fromEntries(EMBLEM_MEANING_IDS.map((id, index) => [id, circled(index)])),
    },
    build: (values) => ({
      pairs: Object.fromEntries(EMBLEM_COMPONENT_IDS.map((id) => [id, values[id] ?? ""])),
      code: values.code ?? "",
    }),
  },
  {
    missionId: 6,
    code: "M06",
    cardTitle: "線索卡 M06・小花園循環概念卡",
    supplies: [
      "概念卡 A–D（順序已打亂）",
      "魚菜共生的概念模型說明",
      "三個追問與事實邊界提醒",
    ],
    answerFocus: "把概念卡排成循環，再用一句話回答三個追問。",
    fields: [
      ...[1, 2, 3, 4].map((step) => ({
        id: `step_${step}`,
        label: `循環第 ${step} 站`,
        kind: "select" as const,
        options: CYCLE_NODE_IDS.map((_, index) => ({ value: CYCLE_NODE_IDS[index], label: letter(index) })),
        paperNote: "填入概念卡代號；第 4 站會接回第 1 站。",
      })),
      {
        id: "q1",
        label: "追問一・移除「植物利用水中養分」後哪一項關係中斷？",
        kind: "textarea" as const,
        placeholder: "用一句話說明",
      },
      {
        id: "q2",
        label: "追問二・「綠的延伸」是設計理念還是設備名稱？",
        kind: "textarea" as const,
        placeholder: "寫出你的判斷",
      },
      {
        id: "q3",
        label: "追問三・公開資料能否證明每處植栽都接入魚菜共生？",
        kind: "textarea" as const,
        placeholder: "寫出你的判斷",
      },
    ],
    entityCodes: Object.fromEntries(CYCLE_NODE_IDS.map((id, index) => [id, letter(index)])),
    build: (values) => {
      const order = [1, 2, 3, 4].map((step) => values[`step_${step}`] ?? "").filter(Boolean);
      return {
        order,
        answers: { q1: values.q1 ?? "", q2: values.q2 ?? "", q3: values.q3 ?? "" },
      };
    },
  },
  {
    missionId: 7,
    code: "M07",
    cardTitle: "線索卡 M07・八份求助紀錄",
    supplies: [
      "紀錄 A–H（每份都有主要待辦與「順便想問」）",
      "四個處室的職掌說明與配額（每匣兩件）",
      "分派原則：只看主要待辦",
    ],
    answerFocus: "為紀錄 A–H 各選一個處室，每處室恰好兩件。",
    fields: OFFICE_RECORD_IDS.map((id) => ({
      id,
      label: `紀錄 ${id}`,
      kind: "select" as const,
      options: OFFICE_OPTIONS,
      paperNote: "填該紀錄的收件處室。",
    })),
    entityCodes: Object.fromEntries(OFFICE_RECORD_IDS.map((id) => [id, id])),
    build: (values) => Object.fromEntries(OFFICE_RECORD_IDS.map((id) => [id, values[id] ?? ""])),
  },
  {
    missionId: 8,
    code: "M08",
    cardTitle: "線索卡 M08・交叉校驗與終章口令",
    supplies: [
      "四個校驗欄（各自要回不同的關卡查核）",
      "易混淆提醒：創辦／遷址、校訓／核心素養",
      "終章口令的取法說明",
    ],
    answerFocus: "四個校驗欄都用文字輸入，最後輸入終章口令。",
    fields: [
      {
        id: "founded",
        label: "校驗欄 ①・創辦年份（西元）",
        kind: "text" as const,
        placeholder: "四位數",
        paperNote: "不是遷址年份。",
      },
      {
        id: "moved",
        label: "校驗欄 ②・遷至敦化南路現址年份（西元）",
        kind: "text" as const,
        placeholder: "四位數",
        paperNote: "不是增設中學的年份。",
      },
      {
        id: "motto",
        label: "校驗欄 ③・四字校訓",
        kind: "text" as const,
        placeholder: "四個字",
        paperNote: "不是核心素養。",
      },
      {
        id: "literacy",
        label: "校驗欄 ④・四項核心素養的最後一句",
        kind: "text" as const,
        placeholder: "四個字",
        paperNote: "不是校訓。",
      },
      {
        id: "passphrase",
        label: "終章口令（六個字）",
        kind: "text" as const,
        placeholder: "四句承諾的第一個動詞，依序輸入",
      },
    ],
    entityCodes: {},
    build: (values) => ({
      founded: values.founded ?? "",
      moved: values.moved ?? "",
      motto: values.motto ?? "",
      literacy: values.literacy ?? "",
      passphrase: values.passphrase ?? "",
    }),
  },
];

export function getAnswerSheet(missionId: number): AnswerSheet | undefined {
  return ANSWER_SHEETS.find((sheet) => sheet.missionId === missionId);
}

/** 依作答欄型別檢查是否填完；沒填完回傳要提醒的欄位名稱 */
export function findMissingFields(sheet: AnswerSheet, values: Record<string, string>): string[] {
  return sheet.fields
    .filter((field) => {
      const value = (values[field.id] ?? "").trim();
      return value.length === 0;
    })
    .map((field) => field.label);
}
