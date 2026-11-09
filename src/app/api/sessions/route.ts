import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions } from "@/db/schema";
import { ensureSeeded, getGameBootstrapData } from "@/lib/game-engine";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FH${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = (await req.json()) as {
      mode?: "solo" | "team";
      playerName?: string;
      teamName?: string;
      isAdminTestSession?: boolean;
    };

    const mode = body.mode === "team" ? "team" : "solo";
    const playerName = (body.playerName || "").trim();
    const teamName = (body.teamName || "").trim();

    if (!playerName) {
      return NextResponse.json(
        { error: "請填寫探索員名稱再出發！" },
        { status: 400 }
      );
    }

    if (mode === "team" && !teamName) {
      return NextResponse.json(
        { error: "選擇組隊模式時，請填寫小隊名稱！" },
        { status: 400 }
      );
    }

    let sessionCode = generateSessionCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db
        .select({ id: gameSessions.id })
        .from(gameSessions)
        .where(eq(gameSessions.sessionCode, sessionCode));
      if (existing.length === 0) break;
      sessionCode = generateSessionCode();
    }

    const [created] = await db
      .insert(gameSessions)
      .values({
        sessionCode,
        mode,
        playerName: playerName.slice(0, 40),
        teamName: mode === "team" ? teamName.slice(0, 40) : null,
        isAdminTestSession: Boolean(body.isAdminTestSession),
      })
      .returning();

    const bootstrap = await getGameBootstrapData(created.id);
    return NextResponse.json(bootstrap);
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: "建立探索檔案時發生問題，請再試一次。" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { error: "請輸入 6 碼檔案代碼（例如 FH82K9）。" },
        { status: 400 }
      );
    }

    const [found] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.sessionCode, code));

    if (!found) {
      return NextResponse.json(
        { error: "找不到這個探索檔案代碼，請確認是否輸入正確。" },
        { status: 404 }
      );
    }

    const bootstrap = await getGameBootstrapData(found.id);
    return NextResponse.json(bootstrap);
  } catch (err) {
    console.error("Resume session error:", err);
    return NextResponse.json(
      { error: "查詢檔案失敗，請稍後再試。" },
      { status: 500 }
    );
  }
}
