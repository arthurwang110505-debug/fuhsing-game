import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  isRequestAdmin,
} from "@/lib/admin-auth";
import { getAdminPasscode } from "@/lib/game-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isRequestAdmin();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { passcode?: string };
    const provided = (body.passcode || "").trim();
    const expected = getAdminPasscode();

    if (!provided || provided !== expected) {
      return NextResponse.json(
        { error: "管理員通行碼不正確，一般探索員模式無法檢視答案。" },
        { status: 401 }
      );
    }

    const token = createAdminToken();
    const res = NextResponse.json({ authenticated: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
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
