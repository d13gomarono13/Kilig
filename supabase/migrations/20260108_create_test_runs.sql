create table if not exists test_runs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  domain text not null default 'uncategorized',
  score integer default 0,
  passed integer default 0,
  failed integer default 0,
  report_json jsonb,
  artifacts jsonb
);

-- Enable RLS but allow public inserts for now (for simplicity in this dev environment)
-- In production, you'd restrict this to authenticated service roles.
alter table test_runs enable row level security;

create policy "Enable insert for all users" on test_runs for insert with check (true);
create policy "Enable read for all users" on test_runs for select using (true);
