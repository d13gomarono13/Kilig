-- Optimization Migration (Phase 4)

-- 1. Enable pg_stat_statements for query monitoring (if not enabled)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 2. Indexes for Posts Table

-- B-Tree for common filtering and sorting
CREATE INDEX IF NOT EXISTS idx_posts_field ON public.posts (field);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts (user_id, created_at DESC);

-- GIN for Tags (Array)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- GIN for JSONB Manifest query (e.g. searching inside the comic structure)
CREATE INDEX IF NOT EXISTS idx_posts_manifest ON public.posts USING GIN (manifest_json);

-- 3. Indexes for Profiles Table
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 4. Indexes for Interactions
-- Composite index for quick lookup of "Did User X like Post Y?"
-- Note: Structure user_id, post_id, type implies this is covered by unique constraint (user_id, post_id, type), 
-- but unique constraint creates index. So we are good.
-- Maybe user_id lookup?
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_post ON public.interactions (post_id);

COMMENT ON INDEX idx_posts_field IS 'Accelerates filtering by scientific field';
COMMENT ON INDEX idx_posts_tags IS 'Accelerates tag-based search';
