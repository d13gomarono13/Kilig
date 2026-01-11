-- Create video_projects table for persisting agent artifacts
CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'researching',
  research_summary JSONB,
  script JSONB,
  scenegraph JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

-- Policies (Public for now, or auth restricted)
CREATE POLICY "Enable read access for all users" ON video_projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON video_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON video_projects FOR UPDATE USING (true);
