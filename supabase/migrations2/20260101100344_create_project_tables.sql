-- Create a projects table to group all related data
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  name text not null,
  status text default 'pending' not null,
  metadata jsonb default '{}'::jsonb
);

-- Table for detailed paper analyses
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  project_id uuid references public.projects(id) on delete cascade,
  paper_id uuid references public.papers(id) on delete set null,
  summary text,
  key_findings jsonb default '[]'::jsonb,
  raw_analysis jsonb -- Complete output from the Scientist Agent
);

-- Table for video scripts and SceneGraphs
create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  project_id uuid references public.projects(id) on delete cascade,
  script_content text, -- The spoken narrative
  scenegraph jsonb not null, -- JSON for Revideo
  version int default 1
);

-- Table for tracking final video exports
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  project_id uuid references public.projects(id) on delete cascade,
  video_url text,
  thumbnail_url text,
  status text default 'processing' not null,
  storage_path text
);

-- Enable RLS on all new tables
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.scripts enable row level security;
alter table public.videos enable row level security;

-- Public read access policies
create policy "Allow public read projects" on public.projects for select using (true);
create policy "Allow public read analyses" on public.analyses for select using (true);
create policy "Allow public read scripts" on public.scripts for select using (true);
create policy "Allow public read videos" on public.videos for select using (true);

-- Service role management policies
create policy "Allow service role to manage projects" on public.projects for all using (auth.role() = 'service_role');
create policy "Allow service role to manage analyses" on public.analyses for all using (auth.role() = 'service_role');
create policy "Allow service role to manage scripts" on public.scripts for all using (auth.role() = 'service_role');
create policy "Allow service role to manage videos" on public.videos for all using (auth.role() = 'service_role');
