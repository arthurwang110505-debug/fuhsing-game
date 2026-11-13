import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAdminPasscode } from "./game-engine";

export const ADMIN_COOKIE_NAME = "fuhsing_admin_token";

function getSecretKey(): string {
  return process.env.ADMIN_TOKEN_SECRET || `fuhsing-chronicles-${getAdminPasscode()}-salt`;
}

export function createAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = createHmac("sha256", getSecretKey()).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [role, ts, sig] = parts;
  const issuedAt = Number(ts);
  const maxAgeMs = 8 * 60 * 60 * 1000;
  if (role !== "admin" || !Number.isSafeInteger(issuedAt) || issuedAt > Date.now() + 60_000 || Date.now() - issuedAt > maxAgeMs || !sig) return false;
  const payload = `${role}:${ts}`;
  const expectedSig = createHmac("sha256", getSecretKey())
    .update(payload)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isRequestAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}
