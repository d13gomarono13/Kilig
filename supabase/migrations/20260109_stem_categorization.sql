-- 20260109_stem_categorization.sql

-- 1. Add explicit 'domain' column to pipeline_runs
-- This allows granular filtering per test, regardless of the weekly cycle.
ALTER TABLE public.pipeline_runs 
ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'General';

-- 2. Create a "STEM Leaderboard" View
-- This gives you the "Comprehensible" high-level overview you asked for.
-- It groups all your runs by Domain and shows success rates and average quality.
CREATE OR REPLACE VIEW public.stem_leaderboard AS
SELECT 
    domain,
    COUNT(id) AS total_runs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS successful_runs,
    ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / COUNT(id)::numeric) * 100, 1) AS success_rate_pct,
    ROUND(AVG(quality_score), 1) AS avg_quality_score,
    ROUND(AVG(total_duration_ms) / 1000.0, 1) AS avg_duration_sec,
    MAX(created_at) as last_test_date
FROM 
    public.pipeline_runs
GROUP BY 
    domain
ORDER BY 
    avg_quality_score DESC;

-- 3. Grant permissions for the new view
GRANT SELECT ON public.stem_leaderboard TO authenticated;
GRANT SELECT ON public.stem_leaderboard TO service_role;
