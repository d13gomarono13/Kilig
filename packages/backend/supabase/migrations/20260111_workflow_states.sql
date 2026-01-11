-- Create a table to store the state of agent workflows
CREATE TABLE IF NOT EXISTS workflow_states (
  session_id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step TEXT NOT NULL DEFAULT 'start',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user (e.g. "resume my last session")
CREATE INDEX IF NOT EXISTS idx_workflow_states_user_id ON workflow_states(user_id);

-- Optional: Add RLS policies if you want to restrict access per user
ALTER TABLE workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow states"
  ON workflow_states FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own workflow states"
  ON workflow_states FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own workflow states"
  ON workflow_states FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
