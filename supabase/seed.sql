-- Seed teams (run after migrations)
INSERT INTO teams (name) VALUES
  ('Team Chubbs'),
  ('Team McAvoy')
ON CONFLICT (name) DO NOTHING;
