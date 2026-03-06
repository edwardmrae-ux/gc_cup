import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStablefordPoints, getParForHole } from "@/lib/stableford";
import {
  stablefordTotal,
  stableford2v2Points,
  matchPlay1v1Points,
} from "@/lib/team-points";
import { ScoreEntryForm } from "./ScoreEntryForm";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, foursome_id, holes, status, match_type")
    .eq("id", matchId)
    .single();
  if (matchErr || !match) notFound();

  const { data: foursome } = await supabase
    .from("foursomes")
    .select("id, session_id, label")
    .eq("id", match.foursome_id)
    .single();
  const { data: session } = foursome
    ? await supabase.from("sessions").select("name").eq("id", foursome.session_id).single()
    : { data: null };
  const { data: matchPlayers } = await supabase
    .from("match_players")
    .select("player_id, side")
    .eq("match_id", matchId);
  const playerIds = (matchPlayers ?? []).map((mp) => mp.player_id);
  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .in("id", playerIds);
  const { data: holeScores } = await supabase
    .from("hole_scores")
    .select("player_id, hole_number, gross_score")
    .eq("match_id", matchId);
  const { data: config } = await supabase
    .from("stableford_config")
    .select("strokes_over_par, points");

  const playersById = new Map((players ?? []).map((p) => [p.id, p.name]));
  const teamAIds = (matchPlayers ?? []).filter((p) => p.side === "team_a").map((p) => p.player_id);
  const teamBIds = (matchPlayers ?? []).filter((p) => p.side === "team_b").map((p) => p.player_id);
  const scoreRows = (holeScores ?? []).map((s) => ({
    player_id: s.player_id,
    hole_number: s.hole_number,
    gross_score: s.gross_score,
  }));
  const stablefordConfig = config ?? [];
  const holeCount = match.holes;

  let teamAPoints: number | null = null;
  let teamBPoints: number | null = null;
  let matchPlayState: string | null = null;
  if (match.match_type === "stableford_2v2") {
    teamAPoints = stablefordTotal(scoreRows, teamAIds, holeCount, stablefordConfig);
    teamBPoints = stablefordTotal(scoreRows, teamBIds, holeCount, stablefordConfig);
  } else if (teamAIds[0] && teamBIds[0]) {
    const { team_a, team_b } = matchPlay1v1Points(
      scoreRows,
      teamAIds[0],
      teamBIds[0],
      holeCount
    );
    matchPlayState =
      team_a > team_b ? "Chubbs wins" : team_b > team_a ? "McAvoy wins" : "Halved";
  }

  const getScore = (playerId: string, holeNum: number) =>
    holeScores?.find((s) => s.player_id === playerId && s.hole_number === holeNum)?.gross_score;

  const allPlayerIds = [...teamAIds, ...teamBIds];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-slate-900">Leaderboard</Link>
        <span>/</span>
        <span>{session?.name ?? "Match"}</span>
        {foursome?.label && <span>– {foursome.label}</span>}
      </div>

      <h1 className="text-2xl font-bold text-slate-800">
        {match.match_type === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play"} – {match.holes} holes
      </h1>
      <p className="text-slate-600 capitalize">{match.status.replace("_", " ")}</p>

      {(teamAPoints !== null || matchPlayState) && (
        <div className="flex gap-6 text-lg font-semibold">
          {match.match_type === "stableford_2v2" && (
            <p>Team Chubbs {teamAPoints ?? 0} – Team McAvoy {teamBPoints ?? 0}</p>
          )}
          {match.match_type === "match_play_1v1" && matchPlayState && (
            <p>{matchPlayState}</p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4">Hole</th>
              {allPlayerIds.map((pid) => (
                <th key={pid} className="text-left py-2 pr-4">
                  {playersById.get(pid) ?? pid.slice(0, 8)}
                </th>
              ))}
              {match.match_type === "stableford_2v2" && (
                <>
                  <th className="text-left py-2">Chubbs pts</th>
                  <th className="text-left py-2">McAvoy pts</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: holeCount }, (_, i) => i + 1).map((holeNum) => {
              const par = getParForHole(holeNum);
              const teamAPts =
                match.match_type === "stableford_2v2"
                  ? teamAIds.reduce((sum, pid) => {
                      const s = getScore(pid, holeNum);
                      return s == null ? sum : sum + getStablefordPoints(s, par, stablefordConfig);
                    }, 0)
                  : 0;
              const teamBPts =
                match.match_type === "stableford_2v2"
                  ? teamBIds.reduce((sum, pid) => {
                      const s = getScore(pid, holeNum);
                      return s == null ? sum : sum + getStablefordPoints(s, par, stablefordConfig);
                    }, 0)
                  : 0;
              return (
                <tr key={holeNum} className="border-b border-slate-100">
                  <td className="py-1 pr-4 font-medium">{holeNum}</td>
                  {allPlayerIds.map((pid) => (
                    <td key={pid} className="py-1 pr-4">
                      {getScore(pid, holeNum) ?? "–"}
                    </td>
                  ))}
                  {match.match_type === "stableford_2v2" && (
                    <>
                      <td className="py-1">{teamAPts || "–"}</td>
                      <td className="py-1">{teamBPts || "–"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ScoreEntryForm
        matchId={matchId}
        players={allPlayerIds.map((id) => ({ id, name: playersById.get(id) ?? id }))}
        holeCount={holeCount}
        existingScores={holeScores ?? []}
      />
    </div>
  );
}
