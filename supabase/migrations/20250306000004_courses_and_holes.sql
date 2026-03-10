-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT
);

-- Per-hole data for each course
CREATE TABLE IF NOT EXISTS course_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  yardage SMALLINT NOT NULL CHECK (yardage > 0),
  par SMALLINT NOT NULL CHECK (par BETWEEN 3 AND 6)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_holes_course_hole
  ON course_holes(course_id, hole_number);

CREATE INDEX IF NOT EXISTS idx_course_holes_course
  ON course_holes(course_id);

-- Link sessions to a course
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

CREATE INDEX IF NOT EXISTS idx_sessions_course
  ON sessions(course_id);

