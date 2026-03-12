import { getStablefordPoints, getParForHole } from "./stableford";

export interface HoleScoreRow {
  player_id: string;
  hole_number: number;
  gross_score: number;
}

export interface MatchPlayersBySide {
  team_a: string[];
  team_b: string[];
}

/**
 * Compute Stableford total for a set of players (e.g. one pair in 2v2).
 * When holeNumbers is provided (e.g. [10..18] for back 9), only those holes are summed.
 */
export function stablefordTotal(
  scores: HoleScoreRow[],
  playerIds: string[],
  holeCount: number,
  config?: { strokes_over_par: number; points: number }[],
  parByHole?: Map<number, number> | Record<number, number>,
  holeNumbers?: number[]
): number {
  let total = 0;
  const byPlayer = new Map<string, HoleScoreRow[]>();
  for (const s of scores) {
    if (!byPlayer.has(s.player_id)) byPlayer.set(s.player_id, []);
    byPlayer.get(s.player_id)!.push(s);
  }
  const holesToSum = holeNumbers ?? Array.from({ length: holeCount }, (_, i) => i + 1);
  for (const pid of playerIds) {
    const playerScores = byPlayer.get(pid) ?? [];
    for (const h of holesToSum) {
      const row = playerScores.find((s) => s.hole_number === h);
      if (!row) continue;
      let par: number | undefined;
      if (parByHole instanceof Map) {
        par = parByHole.get(h);
      } else if (parByHole) {
        par = (parByHole as Record<number, number>)[h];
      }
      const effectivePar = par ?? getParForHole(h);
      total += getStablefordPoints(row.gross_score, effectivePar, config);
    }
  }
  return total;
}

/**
 * Compare two pair Stableford totals; return team points: { team_a: 0|0.5|1, team_b: 0|0.5|1 }.
 */
export function stableford2v2Points(
  pointsA: number,
  pointsB: number
): { team_a: number; team_b: number } {
  if (pointsA > pointsB) return { team_a: 1, team_b: 0 };
  if (pointsB > pointsA) return { team_a: 0, team_b: 1 };
  return { team_a: 0.5, team_b: 0.5 };
}

/**
 * Match play: determine hole winner from two players' gross scores (lower wins).
 * Returns 'team_a' | 'team_b' | 'halve'.
 */
export function matchPlayHoleWinner(
  scoreA: number | undefined,
  scoreB: number | undefined
): "team_a" | "team_b" | "halve" {
  if (scoreA == null || scoreB == null) return "halve";
  if (scoreA < scoreB) return "team_a";
  if (scoreB < scoreA) return "team_b";
  return "halve";
}

/**
 * Match play result: count holes won per side, then overall (lead or tie).
 * Returns { team_a: 0|0.5|1, team_b: 0|0.5|1 }.
 * When holeNumbers is provided (e.g. [10..18] for back 9), only those holes are counted.
 */
export function matchPlay1v1Points(
  scores: HoleScoreRow[],
  teamAPlayerId: string,
  teamBPlayerId: string,
  holeCount: number,
  holeNumbers?: number[]
): { team_a: number; team_b: number } {
  let winsA = 0;
  let winsB = 0;
  const holesToCount = holeNumbers ?? Array.from({ length: holeCount }, (_, i) => i + 1);
  for (const h of holesToCount) {
    const sA = scores.find(
      (s) => s.player_id === teamAPlayerId && s.hole_number === h
    );
    const sB = scores.find(
      (s) => s.player_id === teamBPlayerId && s.hole_number === h
    );
    const winner = matchPlayHoleWinner(sA?.gross_score, sB?.gross_score);
    if (winner === "team_a") winsA++;
    else if (winner === "team_b") winsB++;
  }
  if (winsA > winsB) return { team_a: 1, team_b: 0 };
  if (winsB > winsA) return { team_a: 0, team_b: 1 };
  return { team_a: 0.5, team_b: 0.5 };
}
