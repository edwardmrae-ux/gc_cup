import { createClient } from "@/lib/supabase/server";
import { AddPlayerForm } from "./AddPlayerForm";
import { CreateSessionForm } from "./CreateSessionForm";
import { CreateFoursomeForm } from "./CreateFoursomeForm";
import { CreateMatchForm } from "./CreateMatchForm";
import { ActiveSessionSelect } from "./ActiveSessionSelect";
import { AdminMatchesList } from "./AdminMatchesList";
import { getActiveSessionId } from "@/lib/activeSessionStore";
import {
  computeStablefordPairTotals,
  type HoleScoreRow,
} from "@/lib/team-points";

function formatMatchType(matchType: string) {
  if (matchType === "stableford_2v2") return "2v2 Stableford";
  if (matchType === "saturday_match_play_1v1") return "Saturday 1v1 Match Play";
  return "1v1 Match play";
}

function formatNine(nine: string | null | undefined) {
  if (nine === "front") return "Front 9";
  if (nine === "back") return "Back 9";
  return "—";
}

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  side: string;
  pair_index: number | null;
};

function sortMatchPlayerRows(rows: MatchPlayerRow[]): MatchPlayerRow[] {
  const sideOrder = (side: string) => (side === "team_a" ? 0 : 1);
  return [...rows].sort((a, b) => {
    const sd = sideOrder(a.side) - sideOrder(b.side);
    if (sd !== 0) return sd;
    return (a.pair_index ?? 0) - (b.pair_index ?? 0);
  });
}

function commaSeparatedPlayerNames(
  rows: MatchPlayerRow[],
  playersById: Map<string, string>
): string {
  return sortMatchPlayerRows(rows)
    .map(
      (r) =>
        playersById.get(r.player_id) ?? `${r.player_id.slice(0, 8)}…`
    )
    .join(", ");
}

export default async function AdminPage() {
  const supabase = await createClient();
  const [
    { data: courses },
    { data: teams },
    { data: players },
    { data: sessions },
    { data: foursomes },
    { data: matches },
  ] = await Promise.all([
    supabase.from("courses").select("id, name, short_name").order("name"),
    supabase.from("teams").select("id, name").order("name"),
    supabase.from("players").select("id, name, team_id").order("name"),
    supabase
      .from("sessions")
      .select("id, name, session_date, counts_for_team_competition, course_id")
      .order("session_date"),
    supabase
      .from("foursomes")
      .select("id, session_id, label, sort")
      .order("session_id"),
    supabase
      .from("matches")
      .select(
        "id, foursome_id, holes, status, match_type, match_num, nine, team_a_score_override, team_b_score_override"
      )
      .order("id"),
  ]);

  const activeSessionId = await getActiveSessionId();

  const sessionsById = new Map((sessions ?? []).map((s) => [s.id, s]));
  const coursesById = new Map((courses ?? []).map((c) => [c.id, c]));
  const foursomesById = new Map((foursomes ?? []).map((f) => [f.id, f]));
  const playersById = new Map((players ?? []).map((p) => [p.id, p.name]));

  const matchIds = (matches ?? []).map((m) => m.id);
  let matchPlayersRows: MatchPlayerRow[] = [];
  if (matchIds.length > 0) {
    const { data: mp } = await supabase
      .from("match_players")
      .select("match_id, player_id, side, pair_index")
      .in("match_id", matchIds);
    matchPlayersRows = (mp ?? []) as MatchPlayerRow[];
  }

  const matchPlayersByMatchId = new Map<string, MatchPlayerRow[]>();
  for (const row of matchPlayersRows) {
    const list = matchPlayersByMatchId.get(row.match_id) ?? [];
    list.push(row);
    matchPlayersByMatchId.set(row.match_id, list);
  }

  const sortedMatches = [...(matches ?? [])].sort((a, b) => {
    const numA = a.match_num ?? Number.POSITIVE_INFINITY;
    const numB = b.match_num ?? Number.POSITIVE_INFINITY;
    if (numA !== numB) return numA - numB;
    return a.id.localeCompare(b.id);
  });

  const sessionsForFilter = (sessions ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    session_date: s.session_date,
  }));

  const completedStablefordMatches = sortedMatches.filter(
    (m) => m.status === "complete" && m.match_type === "stableford_2v2"
  );
  const completedStablefordIds = completedStablefordMatches.map((m) => m.id);

  const { data: stablefordConfig } = await supabase
    .from("stableford_config")
    .select("strokes_over_par, points");

  const courseIds = Array.from(
    new Set(
      (sessions ?? [])
        .map((s) => s.course_id as string | null)
        .filter((id): id is string => !!id)
    )
  );
  const parByCourseAndHole = new Map<string, Map<number, number>>();
  if (courseIds.length > 0) {
    const { data: courseHoles } = await supabase
      .from("course_holes")
      .select("course_id, hole_number, par")
      .in("course_id", courseIds);
    for (const row of (courseHoles ?? []) as {
      course_id: string;
      hole_number: number;
      par: number;
    }[]) {
      if (!parByCourseAndHole.has(row.course_id)) {
        parByCourseAndHole.set(row.course_id, new Map());
      }
      parByCourseAndHole.get(row.course_id)!.set(row.hole_number, row.par);
    }
  }

  const scoresByMatchId = new Map<string, HoleScoreRow[]>();
  if (completedStablefordIds.length > 0) {
    const { data: holeScores } = await supabase
      .from("hole_scores")
      .select("match_id, player_id, hole_number, gross_score")
      .in("match_id", completedStablefordIds);
    for (const row of holeScores ?? []) {
      const list = scoresByMatchId.get(row.match_id) ?? [];
      list.push({
        player_id: row.player_id,
        hole_number: row.hole_number,
        gross_score: row.gross_score,
      });
      scoresByMatchId.set(row.match_id, list);
    }
  }

  const computedStablefordByMatchId = new Map<string, { teamA: number; teamB: number }>();
  for (const m of completedStablefordMatches) {
    const foursome = foursomesById.get(m.foursome_id);
    const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
    const parMap = session?.course_id
      ? parByCourseAndHole.get(session.course_id)
      : undefined;
    const mpRows = matchPlayersByMatchId.get(m.id) ?? [];
    const teamAIds = mpRows.filter((r) => r.side === "team_a").map((r) => r.player_id);
    const teamBIds = mpRows.filter((r) => r.side === "team_b").map((r) => r.player_id);
    const scoreRows = scoresByMatchId.get(m.id) ?? [];
    computedStablefordByMatchId.set(
      m.id,
      computeStablefordPairTotals(
        scoreRows,
        teamAIds,
        teamBIds,
        m.holes,
        stablefordConfig ?? [],
        parMap,
        m.nine
      )
    );
  }

  const adminMatchRows = sortedMatches.map((m) => {
    const foursome = foursomesById.get(m.foursome_id);
    const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
    const mpRows = matchPlayersByMatchId.get(m.id) ?? [];
    const playersStr = commaSeparatedPlayerNames(mpRows, playersById);
    const computed = computedStablefordByMatchId.get(m.id);
    return {
      id: m.id,
      sessionId: foursome?.session_id ?? null,
      sessionName: session?.name ?? "—",
      foursomeLabel: foursome?.label ?? foursome?.id.slice(0, 8) ?? "—",
      matchNum: m.match_num ?? null,
      matchType: m.match_type,
      matchTypeLabel: formatMatchType(m.match_type),
      nineLabel: formatNine(m.nine),
      holes: m.holes,
      status: m.status,
      playersStr,
      computedTeamA: computed?.teamA,
      computedTeamB: computed?.teamB,
      overrideTeamA: m.team_a_score_override,
      overrideTeamB: m.team_b_score_override,
    };
  });

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-800">Admin</h1>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Players</h2>
        <AddPlayerForm teams={teams ?? []} />
        <ul className="mt-3 space-y-1 text-sm">
          {(players ?? []).map((p) => (
            <li key={p.id}>
              {p.name} – {(teams ?? []).find((t) => t.id === p.team_id)?.name ?? p.team_id}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Sessions</h2>
        <CreateSessionForm courses={courses ?? []} />
        <ul className="mt-3 space-y-1 text-sm">
          {(sessions ?? []).map((s) => (
            <li key={s.id}>
              {s.name} ({s.session_date}
              {s.course_id &&
                ` – ${
                  coursesById.get(s.course_id)?.short_name ??
                  coursesById.get(s.course_id)?.name ??
                  "Course"
                }`}
              )
              {!s.counts_for_team_competition && " (does not count)"}
            </li>
          ))}
        </ul>
        <ActiveSessionSelect sessions={(sessions ?? []) as any} activeSessionId={activeSessionId} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Foursomes</h2>
        <CreateFoursomeForm sessions={sessions ?? []} />
        <ul className="mt-3 space-y-1 text-sm">
          {(foursomes ?? []).map((f) => (
            <li key={f.id}>
              {f.label ?? f.id.slice(0, 8)} – {sessionsById.get(f.session_id)?.name ?? f.session_id}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Matches</h2>
        <CreateMatchForm
          foursomes={foursomes ?? []}
          players={players ?? []}
          teams={teams ?? []}
          sessions={sessions ?? []}
        />
        <AdminMatchesList sessions={sessionsForFilter} rows={adminMatchRows} />
      </section>
    </div>
  );
}
