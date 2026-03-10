export type MatchStatus = "not_started" | "in_progress" | "complete";
export type MatchType = "stableford_2v2" | "match_play_1v1";

export interface Team {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
}

export interface Session {
  id: string;
  name: string;
  session_date: string;
  counts_for_team_competition: boolean;
}

export interface Foursome {
  id: string;
  session_id: string;
  label: string | null;
  sort?: number | null;
}

export interface Match {
  id: string;
  foursome_id: string;
  holes: number;
  status: MatchStatus;
  match_type: MatchType;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  player_id: string;
  side: "team_a" | "team_b";
  pair_index: number | null;
}

export interface HoleScore {
  id: string;
  match_id: string;
  player_id: string;
  hole_number: number;
  gross_score: number;
}

export interface StablefordConfigRow {
  strokes_over_par: number;
  points: number;
}
