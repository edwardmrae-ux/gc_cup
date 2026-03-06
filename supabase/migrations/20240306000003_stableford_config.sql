-- Stableford point mapping (customize values as needed)
-- score_type: relative to par (e.g. +2 = double bogey, +1 = bogey, 0 = par, -1 = birdie, -2 = eagle)
CREATE TABLE IF NOT EXISTS stableford_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strokes_over_par SMALLINT NOT NULL UNIQUE,
  points SMALLINT NOT NULL
);

-- Default: 0 = double+, 1 = bogey, 2 = par, 3 = birdie, 4 = eagle, 5 = albatross
INSERT INTO stableford_config (strokes_over_par, points) VALUES
  (2, 0),
  (1, 1),
  (0, 2),
  (-1, 3),
  (-2, 4),
  (-3, 5)
ON CONFLICT (strokes_over_par) DO NOTHING;
