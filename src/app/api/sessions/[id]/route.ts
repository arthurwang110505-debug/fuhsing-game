import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions } from "@/db/schema";
import { getGameBootstrapData } from "@/lib/game-engine";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "無效的探索檔案識別碼。" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, id));

    if (!existing) {
      return NextResponse.json({ error: "找不到探索檔案。" }, { status: 404 });
    }

    const body = (await req.json()) as {
      elapsedSeconds?: number;
      hintOpened?: { missionId: number; stage: 1 | 2 };
      action?: "reset";
    };

    if (body.action === "reset") {
      const [updated] = await db
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
        .where(eq(gameSessions.id, id))
        .returning();

      const bootstrap = await getGameBootstrapData(updated.id);
      return NextResponse.json(bootstrap);
    }

    const nextHints = { ...(existing.hintsUsed || {}) };
    if (body.hintOpened && body.hintOpened.missionId >= 1 && body.hintOpened.missionId <= 8) {
      const key = String(body.hintOpened.missionId);
      const currentStage = nextHints[key] || 0;
      nextHints[key] = Math.max(currentStage, body.hintOpened.stage);
    }

    const nextElapsed =
      typeof body.elapsedSeconds === "number" && body.elapsedSeconds >= existing.elapsedSeconds
        ? Math.min(86400, Math.floor(body.elapsedSeconds))
        : existing.elapsedSeconds;

    const [updated] = await db
      .update(gameSessions)
      .set({
        elapsedSeconds: nextElapsed,
        hintsUsed: nextHints,
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, id))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("Update session error:", err);
    return NextResponse.json(
      { error: "更新遊戲進度失敗。" },
      { status: 500 }
    );
  }
}
