-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the papers table
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  arxiv_id text unique not null,
  title text not null,
  authors text[] default '{}'::text[],
  abstract text,
  content text, -- Full parsed content
  url text,
  embedding vector(768) -- Dimensionality for Google's text-embedding-004
);

-- Enable Row Level Security (RLS)
alter table public.papers enable row level security;

-- Create a policy that allows anyone to read papers (for now)
create policy "Allow public read access"
  on public.papers for select
  using (true);

-- Create a policy that allows the service role to insert/update
-- (Authenticated users or your backend agents)
create policy "Allow service role to manage papers"
  on public.papers for all
  using (auth.role() = 'service_role');
