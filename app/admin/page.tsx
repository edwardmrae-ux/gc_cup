import { createClient } from "@/lib/supabase/server";
import { AddPlayerForm } from "./AddPlayerForm";
import { CreateSessionForm } from "./CreateSessionForm";
import { CreateFoursomeForm } from "./CreateFoursomeForm";
import { CreateMatchForm } from "./CreateMatchForm";
import { MatchStatusSelect } from "./MatchStatusSelect";
import { ActiveSessionSelect } from "./ActiveSessionSelect";
import { getActiveSessionId } from "@/lib/activeSessionStore";
import Link from "next/link";

function formatMatchType(matchType: string) {
  return matchType === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play";
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
      .select("id, foursome_id, holes, status, match_type, match_num, nine")
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
        <ul className="mt-3 space-y-3 text-sm">
          {sortedMatches.map((m) => {
            const foursome = foursomesById.get(m.foursome_id);
            const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
            const mpRows = matchPlayersByMatchId.get(m.id) ?? [];
            const playersStr = commaSeparatedPlayerNames(mpRows, playersById);
            return (
              <li key={m.id} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0">
                <div className="text-slate-700 flex flex-wrap gap-x-2 gap-y-1 items-baseline">
                  <span>
                    <span className="text-slate-500">Session:</span> {session?.name ?? "—"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <span className="text-slate-500">Foursome:</span>{" "}
                    {foursome?.label ?? foursome?.id.slice(0, 8) ?? "—"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <span className="text-slate-500">Match #:</span> {m.match_num ?? "—"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <span className="text-slate-500">Type:</span> {formatMatchType(m.match_type)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <span className="text-slate-500">Nine:</span> {formatNine(m.nine)}
                  </span>
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500">Players:</span> {playersStr || "—"}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/match/${m.id}`} className="text-blue-600 hover:underline">
                    Open scoring ({m.holes} holes)
                  </Link>
                  <MatchStatusSelect matchId={m.id} currentStatus={m.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
