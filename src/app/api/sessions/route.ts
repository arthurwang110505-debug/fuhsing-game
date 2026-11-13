import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameSessions } from "@/db/schema";
import { ensureSeeded, getGameBootstrapData } from "@/lib/game-engine";
import { isRequestAdmin } from "@/lib/admin-auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[randomInt(chars.length)];
  return `FH${suffix}`;
}

const resumeAttempts = new Map<string, { count: number; resetAt: number }>();
const RESUME_LIMIT = 12;
const RESUME_WINDOW_MS = 15 * 60 * 1000;

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
        isAdminTestSession: Boolean(body.isAdminTestSession && await isRequestAdmin()),
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
    const ip = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
    const now = Date.now();
    for (const [key, value] of resumeAttempts) if (value.resetAt <= now) resumeAttempts.delete(key);
    const attempt = resumeAttempts.get(ip);
    if (attempt && attempt.count >= RESUME_LIMIT) {
      return NextResponse.json({ error: "查詢次數過多，請稍候再試。" }, { status: 429, headers: { "Retry-After": String(Math.ceil((attempt.resetAt - now) / 1000)) } });
    }
    resumeAttempts.set(ip, {
      count: attempt?.resetAt && attempt.resetAt > now ? attempt.count + 1 : 1,
      resetAt: attempt?.resetAt && attempt.resetAt > now ? attempt.resetAt : now + RESUME_WINDOW_MS,
    });
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
