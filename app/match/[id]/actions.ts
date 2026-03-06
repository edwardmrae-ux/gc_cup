"use server";

import { createClient } from "@/lib/supabase/server";

export async function upsertHoleScore(
  matchId: string,
  playerId: string,
  holeNumber: number,
  grossScore: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from("hole_scores").upsert(
    {
      match_id: matchId,
      player_id: playerId,
      hole_number: holeNumber,
      gross_score: grossScore,
    },
    { onConflict: "match_id,player_id,hole_number" }
  );
  if (error) return { error: error.message };
  return {};
}
