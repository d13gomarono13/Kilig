-- 20260109_structured_testing_framework.sql

-- 1. Research Cycles (The "Week")
-- Defines the high-level goal for a period.
-- "Headache Saver": Store the week's config (e.g., 'model_version', 'temperature') here.
-- This lets you tweak the experiment for next week without redeploying code.
CREATE TABLE IF NOT EXISTS public.research_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    title TEXT NOT NULL,              -- e.g., "Week 4: Neuroscience Deep Dive"
    topic_domain TEXT NOT NULL,       -- e.g., "Neuroscience", "Astrophysics"
    
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'archived')),
    
    -- "Smart" Configuration:
    -- Store agent settings specific to this week here.
    -- e.g., { "scientist_model": "gemini-1.5-pro", "validation_strictness": "high" }
    configuration JSONB DEFAULT '{}'::jsonb,
    
    description TEXT
);

-- 2. Pipeline Runs (The "Paper")
-- One row per paper processed.
-- Links back to the cycle so you can see "All runs for Neuroscience week".
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    cycle_id UUID REFERENCES public.research_cycles(id) ON DELETE SET NULL,
    
    -- Input Identification
    source_url TEXT,                  -- URL of the paper being processed
    source_title TEXT,                -- Title of the paper
    
    -- Execution State
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Metrics
    total_duration_ms INTEGER,        -- How long the whole pipeline took
    total_cost_estimated NUMERIC,     -- Estimated API cost
    quality_score INTEGER,            -- 0-100 score from the Validator agent
    
    error_message TEXT,               -- Top-level error if the whole run crashed
    metadata JSONB DEFAULT '{}'::jsonb -- Any extra tags or flags
);

-- 3. Pipeline Steps (The "Agents")
-- Breakdown of what happened inside a run.
-- "Headache Saver": pinpoint exactly WHICH agent failed and WHY.
CREATE TABLE IF NOT EXISTS public.pipeline_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID REFERENCES public.pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    
    agent_name TEXT NOT NULL,         -- e.g., 'scientist', 'narrative_architect', 'visualizer'
    step_order INTEGER NOT NULL,      -- 1, 2, 3... to recreate the timeline
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- What went in and what came out (Summarized or Full)
    input_context JSONB,
    output_result JSONB,
    
    error_log TEXT
);

-- 4. Pipeline Artifacts (The "Outputs")
-- Clean storage for the files generated, separate from the logs.
CREATE TABLE IF NOT EXISTS public.pipeline_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    run_id UUID REFERENCES public.pipeline_runs(id) ON DELETE CASCADE NOT NULL,
    step_id UUID REFERENCES public.pipeline_steps(id) ON DELETE SET NULL, -- Which step created this?
    
    artifact_type TEXT NOT NULL,      -- e.g., 'analysis_report', 'script_json', 'storyboard_svg', 'final_comic'
    name TEXT NOT NULL,
    
    -- Storage
    storage_path TEXT,                -- Path in Supabase Storage or URL
    content_preview TEXT,             -- Short text preview if applicable
    file_metadata JSONB DEFAULT '{}'::jsonb -- Size, format, dimensions, etc.
);

-- Indexes for performance
CREATE INDEX idx_runs_cycle ON public.pipeline_runs(cycle_id);
CREATE INDEX idx_steps_run ON public.pipeline_steps(run_id);
CREATE INDEX idx_artifacts_run ON public.pipeline_artifacts(run_id);

-- "Smart" View: Weekly Summary
-- Gives you an instant dashboard of how the current week is going.
CREATE OR REPLACE VIEW public.weekly_performance_summary AS
SELECT 
    rc.title AS week_title,
    rc.topic_domain,
    rc.status AS week_status,
    COUNT(pr.id) AS total_papers,
    COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) AS success_count,
    COUNT(CASE WHEN pr.status = 'failed' THEN 1 END) AS failure_count,
    ROUND(AVG(pr.quality_score), 1) AS avg_quality_score,
    ROUND(AVG(pr.total_duration_ms) / 1000.0, 1) AS avg_duration_sec
FROM 
    public.research_cycles rc
LEFT JOIN 
    public.pipeline_runs pr ON rc.id = pr.cycle_id
GROUP BY 
    rc.id, rc.title, rc.topic_domain, rc.status;

-- Enable RLS (Defaulting to open for service role / authenticated ease, roughly matching your 'test_runs' pattern)
ALTER TABLE public.research_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_artifacts ENABLE ROW LEVEL SECURITY;

-- Simple policies (Adjust as needed for your specific Auth setup)
CREATE POLICY "Enable all access for authenticated users" ON public.research_cycles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.pipeline_runs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.pipeline_steps FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.pipeline_artifacts FOR ALL USING (auth.role() = 'authenticated');

-- Also allow service_role (CLI) full access
CREATE POLICY "Service role full access cycles" ON public.research_cycles FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access runs" ON public.pipeline_runs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access steps" ON public.pipeline_steps FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access artifacts" ON public.pipeline_artifacts FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Trigger to auto-update updated_at on pipeline_runs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pipeline_runs_updated_at
BEFORE UPDATE ON public.pipeline_runs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
