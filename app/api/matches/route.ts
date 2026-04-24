import { NextResponse } from "next/server";
import { getActiveSessionLabel } from "@/lib/activeSessionLabel";
import { getAllMatches, partitionMatchesBySessionAndStatus } from "@/lib/leaderboard";

export async function GET() {
  try {
    const [allMatches, { activeSessionId, activeSessionName }] = await Promise.all([
      getAllMatches(),
      getActiveSessionLabel(),
    ]);

    const { liveMatches, completedMatches, upcomingMatches } =
      partitionMatchesBySessionAndStatus(allMatches, activeSessionId);

    return NextResponse.json({
      liveMatches,
      completedMatches,
      upcomingMatches,
      allMatches,
      activeSessionName,
    });
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

