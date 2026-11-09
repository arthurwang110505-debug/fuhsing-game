import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, gameSettings } from "@/db/schema";
import { isRequestAdmin } from "@/lib/admin-auth";
import { computeTotalScore, ensureSeeded, gradeFinalSeal } from "@/lib/game-engine";
import { FINAL_PUZZLE_DATA } from "@/lib/seed-data";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = (await req.json()) as {
      sessionId?: string;
      order?: string[];
      elapsedSeconds?: number;
    };

    if (!body.sessionId || !UUID_REGEX.test(body.sessionId)) {
      return NextResponse.json(
        { error: "找不到有效的探索檔案。" },
        { status: 400 }
      );
    }

    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, body.sessionId));

    if (!session) {
      return NextResponse.json({ error: "找不到探索檔案。" }, { status: 404 });
    }

    const [settings] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
    const isAdmin = await isRequestAdmin();
    const allowBypass = Boolean(isAdmin && (session.isAdminTestSession || settings?.forceUnlockAll));

    const completedSet = new Set(session.completedMissions);
    const hasAllEight = [1, 2, 3, 4, 5, 6, 7, 8].every((id) => completedSet.has(id));

    if (!hasAllEight && !allowBypass) {
      return NextResponse.json(
        {
          error: "必須先收集全部八枚記憶碎片（完成 Mission 01～08），才能啟動最終謎題！",
        },
        { status: 403 }
      );
    }

    const result = gradeFinalSeal(body.order);
    const nextElapsed =
      typeof body.elapsedSeconds === "number" && body.elapsedSeconds >= session.elapsedSeconds
        ? Math.floor(body.elapsedSeconds)
        : session.elapsedSeconds;

    if (!result.isCorrect) {
      const [updated] = await db
        .update(gameSessions)
        .set({
          elapsedSeconds: nextElapsed,
          updatedAt: new Date(),
        })
        .where(eq(gameSessions.id, session.id))
        .returning();

      return NextResponse.json({
        isCorrect: false,
        feedback: result.feedback,
        session: updated,
      });
    }

    const nextScore = computeTotalScore(session.completedMissions, true);
    const [updated] = await db
      .update(gameSessions)
      .set({
        finalSolved: true,
        score: nextScore,
        completedAt: session.completedAt ?? new Date(),
        elapsedSeconds: nextElapsed,
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, session.id))
      .returning();

    return NextResponse.json({
      isCorrect: true,
      feedback: result.feedback,
      session: updated,
      endingStory: FINAL_PUZZLE_DATA.endingStory,
    });
  } catch (err) {
    console.error("Verify final puzzle error:", err);
    return NextResponse.json(
      { error: "最終驗證發生錯誤，請稍後再試。" },
      { status: 500 }
    );
  }
}
