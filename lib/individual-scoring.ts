import { createClient } from "./supabase/server";
import { TRACKED_SESSION_NAMES } from "./session-names";
import {
  buildSaturdayAfternoonFoursomeGroups,
  type SaturdayFoursomeGroup,
} from "./saturday-afternoon-seeding";

export { TRACKED_SESSION_NAMES };
export type { SaturdayFoursomeGroup };

export type TeamColor = "chubbs" | "mcavoy" | null;

export interface IndividualScoreRow {
  playerId: string;
  playerName: string;
  teamColor: TeamColor;
  defendingChamp: boolean;
  /** Length 3, aligned with `TRACKED_SESSION_NAMES`. */
  sessionStrokes: (number | null)[];
  cumulative: number | null;
}

export interface IndividualScoringData {
  columnLabels: string[];
  saturdayFoursomeGroups: SaturdayFoursomeGroup[];
  noDefendingChampion: boolean;
}

function normalizeSessionName(s: string): string {
  return s.trim().toLowerCase();
}

function teamNameToColor(teamName: string): TeamColor {
  const n = teamName.trim().toLowerCase();
  if (n === "team chubbs" || n.includes("chubbs")) return "chubbs";
  if (n === "team mcavoy" || n.includes("mcavoy")) return "mcavoy";
  return null;
}

function buildTeamColorMap(teams: { id: string; name: string }[]): Map<string, TeamColor> {
  const m = new Map<string, TeamColor>();
  for (const t of teams) {
    m.set(t.id, teamNameToColor(t.name));
  }
  return m;
}

function sortIndividualRows(rows: IndividualScoreRow[]): IndividualScoreRow[] {
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

export async function getIndividualScoring(): Promise<IndividualScoringData> {
  const supabase = await createClient();

  const [{ data: allSessions }, { data: teams }, { data: players }] = await Promise.all([
    supabase.from("sessions").select("id, name"),
    supabase.from("teams").select("id, name"),
    supabase.from("players").select("id, name, team_id, defending_champ").order("name"),
  ]);

  const nameToId = new Map<string, string>();
  for (const s of allSessions ?? []) {
    nameToId.set(normalizeSessionName(s.name), s.id);
  }

  const trackedSessionIds: (string | null)[] = TRACKED_SESSION_NAMES.map(
    (label) => nameToId.get(normalizeSessionName(label)) ?? null
  );

  const validSessionIds = trackedSessionIds.filter((id): id is string => id != null);

  let sums = new Map<string, Map<number, number>>();

  if (validSessionIds.length > 0) {
    const { data: foursomes } = await supabase
      .from("foursomes")
      .select("id, session_id")
      .in("session_id", validSessionIds);

    const foursomeToSession = new Map((foursomes ?? []).map((f) => [f.id, f.session_id]));
    const foursomeIds = Array.from(foursomeToSession.keys());

    if (foursomeIds.length > 0) {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, foursome_id")
        .in("foursome_id", foursomeIds);

      const matchToSessionIndex = new Map<string, number>();
      for (const m of matches ?? []) {
        const sessionId = foursomeToSession.get(m.foursome_id);
        if (!sessionId) continue;
        const idx = trackedSessionIds.findIndex((sid) => sid === sessionId);
        if (idx >= 0) matchToSessionIndex.set(m.id, idx);
      }

      const matchIds = (matches ?? []).map((m) => m.id);

      if (matchIds.length > 0) {
        const { data: holeScores } = await supabase
          .from("hole_scores")
          .select("match_id, player_id, gross_score")
          .in("match_id", matchIds);

        sums = new Map();
        for (const row of holeScores ?? []) {
          const idx = matchToSessionIndex.get(row.match_id);
          if (idx === undefined) continue;
          if (!sums.has(row.player_id)) sums.set(row.player_id, new Map());
          const bySession = sums.get(row.player_id)!;
          bySession.set(idx, (bySession.get(idx) ?? 0) + row.gross_score);
        }
      }
    }
  }

  const teamColorByTeamId = buildTeamColorMap(teams ?? []);

  const defendingChampPlayerId =
    (players ?? []).find((p) => p.defending_champ === true)?.id ?? null;

  const rows: IndividualScoreRow[] = (players ?? []).map((p) => {
    const bySession = sums.get(p.id);
    const sessionStrokes: (number | null)[] = [0, 1, 2].map((i) => {
      if (trackedSessionIds[i] == null) return null;
      const v = bySession?.get(i);
      if (v === undefined) return null;
      return v;
    });
    const parts = sessionStrokes.filter((s): s is number => s != null);
    const cumulative = parts.length === 0 ? null : parts.reduce((a, b) => a + b, 0);

    return {
      playerId: p.id,
      playerName: p.name,
      teamColor: teamColorByTeamId.get(p.team_id) ?? null,
      defendingChamp: p.defending_champ === true,
      sessionStrokes,
      cumulative,
    };
  });

  const sortedRows = sortIndividualRows(rows);

  return {
    columnLabels: [...TRACKED_SESSION_NAMES],
    saturdayFoursomeGroups: buildSaturdayAfternoonFoursomeGroups(
      sortedRows,
      defendingChampPlayerId
    ),
    noDefendingChampion: defendingChampPlayerId == null,
  };
}
