import { getIndividualScoring } from "@/lib/individual-scoring";

const TEAM_BAR: Record<"chubbs" | "mcavoy", string> = {
  chubbs: "bg-[#427340]",
  mcavoy: "bg-[#3C4E73]",
};

export default async function IndividualScoringPage() {
  const { columnLabels, rows } = await getIndividualScoring();

  return (
    <section className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Individual Scoring</h1>
      <p className="text-sm text-slate-600 mb-4">
        Gross strokes per session (Friday Afternoon, Saturday Morning, Sunday Morning). Saturday
        afternoon is excluded. Total includes only sessions with recorded scores.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[36rem]">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-2 pr-4">Player</th>
              {columnLabels.map((l) => (
                <th key={l} className="py-2 px-3 text-right whitespace-nowrap">
                  {l}
                </th>
              ))}
              <th className="py-2 pl-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.playerId} className="border-t border-slate-200">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-1 h-5 shrink-0 rounded ${
                        r.teamColor ? TEAM_BAR[r.teamColor] : "bg-slate-300"
                      }`}
                      aria-hidden
                    />
                    <span className="text-slate-900">{r.playerName}</span>
                  </div>
                </td>
                {r.sessionStrokes.map((s, i) => (
                  <td key={i} className="py-2 px-3 text-right tabular-nums">
                    {s ?? "—"}
                  </td>
                ))}
                <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                  {r.cumulative ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
