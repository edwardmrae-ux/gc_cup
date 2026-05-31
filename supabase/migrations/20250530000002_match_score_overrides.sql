ALTER TABLE matches
  ADD COLUMN team_a_score_override SMALLINT,
  ADD COLUMN team_b_score_override SMALLINT;

ALTER TABLE matches
  ADD CONSTRAINT matches_score_override_non_negative
  CHECK (
    (team_a_score_override IS NULL OR team_a_score_override >= 0)
    AND (team_b_score_override IS NULL OR team_b_score_override >= 0)
  );
