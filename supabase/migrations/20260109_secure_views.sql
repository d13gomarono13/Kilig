-- 20260109_secure_views.sql

-- -----------------------------------------------------------------------------
-- 1. Secure 'weekly_performance_summary'
-- -----------------------------------------------------------------------------

-- A. Lock the door: Remove access from the "Public" (anon) internet users.
REVOKE ALL ON public.weekly_performance_summary FROM anon;
REVOKE ALL ON public.weekly_performance_summary FROM public;

-- B. Give keys to authorized users only:
-- 'authenticated': Users who are logged in (You).
-- 'service_role': Your testing scripts (The automated system).
GRANT SELECT ON public.weekly_performance_summary TO authenticated;
GRANT SELECT ON public.weekly_performance_summary TO service_role;

-- C. Enforce Row Level Security (The "Security Invoker" Fix):
-- This makes the View respect the policies of the tables underneath.
-- It ensures no one sees data they aren't allowed to see.
ALTER VIEW public.weekly_performance_summary SET (security_invoker = true);


-- -----------------------------------------------------------------------------
-- 2. Secure 'stem_leaderboard'
-- -----------------------------------------------------------------------------

-- A. Lock the door
REVOKE ALL ON public.stem_leaderboard FROM anon;
REVOKE ALL ON public.stem_leaderboard FROM public;

-- B. Give keys
GRANT SELECT ON public.stem_leaderboard TO authenticated;
GRANT SELECT ON public.stem_leaderboard TO service_role;

-- C. Enforce RLS
ALTER VIEW public.stem_leaderboard SET (security_invoker = true);
