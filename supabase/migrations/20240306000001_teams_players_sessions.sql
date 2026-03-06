-- Teams (Team Chubbs, Team McAvoy)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Players (8 per team)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_players_team ON players(team_id);

-- Sessions (Friday PM, Saturday AM, Saturday PM, Sunday AM)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  session_date DATE NOT NULL,
  counts_for_team_competition BOOLEAN NOT NULL DEFAULT true
);

-- Foursomes (one per group of 4 in a session)
CREATE TABLE IF NOT EXISTS foursomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label TEXT
);

CREATE INDEX idx_foursomes_session ON foursomes(session_id);
