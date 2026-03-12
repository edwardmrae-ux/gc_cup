import { createClient } from "@/lib/supabase/server";
import { AddPlayerForm } from "./AddPlayerForm";
import { CreateSessionForm } from "./CreateSessionForm";
import { CreateFoursomeForm } from "./CreateFoursomeForm";
import { CreateMatchForm } from "./CreateMatchForm";
import { MatchStatusSelect } from "./MatchStatusSelect";
import { ActiveSessionSelect } from "./ActiveSessionSelect";
import { getActiveSessionId } from "@/lib/activeSessionStore";
import Link from "next/link";

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
    supabase.from("foursomes").select("id, session_id, label").order("session_id"),
    supabase.from("matches").select("id, foursome_id, holes, status, match_type").order("id"),
  ]);

  const activeSessionId = await getActiveSessionId();

  const sessionsById = new Map((sessions ?? []).map((s) => [s.id, s]));
  const coursesById = new Map((courses ?? []).map((c) => [c.id, c]));
  const foursomesById = new Map((foursomes ?? []).map((f) => [f.id, f]));

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
        <ul className="mt-3 space-y-2 text-sm">
          {(matches ?? []).map((m) => {
            const foursome = foursomesById.get(m.foursome_id);
            const session = foursome ? sessionsById.get(foursome.session_id) : undefined;
            return (
              <li key={m.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600">
                  {session?.name ?? "—"}
                  {foursome && ` – ${foursome.label ?? foursome.id.slice(0, 8)}`}
                </span>
                <Link href={`/match/${m.id}`} className="text-blue-600 hover:underline">
                  {m.match_type === "stableford_2v2" ? "2v2 Stableford" : "1v1 Match play"} – {m.holes} holes
                </Link>
                <MatchStatusSelect matchId={m.id} currentStatus={m.status} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
