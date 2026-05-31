ALTER TABLE matches
  ADD COLUMN team_a_handicap SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN team_b_handicap SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE matches
  ADD CONSTRAINT matches_handicap_non_negative
  CHECK (team_a_handicap >= 0 AND team_b_handicap >= 0);
