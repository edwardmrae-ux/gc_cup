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

export async function updateMatchStatus(matchId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
  if (error) return { error: error.message };
  return {};
}
