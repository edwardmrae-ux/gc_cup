import Image from "next/image";
import { getIndividualScoring } from "@/lib/individual-scoring";
import type { IndividualScoreRow } from "@/lib/individual-scoring";
import type { SaturdayFoursomePlayerSlot } from "@/lib/saturday-afternoon-seeding";

const TEAM_BAR: Record<"chubbs" | "mcavoy", string> = {
  chubbs: "bg-[#427340]",
  mcavoy: "bg-[#3C4E73]",
};

function PlayerCell({ row }: { row: IndividualScoreRow }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-1 h-5 shrink-0 rounded ${
          row.teamColor ? TEAM_BAR[row.teamColor] : "bg-slate-300"
        }`}
        aria-hidden
      />
      <span className="text-slate-900">{row.playerName}</span>
    </div>
  );
}

function ScoringTable({
  columnLabels,
  players,
}: {
  columnLabels: string[];
  players: SaturdayFoursomePlayerSlot[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[36rem]">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="py-2 pr-4 w-12">Seed</th>
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
          {players.map((slot) => (
            <tr key={slot.seed} className="border-t border-slate-200">
              <td className="py-2 pr-4 tabular-nums text-slate-600">{slot.seed}</td>
              <td className="py-2 pr-4">
                {slot.row ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <PlayerCell row={slot.row} />
                    {slot.isDefendingChampion && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                        Defending champion
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              {slot.row ? (
                <>
                  {slot.row.sessionStrokes.map((s, i) => (
                    <td key={i} className="py-2 px-3 text-right tabular-nums">
                      {s ?? "—"}
                    </td>
                  ))}
                  <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                    {slot.row.cumulative ?? "—"}
                  </td>
                </>
              ) : (
                <>
                  {columnLabels.map((_, i) => (
                    <td key={i} className="py-2 px-3 text-right text-slate-400">
                      —
                    </td>
                  ))}
                  <td className="py-2 pl-3 text-right text-slate-400">—</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function IndividualScoringPage() {
  const { columnLabels, saturdayFoursomeGroups, noDefendingChampion } =
    await getIndividualScoring();

  return (
    <section className="border border-slate-200 rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Individual Scoring</h1>
      <p className="text-sm text-slate-600 mb-2">
        Saturday Afternoon foursome assignments based on individual scoring through Saturday
        Morning.
      </p>
      <p className="text-sm text-slate-600 mb-4">
        Gross strokes per session (Friday Afternoon, Saturday Morning, Sunday Morning).
        Saturday afternoon is excluded. Total includes only sessions with recorded scores.
      </p>
      {noDefendingChampion && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          No defending champion is set. Harborfields seed 1 is assigned to the lowest total
          scorer.
        </p>
      )}
      <div className="space-y-6">
        {saturdayFoursomeGroups.map((group) => (
          <div
            key={group.label}
            className="rounded-lg border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <Image
                src={group.logoSrc}
                alt={`${group.label} logo`}
                width={36}
                height={36}
                className="h-9 w-9 object-contain shrink-0"
              />
              <h2 className="text-sm font-semibold text-slate-800">{group.label}</h2>
            </div>
            <div className="px-4 pb-4 pt-2">
              <ScoringTable columnLabels={columnLabels} players={group.players} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
