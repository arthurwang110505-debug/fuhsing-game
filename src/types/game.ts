export type PuzzleType =
  | "image-recognition"
  | "logic-choice"
  | "map-matching"
  | "timeline-sort"
  | "symbol-decode"
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
  mode: "solo";
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
  | "dashboard"
  | "map"
  | "mission-detail"
  | "puzzle"
  | "final-puzzle"
  | "ending";
