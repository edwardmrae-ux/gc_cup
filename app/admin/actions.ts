"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "gc_admin_pin";

export async function verifyAdminPin(formData: FormData) {
  const pin = formData.get("pin") as string | null;
  const expected = process.env.ADMIN_PIN;
  if (!expected || pin !== expected) {
    return { error: "Incorrect PIN" };
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "1", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/admin");
}

export async function submitAdminPin(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const pin = formData.get("pin") as string | null;
  const expected = process.env.ADMIN_PIN;
  if (!expected || pin !== expected) {
    return { error: "Incorrect PIN" };
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "1", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/admin");
}

export async function checkAdminCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
}

import { createClient } from "@/lib/supabase/server";

export async function addPlayer(_prev: { error?: string }, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const team_id = formData.get("team_id") as string;
  if (!name?.trim() || !team_id) return { error: "Name and team required" };
  const { error } = await supabase.from("players").insert({ name: name.trim(), team_id });
  if (error) return { error: error.message };
  return {};
}

export async function createSession(_prev: { error?: string }, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const session_date = formData.get("session_date") as string;
  const counts = formData.get("counts_for_team_competition");
  const counts_for_team_competition = counts === "on" || counts === "true";
  const course_id = formData.get("course_id") as string | null;
  if (!name?.trim() || !session_date || !course_id) {
    return { error: "Name, date, and course are required" };
  }
  const { error } = await supabase.from("sessions").insert({
    name: name.trim(),
    session_date,
    counts_for_team_competition,
    course_id,
  });
  if (error) return { error: error.message };
  return {};
}

export async function createFoursome(_prev: { error?: string }, formData: FormData) {
  const supabase = await createClient();
  const session_id = formData.get("session_id") as string;
  const label = (formData.get("label") as string) || null;
  if (!session_id) return { error: "Session required" };
  const { error } = await supabase.from("foursomes").insert({ session_id, label: label?.trim() || null });
  if (error) return { error: error.message };
  return {};
}

export async function createMatch(_prev: { error?: string }, formData: FormData) {
  const supabase = await createClient();
  const foursome_id = formData.get("foursome_id") as string;
  const holes = parseInt(formData.get("holes") as string, 10);
  const status = (formData.get("status") as string) || "not_started";
  const match_type = formData.get("match_type") as string;
  const team_a_1 = formData.get("team_a_player_1") as string | null;
  const team_a_2 = formData.get("team_a_player_2") as string | null;
  const team_b_1 = formData.get("team_b_player_1") as string | null;
  const team_b_2 = formData.get("team_b_player_2") as string | null;
  if (!foursome_id || !match_type) return { error: "Foursome and match type required" };
  if (match_type === "stableford_2v2" && (!team_a_1 || !team_a_2 || !team_b_1 || !team_b_2)) {
    return { error: "All four players required for 2v2" };
  }
  if (match_type === "match_play_1v1" && (!team_a_1 || !team_b_1)) {
    return { error: "Both players required for 1v1" };
  }
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .insert({
      foursome_id,
      holes: holes === 18 ? 18 : 9,
      status,
      match_type: match_type as "stableford_2v2" | "match_play_1v1",
    })
    .select("id")
    .single();
  if (matchErr || !match) return { error: matchErr?.message ?? "Failed to create match" };
  const rows: { match_id: string; player_id: string; side: "team_a" | "team_b"; pair_index: number | null }[] = [];
  if (team_a_1) rows.push({ match_id: match.id, player_id: team_a_1, side: "team_a", pair_index: match_type === "match_play_1v1" ? null : 0 });
  if (team_a_2) rows.push({ match_id: match.id, player_id: team_a_2, side: "team_a", pair_index: 1 });
  if (team_b_1) rows.push({ match_id: match.id, player_id: team_b_1, side: "team_b", pair_index: match_type === "match_play_1v1" ? null : 0 });
  if (team_b_2) rows.push({ match_id: match.id, player_id: team_b_2, side: "team_b", pair_index: 1 });
  const { error: mpErr } = await supabase.from("match_players").insert(rows);
  if (mpErr) return { error: mpErr.message };
  return {};
}

export async function updateMatchStatus(matchId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("matches").update({ status }).eq("id", matchId);
  if (error) return { error: error.message };
  return {};
}
