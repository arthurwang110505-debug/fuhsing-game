import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.ADMIN_PASSCODE ??= "test-passcode";
process.env.ADMIN_TOKEN_SECRET ??= "test-secret-for-unit-tests";
const authPromise = import("../src/lib/admin-auth");

test("admin token signatures are validated and tokens expire after eight hours", async () => {
  const auth = await authPromise;
  const token = auth.createAdminToken();
  assert.equal(auth.verifyAdminToken(token), true);
  assert.equal(auth.verifyAdminToken(`${token.slice(0, -1)}x`), false);
  assert.equal(auth.verifyAdminToken("admin:not-a-timestamp:deadbeef"), false);

  const issuedAt = Date.now() - 8 * 60 * 60 * 1000 - 1_000;
  const payload = `admin:${issuedAt}`;
  const signature = createHmac("sha256", process.env.ADMIN_TOKEN_SECRET!).update(payload).digest("hex");
  assert.equal(auth.verifyAdminToken(`${payload}:${signature}`), false);
});
