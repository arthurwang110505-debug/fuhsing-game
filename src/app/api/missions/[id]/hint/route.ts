import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, gameSettings, missions } from "@/db/schema";
import { isRequestAdmin } from "@/lib/admin-auth";
import { computeUnlockedMissionIds, ensureSeeded } from "@/lib/game-engine";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const missionId = Number(id);
    const sessionId = req.nextUrl.searchParams.get("sessionId") || "";
    const stage = Number(req.nextUrl.searchParams.get("stage"));
    if (!Number.isInteger(missionId) || missionId < 1 || missionId > 8 || !UUID_REGEX.test(sessionId) || (stage !== 1 && stage !== 2)) {
      return NextResponse.json({ error: "無效的提示請求。" }, { status: 400 });
    }

    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId));
    if (!session) return NextResponse.json({ error: "找不到探索檔案。" }, { status: 404 });

    const [mission] = await db.select().from(missions).where(eq(missions.id, missionId));
    if (!mission) return NextResponse.json({ error: "找不到此關卡。" }, { status: 404 });

    const missionList = await db.select().from(missions).orderBy(asc(missions.id));
    const [settings] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
    const unlocked = computeUnlockedMissionIds(
      missionList,
      session.completedMissions,
      settings ?? { id: 1, historyMuseumOpen: true, forceUnlockAll: false, updatedAt: new Date() },
      (await isRequestAdmin()) && session.isAdminTestSession
    );
    if (!unlocked.includes(missionId)) {
      return NextResponse.json({ error: "請先解鎖此關卡，再查看提示。" }, { status: 403 });
    }

    const hintsUsed = { ...(session.hintsUsed || {}) };
    const key = String(missionId);
    hintsUsed[key] = Math.max(hintsUsed[key] || 0, stage);
    await db.update(gameSessions).set({ hintsUsed, updatedAt: new Date() }).where(eq(gameSessions.id, sessionId));

    return NextResponse.json({ hint: stage === 1 ? mission.hint1 : mission.hint2, hintsUsed });
  } catch (error) {
    console.error("Fetch mission hint error:", error);
    return NextResponse.json({ error: "目前無法載入提示，請稍後再試。" }, { status: 500 });
  }
}
