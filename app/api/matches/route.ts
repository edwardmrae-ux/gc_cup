import { NextResponse } from "next/server";
import { getAllMatches, partitionMatchesBySessionAndStatus } from "@/lib/leaderboard";
import { getActiveSessionId } from "@/lib/activeSessionStore";

export async function GET() {
  try {
    const [allMatches, activeSessionId] = await Promise.all([
      getAllMatches(),
      getActiveSessionId(),
    ]);

    const { liveMatches, completedMatches, upcomingMatches } =
      partitionMatchesBySessionAndStatus(allMatches, activeSessionId);

    return NextResponse.json({
      liveMatches,
      completedMatches,
      upcomingMatches,
      allMatches,
    });
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

