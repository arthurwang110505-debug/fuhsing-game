export type PuzzleType =
  // 困難模式八關題型
  | "evidence-classify" // M01 三分類證據審查
  | "acrostic-select" // M02 語意選詩・藏頭密令
  | "logic-grid" // M03 6×6 邏輯矩陣
  | "timeline-years" // M04 時間排序＋年份換算
  | "emblem-layers" // M05 雙層配對＋索引字密文
  | "cycle-flow" // M06 因果循環排序＋概念追問
  | "office-quota" // M07 受限配額分派
  | "final-crosscheck"; // M08 跨關交叉校驗＋終章口令

export type HintStage = 1 | 2 | 3;

/** 每關最多三階提示，每階扣 1 分 */
export const MAX_HINT_STAGE = 3;

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
  puzzleType: PuzzleType;
  promptText: string;
  puzzlePayload: Record<string, unknown>;
  hint1: string;
  hint2: string;
  hint3: string;
  /** 對應的列印素材（站內 PDF／PNG），不再連向外站 */
  materialTitle: string;
  materialUrl: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  defaultUnlocked: boolean;
}

export interface SolvedMissionDetail {
  id: number;
  explanation: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  clueSummary: string;
  materialTitle: string;
  materialUrl: string;
}

export interface GameSettings {
  historyMuseumOpen: boolean;
}

export interface GameSession {
  id: string;
  mode: "solo" | "team";
  teamId?: string | null;
  playerName: string;
  startedAt: string;
  completedAt: string | null;
  elapsedSeconds: number;
  score: number;
  completedMissions: number[];
  fragmentsCollected: string[];
  hintsUsed: Record<string, number>;
  attemptsLog: Record<string, number>;
  finalSolved: boolean;
}

export interface PrintableResource {
  id: string;
  title: string;
  category: string;
  href: string;
  format: string;
  note: string;
}

export interface FinalPuzzleMeta {
  title: string;
  subtitle: string;
  storyPrompt: string;
  openingLine: string;
  closingLine: string;
  shuffledLines: { id: string; text: string }[];
  hint: string;
  materialUrl: string;
}

export type GameScreen =
  | "opening"
  | "intro"
  | "setup"
  | "auth"
  | "team-lobby"
  | "dashboard"
  | "map"
  | "mission-detail"
  | "puzzle"
  | "final-puzzle"
  | "ending";

export type PlayMode = "local" | "cloud" | "team";

export interface TeamInfo {
  id: string;
  name: string;
  joinCode: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamMemberInfo {
  userId: string;
  displayName: string;
  role: "leader" | "member";
  joinedAt: string;
}

export interface TeamMissionLogEntry {
  missionId: number;
  solvedBy: string;
  solvedByName: string;
  solvedAt: string;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  completedCount: number;
  elapsedSeconds: number;
  finalSolved: boolean;
  memberCount: number;
}
