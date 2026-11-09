import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, gameSettings, missions } from "@/db/schema";
import { isRequestAdmin } from "@/lib/admin-auth";
import { ensureSeeded, resetMissionsToDefault } from "@/lib/game-engine";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const isAdmin = await isRequestAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "未經授權：需要管理員驗證才能查看答案與設定。" },
        { status: 401 }
      );
    }

    await ensureSeeded();
    const missionList = await db.select().from(missions).orderBy(asc(missions.id));
    const [settings] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
    const recentSessions = await db
      .select()
      .from(gameSessions)
      .orderBy(desc(gameSessions.updatedAt))
      .limit(20);

    return NextResponse.json({
      missions: missionList,
      settings: settings ?? {
        id: 1,
        historyMuseumOpen: true,
        forceUnlockAll: false,
      },
      sessions: recentSessions,
    });
  } catch (err) {
    console.error("Admin GET error:", err);
    return NextResponse.json({ error: "載入管理員資料失敗" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await isRequestAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "未經授權：需要管理員驗證才能編輯遊戲資料。" },
        { status: 401 }
      );
    }

    await ensureSeeded();
    const body = (await req.json()) as {
      type: "update-mission" | "update-settings" | "reset-defaults" | "reset-session";
      missionId?: number;
      patch?: {
        title?: string;
        subtitle?: string;
        locationName?: string;
        locationNote?: string;
        mapX?: number;
        mapY?: number;
        promptText?: string;
        hint1?: string;
        hint2?: string;
        defaultUnlocked?: boolean;
        correctAnswer?: unknown;
      };
      settings?: {
        historyMuseumOpen?: boolean;
        forceUnlockAll?: boolean;
      };
      sessionId?: string;
    };

    if (body.type === "update-mission" && typeof body.missionId === "number" && body.patch) {
      const updateFields: Record<string, unknown> = { updatedAt: new Date() };
      const p = body.patch;

      if (typeof p.title === "string") updateFields.title = p.title.trim();
      if (typeof p.subtitle === "string") updateFields.subtitle = p.subtitle.trim();
      if (typeof p.locationName === "string") updateFields.locationName = p.locationName.trim();
      if (typeof p.locationNote === "string") updateFields.locationNote = p.locationNote.trim();
      if (typeof p.promptText === "string") updateFields.promptText = p.promptText.trim();
      if (typeof p.hint1 === "string") updateFields.hint1 = p.hint1.trim();
      if (typeof p.hint2 === "string") updateFields.hint2 = p.hint2.trim();
      if (typeof p.defaultUnlocked === "boolean") updateFields.defaultUnlocked = p.defaultUnlocked;
      if (typeof p.mapX === "number") {
        updateFields.mapX = Math.max(40, Math.min(960, Math.round(p.mapX)));
      }
      if (typeof p.mapY === "number") {
        updateFields.mapY = Math.max(40, Math.min(610, Math.round(p.mapY)));
      }
      if (p.correctAnswer !== undefined) {
        updateFields.correctAnswer = p.correctAnswer;
      }

      await db
        .update(missions)
        .set(updateFields)
        .where(eq(missions.id, body.missionId));
    } else if (body.type === "update-settings" && body.settings) {
      const updateSettingsFields: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof body.settings.historyMuseumOpen === "boolean") {
        updateSettingsFields.historyMuseumOpen = body.settings.historyMuseumOpen;
      }
      if (typeof body.settings.forceUnlockAll === "boolean") {
        updateSettingsFields.forceUnlockAll = body.settings.forceUnlockAll;
      }

      await db
        .update(gameSettings)
        .set(updateSettingsFields)
        .where(eq(gameSettings.id, 1));
    } else if (body.type === "reset-defaults") {
      await resetMissionsToDefault();
    } else if (body.type === "reset-session" && body.sessionId && UUID_REGEX.test(body.sessionId)) {
      await db
        .update(gameSessions)
        .set({
          completedMissions: [],
          fragmentsCollected: [],
          hintsUsed: {},
          attemptsLog: {},
          finalSolved: false,
          score: 0,
          elapsedSeconds: 0,
          completedAt: null,
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(gameSessions.id, body.sessionId));
    } else {
      return NextResponse.json({ error: "無效的操作請求" }, { status: 400 });
    }

    const missionList = await db.select().from(missions).orderBy(asc(missions.id));
    const [settings] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
    const recentSessions = await db
      .select()
      .from(gameSessions)
      .orderBy(desc(gameSessions.updatedAt))
      .limit(20);

    return NextResponse.json({
      missions: missionList,
      settings,
      sessions: recentSessions,
    });
  } catch (err) {
    console.error("Admin PATCH error:", err);
    return NextResponse.json({ error: "更新管理員設定失敗" }, { status: 500 });
  }
}
