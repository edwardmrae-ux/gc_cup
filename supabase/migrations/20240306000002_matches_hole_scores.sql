-- Matches (2v2 Stableford or 1v1 match play)
CREATE TYPE match_status AS ENUM ('not_started', 'in_progress', 'complete');
CREATE TYPE match_type_enum AS ENUM ('stableford_2v2', 'match_play_1v1');

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foursome_id UUID NOT NULL REFERENCES foursomes(id) ON DELETE CASCADE,
  holes SMALLINT NOT NULL CHECK (holes IN (9, 18)),
  status match_status NOT NULL DEFAULT 'not_started',
  match_type match_type_enum NOT NULL
);

CREATE INDEX idx_matches_foursome ON matches(foursome_id);

-- Match players (team_a vs team_b; pair_index 0,1 for 2v2)
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('team_a', 'team_b')),
  pair_index SMALLINT
);

CREATE UNIQUE INDEX idx_match_players_unique ON match_players(match_id, player_id);
CREATE INDEX idx_match_players_match ON match_players(match_id);

-- Hole scores (gross strokes per hole)
CREATE TABLE IF NOT EXISTS hole_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  gross_score SMALLINT NOT NULL CHECK (gross_score >= 1 AND gross_score <= 15),
  UNIQUE(match_id, player_id, hole_number)
);

CREATE INDEX idx_hole_scores_match ON hole_scores(match_id);
