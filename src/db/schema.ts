import {
  pgTable,
  integer,
  text,
  boolean,
  jsonb,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export type PuzzleType =
  | "image-recognition"
  | "logic-choice"
  | "map-matching"
  | "timeline-sort"
  | "symbol-decode"
  | "eco-matching"
  | "office-matching"
  | "final-synthesis";

export const missions = pgTable("missions", {
  id: integer("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  locationName: text("location_name").notNull(),
  locationNote: text("location_note").notNull(),
  mapX: integer("map_x").notNull(),
  mapY: integer("map_y").notNull(),
  storyBackground: text("story_background").notNull(),
  safetyNotice: text("safety_notice").notNull(),
  puzzleType: text("puzzle_type").$type<PuzzleType>().notNull(),
  promptText: text("prompt_text").notNull(),
  puzzlePayload: jsonb("puzzle_payload").$type<Record<string, unknown>>().notNull(),
  correctAnswer: jsonb("correct_answer").$type<unknown>().notNull(),
  hint1: text("hint_1").notNull(),
  hint2: text("hint_2").notNull(),
  explanation: text("explanation").notNull(),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  fragmentName: text("fragment_name").notNull(),
  fragmentPoem: text("fragment_poem").notNull(),
  fragmentSymbol: text("fragment_symbol").notNull(),
  clueSummary: text("clue_summary").notNull(),
  defaultUnlocked: boolean("default_unlocked").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gameSettings = pgTable("game_settings", {
  id: integer("id").primaryKey(),
  historyMuseumOpen: boolean("history_museum_open").notNull().default(true),
  forceUnlockAll: boolean("force_unlock_all").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  mode: text("mode").$type<"solo" | "team">().notNull(),
  playerName: text("player_name").notNull(),
  teamName: text("team_name"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  elapsedSeconds: integer("elapsed_seconds").notNull().default(0),
  score: integer("score").notNull().default(0),
  completedMissions: jsonb("completed_missions").$type<number[]>().notNull().default([]),
  fragmentsCollected: jsonb("fragments_collected").$type<string[]>().notNull().default([]),
  hintsUsed: jsonb("hints_used").$type<Record<string, number>>().notNull().default({}),
  attemptsLog: jsonb("attempts_log").$type<Record<string, number>>().notNull().default({}),
  finalSolved: boolean("final_solved").notNull().default(false),
  isAdminTestSession: boolean("is_admin_test_session").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type MissionRow = typeof missions.$inferSelect;
export type GameSettingsRow = typeof gameSettings.$inferSelect;
export type GameSessionRow = typeof gameSessions.$inferSelect;
