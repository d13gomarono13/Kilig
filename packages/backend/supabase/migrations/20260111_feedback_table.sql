-- Feedback table for RAG improvement
-- Stores user feedback on document relevance for query-document pairs

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  query_hash TEXT NOT NULL, -- Normalized hash for faster lookups
  document_id TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('positive', 'negative')) NOT NULL,
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by query hash
CREATE INDEX IF NOT EXISTS idx_feedback_query_hash ON feedback(query_hash);

-- Index for document-level aggregation
CREATE INDEX IF NOT EXISTS idx_feedback_document ON feedback(document_id);

-- Composite index for query+document pairs
CREATE INDEX IF NOT EXISTS idx_feedback_query_doc ON feedback(query_hash, document_id);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow all inserts (public feedback)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Only admins can read feedback (for analytics)
CREATE POLICY "Admins can read feedback"
  ON feedback FOR SELECT
  USING (auth.role() = 'service_role');
