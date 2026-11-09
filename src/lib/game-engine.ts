import { db } from "@/db";
import {
  gameSessions,
  gameSettings,
  missions,
  type GameSessionRow,
  type GameSettingsRow,
  type MissionRow,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { FINAL_PUZZLE_DATA, SEED_MISSIONS } from "./seed-data";

export interface PublicMission {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  locationName: string;
  locationNote: string;
  mapX: number;
  mapY: number;
  storyBackground: string;
  safetyNotice: string;
  puzzleType: MissionRow["puzzleType"];
  promptText: string;
  puzzlePayload: Record<string, unknown>;
  hint1: string;
  hint2: string;
  sourceTitle: string;
  sourceUrl: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  defaultUnlocked: boolean;
  // Note: explanation & clueSummary are only revealed in completion/review or when solved!
}

export interface SolvedMissionDetail {
  id: number;
  explanation: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  clueSummary: string;
  sourceTitle: string;
  sourceUrl: string;
}

let seededPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seededPromise) {
    seededPromise = runSeed().catch((err) => {
      seededPromise = null;
      throw err;
    });
  }
  return seededPromise;
}

async function runSeed(): Promise<void> {
  const existingMissions = await db.select({ id: missions.id }).from(missions);
  if (existingMissions.length === 0) {
    for (const m of SEED_MISSIONS) {
      await db
        .insert(missions)
        .values({
          id: m.id,
          code: m.code,
          title: m.title,
          subtitle: m.subtitle,
          locationName: m.locationName,
          locationNote: m.locationNote,
          mapX: m.mapX,
          mapY: m.mapY,
          storyBackground: m.storyBackground,
          safetyNotice: m.safetyNotice,
          puzzleType: m.puzzleType,
          promptText: m.promptText,
          puzzlePayload: m.puzzlePayload,
          correctAnswer: m.correctAnswer,
          hint1: m.hint1,
          hint2: m.hint2,
          explanation: m.explanation,
          sourceTitle: m.sourceTitle,
          sourceUrl: m.sourceUrl,
          fragmentName: m.fragmentName,
          fragmentPoem: m.fragmentPoem,
          fragmentSymbol: m.fragmentSymbol,
          clueSummary: m.clueSummary,
          defaultUnlocked: m.defaultUnlocked,
        })
        .onConflictDoNothing();
    }
  }

  const existingSettings = await db
    .select({ id: gameSettings.id })
    .from(gameSettings)
    .where(eq(gameSettings.id, 1));

  if (existingSettings.length === 0) {
    await db
      .insert(gameSettings)
      .values({
        id: 1,
        historyMuseumOpen: true,
        forceUnlockAll: false,
      })
      .onConflictDoNothing();
  }
}

export async function resetMissionsToDefault(): Promise<void> {
  await ensureSeeded();
  for (const m of SEED_MISSIONS) {
    await db
      .update(missions)
      .set({
        title: m.title,
        subtitle: m.subtitle,
        locationName: m.locationName,
        locationNote: m.locationNote,
        mapX: m.mapX,
        mapY: m.mapY,
        storyBackground: m.storyBackground,
        safetyNotice: m.safetyNotice,
        promptText: m.promptText,
        puzzlePayload: m.puzzlePayload,
        correctAnswer: m.correctAnswer,
        hint1: m.hint1,
        hint2: m.hint2,
        explanation: m.explanation,
        sourceTitle: m.sourceTitle,
        sourceUrl: m.sourceUrl,
        fragmentName: m.fragmentName,
        fragmentPoem: m.fragmentPoem,
        fragmentSymbol: m.fragmentSymbol,
        clueSummary: m.clueSummary,
        defaultUnlocked: m.defaultUnlocked,
        updatedAt: new Date(),
      })
      .where(eq(missions.id, m.id));
  }
  await db
    .update(gameSettings)
    .set({
      historyMuseumOpen: true,
      forceUnlockAll: false,
      updatedAt: new Date(),
    })
    .where(eq(gameSettings.id, 1));
}

export function sanitizeMissionForPlayer(m: MissionRow): PublicMission {
  return {
    id: m.id,
    code: m.code,
    title: m.title,
    subtitle: m.subtitle,
    locationName: m.locationName,
    locationNote: m.locationNote,
    mapX: m.mapX,
    mapY: m.mapY,
    storyBackground: m.storyBackground,
    safetyNotice: m.safetyNotice,
    puzzleType: m.puzzleType,
    promptText: m.promptText,
    puzzlePayload: m.puzzlePayload,
    hint1: m.hint1,
    hint2: m.hint2,
    sourceTitle: m.sourceTitle,
    sourceUrl: m.sourceUrl,
    fragmentName: m.fragmentName,
    fragmentPoem: m.fragmentPoem,
    fragmentSymbol: m.fragmentSymbol,
    defaultUnlocked: m.defaultUnlocked,
  };
}

export function extractSolvedDetail(m: MissionRow): SolvedMissionDetail {
  return {
    id: m.id,
    explanation: m.explanation,
    fragmentName: m.fragmentName,
    fragmentPoem: m.fragmentPoem,
    fragmentSymbol: m.fragmentSymbol,
    clueSummary: m.clueSummary,
    sourceTitle: m.sourceTitle,
    sourceUrl: m.sourceUrl,
  };
}

export function computeUnlockedMissionIds(
  missionList: MissionRow[],
  completedMissions: number[],
  settings: GameSettingsRow,
  isAdminMode = false
): number[] {
  if (isAdminMode || settings.forceUnlockAll) {
    return missionList.map((m) => m.id);
  }
  const completedSet = new Set(completedMissions);
  const firstSevenDone = [1, 2, 3, 4, 5, 6, 7].every((id) => completedSet.has(id));

  return missionList
    .filter((m) => {
      if (completedSet.has(m.id)) return true;
      if (m.id === 8) {
        // Mission 08 unlocks once Missions 1-7 are completed, unless admin explicitly marked defaultUnlocked = true
        return firstSevenDone || m.defaultUnlocked;
      }
      return m.defaultUnlocked;
    })
    .map((m) => m.id);
}

export function computeTotalScore(
  completedMissions: number[],
  finalSolved: boolean
): number {
  const uniqueCompleted = new Set(completedMissions.filter((id) => id >= 1 && id <= 8));
  const missionPoints = uniqueCompleted.size * 10; // up to 80 pts
  const finalPoints = finalSolved ? 10 : 0; // 10 pts
  const completionBonus = uniqueCompleted.size === 8 && finalSolved ? 10 : 0; // 10 pts
  return Math.min(100, missionPoints + finalPoints + completionBonus);
}

export function gradeMissionAnswer(
  mission: MissionRow,
  submission: unknown
): { isCorrect: boolean; feedback: string } {
  const expected = mission.correctAnswer;

  switch (mission.puzzleType) {
    case "image-recognition": {
      const sub = typeof submission === "string" ? submission.trim() : "";
      const exp = typeof expected === "string" ? expected.trim() : "";
      if (!sub) {
        return { isCorrect: false, feedback: "請先點選一張你認為最符合復興實中的校園影像喔！" };
      }
      if (sub === exp) {
        return { isCorrect: true, feedback: "太棒了！你準確辨識出復興實中的校園風貌。" };
      }
      return {
        isCorrect: false,
        feedback: "差一點就找到了！再仔細對照紅磚校舍、左側鐘樓與戶外階梯這幾個特徵看看。",
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
    case "symbol-decode":
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
        return { isCorrect: false, feedback: "請確認四個歷史里程碑都有排入時間軸中。" };
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
      return { isCorrect: false, feedback: "未知題型，請通知管理員確認題庫設定。" };
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

export async function getGameBootstrapData(sessionId?: string | null) {
  await ensureSeeded();

  const missionList = await db.select().from(missions).orderBy(asc(missions.id));
  const [settingsRow] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
  const settings = settingsRow ?? {
    id: 1,
    historyMuseumOpen: true,
    forceUnlockAll: false,
    updatedAt: new Date(),
  };

  let session: GameSessionRow | null = null;
  if (sessionId) {
    const rows = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, sessionId));
    session = rows[0] ?? null;
  }

  const completedSet = new Set(session?.completedMissions ?? []);
  const solvedDetails: Record<number, SolvedMissionDetail> = {};
  for (const m of missionList) {
    if (completedSet.has(m.id)) {
      solvedDetails[m.id] = extractSolvedDetail(m);
    }
  }

  return {
    missions: missionList.map(sanitizeMissionForPlayer),
    settings,
    session,
    solvedDetails,
    unlockedIds: computeUnlockedMissionIds(
      missionList,
      session?.completedMissions ?? [],
      settings
    ),
  };
}

export function getAdminPasscode(): string {
  return process.env.ADMIN_PASSCODE || "FHSH1946";
}
