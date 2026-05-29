-- App-wide settings (single row). Replaces active-session.json for serverless deploys.
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id, active_session_id)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;
