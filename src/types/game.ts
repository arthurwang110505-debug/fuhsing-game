export type PuzzleType =
  | "evidence-grid"
  | "logic-choice"
  | "map-matching"
  | "timeline-sort"
  | "eco-matching"
  | "office-matching"
  | "final-synthesis";

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
  sourceTitle: string;
  sourceUrl: string;
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
  sourceTitle: string;
  sourceUrl: string;
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

export interface OfficialSourceItem {
  title: string;
  category: string;
  url: string;
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
  sourceUrl: string;
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
