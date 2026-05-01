/** Match card team colors — see MatchesSection.tsx */
const CHUBBS_GREEN = "#1F5E3B";
const MCAVOY_ORANGE = "#C65D1E";

export interface TeamPointsScorecardProps {
  teamChubbs: number;
  teamMcAvoy: number;
  maxPoints?: number;
}

function normalizeForBar(
  teamChubbs: number,
  teamMcAvoy: number,
  maxPoints: number
): { chubbs: number; mcavoy: number } {
  const sum = teamChubbs + teamMcAvoy;
  if (sum <= maxPoints || sum === 0) {
    return { chubbs: teamChubbs, mcavoy: teamMcAvoy };
  }
  const scale = maxPoints / sum;
  return { chubbs: teamChubbs * scale, mcavoy: teamMcAvoy * scale };
}

function cellFills(
  index: number,
  chubbs: number,
  mcavoy: number,
  maxPoints: number
): { greenFraction: number; orangeFraction: number } {
  const greenFraction = Math.max(0, Math.min(chubbs, index + 1) - index);
  const orangeFraction = Math.max(
    0,
    Math.min(index + 1, maxPoints) - Math.max(index, maxPoints - mcavoy)
  );
  return { greenFraction, orangeFraction };
}

export function TeamPointsScorecard({
  teamChubbs,
  teamMcAvoy,
  maxPoints = 32,
}: TeamPointsScorecardProps) {
  const { chubbs, mcavoy } = normalizeForBar(teamChubbs, teamMcAvoy, maxPoints);

  const label = `Team points out of ${maxPoints}: Team Chubbs ${teamChubbs}, Team McAvoy ${teamMcAvoy}`;

  return (
    <div
      className="w-full rounded-full bg-slate-200 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
      role="img"
      aria-label={label}
    >
      <div className="flex h-10 w-full overflow-hidden rounded-full ring-1 ring-slate-300/60">
        {Array.from({ length: maxPoints }, (_, i) => {
          const { greenFraction, orangeFraction } = cellFills(i, chubbs, mcavoy, maxPoints);
          return (
            <div
              key={i}
              className="relative min-w-0 flex-1 bg-slate-100 border-r border-slate-300/40 last:border-r-0"
            >
              {greenFraction > 0 && (
                <div
                  className="absolute inset-y-0 left-0 z-[1]"
                  style={{
                    width: `${greenFraction * 100}%`,
                    backgroundColor: CHUBBS_GREEN,
                  }}
                />
              )}
              {orangeFraction > 0 && (
                <div
                  className="absolute inset-y-0 right-0 z-[1]"
                  style={{
                    width: `${orangeFraction * 100}%`,
                    backgroundColor: MCAVOY_ORANGE,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
