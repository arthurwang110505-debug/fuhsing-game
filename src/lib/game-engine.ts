import type { GameSettings, PublicMission, SolvedMissionDetail } from "@/types/game";
import { FINAL_PUZZLE_DATA, SEED_MISSIONS, type SeedMission } from "./seed-data";

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

export function computeTotalScore(completedMissions: number[], finalSolved: boolean): number {
  const count = new Set(completedMissions.filter((id) => id >= 1 && id <= 8)).size;
  return Math.min(100, count * 10 + (finalSolved ? 10 : 0) + (count === 8 && finalSolved ? 10 : 0));
}

export function gradeMissionAnswer(
  mission: SeedMission,
  submission: unknown
): { isCorrect: boolean; feedback: string } {
  const expected = mission.correctAnswer;

  switch (mission.puzzleType) {
    case "evidence-grid": {
      const subObj = (submission && typeof submission === "object" ? submission : {}) as Record<string, string>;
      const expObj = (expected && typeof expected === "object" ? expected : {}) as Record<string, string>;
      const keys = Object.keys(expObj);
      if (keys.some((key) => !subObj[key])) {
        return { isCorrect: false, feedback: "證據鏈尚未完整，請完成每一項交叉驗證後再提交。" };
      }
      const matchCount = keys.filter((key) => subObj[key] === expObj[key]).length;
      if (matchCount === keys.length) {
        return { isCorrect: true, feedback: "交叉驗證通過：所有結論都能由資料支持。" };
      }
      return {
        isCorrect: false,
        feedback: `目前有 ${matchCount} / ${keys.length} 項結論符合來源；請重新檢查年份換算與證據邊界。`,
      };
    }

    case "logic-choice": {
      const subObj = (submission && typeof submission === "object" ? submission : {}) as Record<string, string>;
      const expObj = (expected && typeof expected === "object" ? expected : {}) as Record<string, string>;
      const keys = Object.keys(expObj);
      if (keys.some((k) => !subObj[k])) {
        return { isCorrect: false, feedback: "請先把四個字輪都選好字再驗證喔！" };
      }
      const matchCount = keys.filter((k) => subObj[k] === expObj[k]).length;
      if (matchCount === keys.length) {
        return { isCorrect: true, feedback: "鐘塔傳來清脆的共鳴！四字校訓完全正確。" };
      }
      return {
        isCorrect: false,
        feedback: `目前已經對了 ${matchCount} 個字，再唸一遍線索詞語，試著微調另外幾個字輪！`,
      };
    }

    case "map-matching":
    case "office-matching": {
      const subObj = (submission && typeof submission === "object" ? submission : {}) as Record<string, string>;
      const expObj = (expected && typeof expected === "object" ? expected : {}) as Record<string, string>;
      const keys = Object.keys(expObj);
      if (keys.some((k) => !subObj[k])) {
        return { isCorrect: false, feedback: "還有尚未配對完成的項目，請全部配對後再送出！" };
      }
      const matchCount = keys.filter((k) => subObj[k] === expObj[k]).length;
      if (matchCount === keys.length) {
        return { isCorrect: true, feedback: "觀察入微！所有項目都配對成功了。" };
      }
      return {
        isCorrect: false,
        feedback: `目前有 ${matchCount} / ${keys.length} 組配對正確，別急，點開提示再檢查一下關鍵線索！`,
      };
    }

    case "timeline-sort": {
      const subArr = Array.isArray(submission) ? (submission as string[]) : [];
      const expArr = Array.isArray(expected) ? (expected as string[]) : [];
      if (subArr.length !== expArr.length) {
        return { isCorrect: false, feedback: `請確認 ${expArr.length} 個歷史里程碑都已排入時間軸。` };
      }
      const exactMatch = expArr.every((val, idx) => subArr[idx] === val);
      if (exactMatch) {
        return { isCorrect: true, feedback: "時間齒輪順利轉動！校史脈絡完全正確。" };
      }
      const correctPositions = expArr.filter((val, idx) => subArr[idx] === val).length;
      return {
        isCorrect: false,
        feedback: `已經有 ${correctPositions} 個時期排在正確位置了！試著順著「幼稚園 → 小學 → 中學 → 實驗高中」的成長順序檢查一遍。`,
      };
    }

    case "eco-matching": {
      const subObj = (submission && typeof submission === "object" ? submission : {}) as {
        pairs?: Record<string, string>;
        safety?: string;
      };
      const expObj = (expected && typeof expected === "object" ? expected : {}) as {
        pairs: Record<string, string>;
        safety: string;
      };
      const pairs = subObj.pairs || {};
      const expPairs = expObj.pairs || {};
      const keys = Object.keys(expPairs);
      if (keys.some((k) => !pairs[k]) || !subObj.safety) {
        return { isCorrect: false, feedback: "請先完成三組生態概念配對，並勾選下方的安全守則再送出喔！" };
      }
      const pairMatches = keys.filter((k) => pairs[k] === expPairs[k]).length;
      const safetyOk = subObj.safety === expObj.safety;
      if (pairMatches === keys.length && safetyOk) {
        return { isCorrect: true, feedback: "你既懂生態設計又守護校園安全，太棒了！" };
      }
      if (pairMatches === keys.length && !safetyOk) {
        return {
          isCorrect: false,
          feedback: "三組生態配對都答對了！不過下方的校園安全守則再仔細想一下：探索植物時可以採摘或攀爬嗎？",
        };
      }
      return {
        isCorrect: false,
        feedback: `生態配對目前對了 ${pairMatches} 組，再看一下各項目說明的關鍵字吧！`,
      };
    }

    case "final-synthesis": {
      const subObj = (submission && typeof submission === "object" ? submission : {}) as Record<string, string>;
      const expObj = (expected && typeof expected === "object" ? expected : {}) as Record<string, string>;
      const keys = Object.keys(expObj);
      if (keys.some((k) => !subObj[k])) {
        return { isCorrect: false, feedback: "請先把五個核心空格都選擇完成再啟動檔案驗證！" };
      }
      const matchCount = keys.filter((k) => subObj[k] === expObj[k]).length;
      if (matchCount === keys.length) {
        return { isCorrect: true, feedback: "八方記憶匯流成功！最後一枚碎片已為你點亮。" };
      }
      return {
        isCorrect: false,
        feedback: `已經答對 ${matchCount} / ${keys.length} 個線索，點開「已收集線索卡」重溫前面幾關的發現就能全部解開！`,
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
