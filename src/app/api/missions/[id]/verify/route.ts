import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions, gameSettings, missions } from "@/db/schema";
import { isRequestAdmin } from "@/lib/admin-auth";
import {
  computeTotalScore,
  computeUnlockedMissionIds,
  ensureSeeded,
  extractSolvedDetail,
  gradeMissionAnswer,
} from "@/lib/game-engine";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const missionId = Number(id);
    if (!Number.isInteger(missionId) || missionId < 1 || missionId > 8) {
      return NextResponse.json({ error: "無效的任務編號。" }, { status: 400 });
    }

    const body = (await req.json()) as {
      sessionId?: string;
      answer?: unknown;
      elapsedSeconds?: number;
    };

    if (!body.sessionId || !UUID_REGEX.test(body.sessionId)) {
      return NextResponse.json(
        { error: "請先建立探索員檔案再進行解謎！" },
        { status: 400 }
      );
    }

    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, body.sessionId));

    if (!session) {
      return NextResponse.json(
        { error: "找不到對應的探索檔案，請重新開始或載入代碼。" },
        { status: 404 }
      );
    }

    const missionList = await db.select().from(missions).orderBy(asc(missions.id));
    const targetMission = missionList.find((m) => m.id === missionId);
    if (!targetMission) {
      return NextResponse.json({ error: "找不到此關卡資料。" }, { status: 404 });
    }

    const [settingsRow] = await db.select().from(gameSettings).where(eq(gameSettings.id, 1));
    const settings = settingsRow ?? {
      id: 1,
      historyMuseumOpen: true,
      forceUnlockAll: false,
      updatedAt: new Date(),
    };

    const isAdmin = await isRequestAdmin();
    const unlockedIds = computeUnlockedMissionIds(
      missionList,
      session.completedMissions,
      settings,
      isAdmin && session.isAdminTestSession
    );

    if (!unlockedIds.includes(missionId)) {
      return NextResponse.json(
        {
          error:
            "此核心關卡尚未解鎖，請先完成前七個校園探索任務以集結記憶線索！",
        },
        { status: 403 }
      );
    }

    const result = gradeMissionAnswer(targetMission, body.answer);

    const nextAttempts = { ...(session.attemptsLog || {}) };
    const mKey = String(missionId);
    nextAttempts[mKey] = (nextAttempts[mKey] || 0) + 1;

    const nextElapsed =
      typeof body.elapsedSeconds === "number" && body.elapsedSeconds >= session.elapsedSeconds
        ? Math.floor(body.elapsedSeconds)
        : session.elapsedSeconds;

    if (!result.isCorrect) {
      const [updatedSession] = await db
        .update(gameSessions)
        .set({
          attemptsLog: nextAttempts,
          elapsedSeconds: nextElapsed,
          updatedAt: new Date(),
        })
        .where(eq(gameSessions.id, session.id))
        .returning();

      return NextResponse.json({
        isCorrect: false,
        feedback: result.feedback,
        session: updatedSession,
      });
    }

    // Correct answer! Add to completedMissions & fragmentsCollected
    const nextCompletedSet = new Set(session.completedMissions);
    nextCompletedSet.add(missionId);
    const nextCompleted = Array.from(nextCompletedSet).sort((a, b) => a - b);

    const nextFragmentsSet = new Set(session.fragmentsCollected);
    nextFragmentsSet.add(targetMission.fragmentName);
    const nextFragments = Array.from(nextFragmentsSet);

    const nextScore = computeTotalScore(nextCompleted, session.finalSolved);

    const [updatedSession] = await db
      .update(gameSessions)
      .set({
        completedMissions: nextCompleted,
        fragmentsCollected: nextFragments,
        attemptsLog: nextAttempts,
        score: nextScore,
        elapsedSeconds: nextElapsed,
        updatedAt: new Date(),
      })
      .where(eq(gameSessions.id, session.id))
      .returning();

    const nextUnlockedIds = computeUnlockedMissionIds(
      missionList,
      nextCompleted,
      settings,
      isAdmin && session.isAdminTestSession
    );

    return NextResponse.json({
      isCorrect: true,
      feedback: result.feedback,
      session: updatedSession,
      solvedDetail: extractSolvedDetail(targetMission),
      unlockedIds: nextUnlockedIds,
    });
  } catch (err) {
    console.error("Verify mission error:", err);
    return NextResponse.json(
      { error: "驗證答案時發生錯誤，請再試一次。" },
      { status: 500 }
    );
  }
}
