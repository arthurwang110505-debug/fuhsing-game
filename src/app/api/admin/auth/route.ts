import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  isRequestAdmin,
} from "@/lib/admin-auth";
import { getAdminPasscode } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const loginFailures = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function constantTimeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  const authenticated = await isRequestAdmin();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const now = Date.now();
  for (const [ip, entry] of loginFailures) if (entry.resetAt <= now) loginFailures.delete(ip);
  const attempt = loginFailures.get(key);
  if (attempt && attempt.count >= MAX_FAILURES && attempt.resetAt > now) {
    return NextResponse.json(
      { error: "登入嘗試次數過多，請稍候 15 分鐘再試。" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((attempt.resetAt - now) / 1000)) } }
    );
  }

  try {
    const body = (await req.json()) as { passcode?: string };
    const provided = typeof body.passcode === "string" ? body.passcode.trim() : "";
    const expected = getAdminPasscode();
    if (!expected || !process.env.ADMIN_TOKEN_SECRET) {
      return NextResponse.json({ error: "管理員登入尚未設定。請設定 ADMIN_PASSCODE 與 ADMIN_TOKEN_SECRET。" }, { status: 503 });
    }

    if (!provided || !constantTimeEqual(provided, expected)) {
      const current = loginFailures.get(key);
      loginFailures.set(key, {
        count: (current?.count ?? 0) + 1,
        resetAt: current?.resetAt && current.resetAt > now ? current.resetAt : now + LOGIN_WINDOW_MS,
      });
      return NextResponse.json(
        { error: "管理員通行碼不正確，一般探索員模式無法檢視答案。" },
        { status: 401 }
      );
    }

    loginFailures.delete(key);
    const token = createAdminToken();
    const res = NextResponse.json({ authenticated: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "驗證失敗" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
