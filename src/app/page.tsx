import { db } from "@/db";
import { ensureSeeded } from "@/lib/game-engine";
import { sql } from "drizzle-orm";
import FuhsingChroniclesApp from "@/components/FuhsingChroniclesApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await db.execute(sql`select 1`);
  await ensureSeeded();

  return <FuhsingChroniclesApp />;
}
