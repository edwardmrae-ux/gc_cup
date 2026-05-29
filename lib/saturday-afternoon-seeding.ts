import type { IndividualScoreRow } from "./individual-scoring";
import {
  SATURDAY_AFTERNOON_FOURSOMES,
  SATURDAY_FOURSOME_LOGOS,
  type SaturdayAfternoonFoursomeName,
} from "./saturday-foursomes";

export interface SaturdayFoursomePlayerSlot {
  row: IndividualScoreRow | null;
  seed: number;
  isDefendingChampion?: boolean;
}

export interface SaturdayFoursomeGroup {
  label: SaturdayAfternoonFoursomeName;
  logoSrc: string;
  players: SaturdayFoursomePlayerSlot[];
}

function sortByScore(rows: IndividualScoreRow[]): IndividualScoreRow[] {
  return [...rows].sort((a, b) => {
    if (a.cumulative == null && b.cumulative == null) {
      return a.playerName.localeCompare(b.playerName);
    }
    if (a.cumulative == null) return 1;
    if (b.cumulative == null) return -1;
    if (a.cumulative !== b.cumulative) return a.cumulative - b.cumulative;
    return a.playerName.localeCompare(b.playerName);
  });
}

/**
 * Map 1-based rank among non-champions to foursome index (0–3) and seed (1–4).
 * When a defending champion occupies Harborfields seed 1, non-champ ranks 1–3 fill seeds 2–4.
 */
function slotForNonChampRank(
  rank: number,
  hasDefendingChampion: boolean
): { foursomeIndex: number; seed: number } {
  const adjustedRank = hasDefendingChampion ? rank + 1 : rank;
  const foursomeIndex = Math.floor((adjustedRank - 1) / 4);
  const seed = ((adjustedRank - 1) % 4) + 1;
  return { foursomeIndex: Math.min(foursomeIndex, 3), seed };
}

export function buildSaturdayAfternoonFoursomeGroups(
  rows: IndividualScoreRow[],
  defendingChampPlayerId: string | null
): SaturdayFoursomeGroup[] {
  const slots: (IndividualScoreRow | null)[][] = SATURDAY_AFTERNOON_FOURSOMES.map(() =>
    Array.from({ length: 4 }, () => null)
  );
  const defendingFlags: boolean[][] = SATURDAY_AFTERNOON_FOURSOMES.map(() =>
    Array.from({ length: 4 }, () => false)
  );

  const defendingRow =
    defendingChampPlayerId != null
      ? rows.find((r) => r.playerId === defendingChampPlayerId) ?? null
      : null;

  const hasDefendingChampion = defendingRow != null;

  if (defendingRow != null) {
    slots[0][0] = defendingRow;
    defendingFlags[0][0] = true;
  }

  const others = sortByScore(
    hasDefendingChampion ? rows.filter((r) => r.playerId !== defendingRow!.playerId) : rows
  );

  let rank = 0;
  for (const row of others) {
    rank += 1;
    const { foursomeIndex, seed } = slotForNonChampRank(rank, hasDefendingChampion);
    const seedIndex = seed - 1;
    if (seedIndex >= 0 && seedIndex < 4) {
      slots[foursomeIndex][seedIndex] = row;
    }
  }

  return SATURDAY_AFTERNOON_FOURSOMES.map((label, i) => ({
    label,
    logoSrc: SATURDAY_FOURSOME_LOGOS[label],
    players: slots[i].map((row, seedIndex) => ({
      row,
      seed: seedIndex + 1,
      isDefendingChampion: defendingFlags[i][seedIndex] || undefined,
    })),
  }));
}
