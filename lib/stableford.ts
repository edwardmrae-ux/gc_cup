/**
 * Compute Stableford points for a hole from gross score and par.
 * Uses config: strokes_over_par -> points (e.g. +2 -> 0, +1 -> 1, 0 -> 2, -1 -> 3, -2 -> 4).
 * Values not in config default to 0 points.
 */
const DEFAULT_POINTS: Record<number, number> = {
  2: 0,
  1: 1,
  0: 2,
  [-1]: 3,
  [-2]: 4,
  [-3]: 5,
};

export function getStablefordPoints(
  grossScore: number,
  par: number,
  config?: { strokes_over_par: number; points: number }[]
): number {
  const strokesOverPar = grossScore - par;
  if (config && config.length > 0) {
    const row = config.find((r) => r.strokes_over_par === strokesOverPar);
    return row ? row.points : 0;
  }
  return DEFAULT_POINTS[strokesOverPar] ?? 0;
}

/** Default par per hole (1-18). Customize per course if needed. */
export const DEFAULT_PAR_BY_HOLE: number[] = [
  4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5,
];

export function getParForHole(holeNumber: number): number {
  return DEFAULT_PAR_BY_HOLE[holeNumber - 1] ?? 4;
}
