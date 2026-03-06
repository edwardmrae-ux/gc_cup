import Link from "next/link";
import { getTeamTotals, getInProgressMatches, getAllMatches } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  const [totals, liveMatches, allMatches] = await Promise.all([
    getTeamTotals(),
    getInProgressMatches(),
    getAllMatches(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>

      <section className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Team score</h2>
        <div className="flex justify-between items-center gap-8">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-slate-900">Team Chubbs</p>
            <p className="text-4xl font-bold text-slate-800 mt-1">{totals.teamChubbs}</p>
          </div>
          <div className="text-slate-400 font-medium">vs</div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-slate-900">Team McAvoy</p>
            <p className="text-4xl font-bold text-slate-800 mt-1">{totals.teamMcAvoy}</p>
          </div>
        </div>
      </section>

      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Live matches</h2>
          <ul className="space-y-3">
            {liveMatches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  className="block border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 shadow-sm"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-slate-800">
                        {m.sessionName}
                        {m.foursomeLabel ? ` – ${m.foursomeLabel}` : ""}
                      </p>
                      <p className="text-sm text-slate-600">
                        {m.matchType === "stableford_2v2"
                          ? "2v2 Stableford"
                          : "1v1 Match play"}{" "}
                        – {m.holes} holes
                      </p>
                      {m.playerNames && (
                        <p className="text-xs text-slate-500 mt-1">
                          Chubbs: {m.playerNames.team_a.join(", ")} vs McAvoy:{" "}
                          {m.playerNames.team_b.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {m.matchType === "stableford_2v2" && (
                        <p className="text-lg font-semibold text-slate-800">
                          {m.teamAPoints ?? 0} – {m.teamBPoints ?? 0}
                        </p>
                      )}
                      {m.matchType === "match_play_1v1" && m.matchPlayState && (
                        <p className="text-lg font-semibold text-slate-800">
                          {m.matchPlayState}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {allMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">All matches</h2>
          <ul className="space-y-2">
            {allMatches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/match/${m.id}`}
                  className="block border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 text-sm"
                >
                  <span className="font-medium text-slate-800">
                    {m.sessionName}
                    {m.foursomeLabel ? ` – ${m.foursomeLabel}` : ""}
                  </span>
                  <span className="text-slate-500 ml-2">
                    {m.matchType === "stableford_2v2" ? "2v2" : "1v1"} · {m.holes} holes · {m.status.replace("_", " ")}
                  </span>
                  {(m.teamAPoints != null || m.matchPlayState) && (
                    <span className="ml-2 font-medium">
                      {m.matchType === "stableford_2v2"
                        ? `${m.teamAPoints ?? 0}–${m.teamBPoints ?? 0}`
                        : m.matchPlayState}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-slate-500">
        Team points are from sessions that count toward the competition. Saturday
        afternoon round is excluded.
      </p>
    </div>
  );
}
