import { NextRequest, NextResponse } from "next/server";
import { getGameBootstrapData } from "@/lib/game-engine";
import { FINAL_PUZZLE_DATA, OFFICIAL_SOURCES } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const rawSessionId = req.nextUrl.searchParams.get("sessionId");
    const validSessionId =
      rawSessionId && UUID_REGEX.test(rawSessionId) ? rawSessionId : null;

    const data = await getGameBootstrapData(validSessionId);

    return NextResponse.json({
      ...data,
      officialSources: OFFICIAL_SOURCES,
      finalPuzzleMeta: {
        title: FINAL_PUZZLE_DATA.title,
        subtitle: FINAL_PUZZLE_DATA.subtitle,
        storyPrompt: FINAL_PUZZLE_DATA.storyPrompt,
        openingLine: FINAL_PUZZLE_DATA.openingLine,
        closingLine: FINAL_PUZZLE_DATA.closingLine,
        shuffledLines: FINAL_PUZZLE_DATA.shuffledLines,
        hint: FINAL_PUZZLE_DATA.hint,
        sourceUrl: FINAL_PUZZLE_DATA.sourceUrl,
      },
    });
  } catch (err) {
    console.error("Bootstrap API error:", err);
    return NextResponse.json(
      { error: "無法載入遊戲資料，請稍後再試。" },
      { status: 500 }
    );
  }
}
