-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store document chunks
create table if not exists document_chunks (
  id bigserial primary key,
  content text not null, -- The raw text content of the chunk
  metadata jsonb, -- Additional metadata (e.g., source paper, page number)
  embedding vector(768) -- Gemini 1.5/Text-embedding-004 uses 768 dimensions
);

-- Disable RLS for testing/simplicity
alter table document_chunks disable row level security;

-- Create a function to search for documents (RAW DISTANCE, NO FILTER)
-- CHANGED: Accepts 'text' for query_embedding to be compatible with supabase-js and casts to vector
create or replace function match_documents (
  query_embedding text, 
  match_threshold double precision,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity double precision
)
language plpgsql
security definer
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.metadata,
    (dc.embedding <=> query_embedding::vector) as similarity -- Raw distance (lower is better)
  from document_chunks dc
  order by dc.embedding <=> query_embedding::vector
  limit match_count;
end;
$$;

-- Simple Ping RPC for debugging
create or replace function ping_rpc(message text) 
returns text 
language plpgsql 
security definer
as $$
begin
  return 'Pong: ' || message;
end;
$$;

-- Create an index for faster similarity search
-- NOTE: IVFFlat index requires a sufficient number of rows to be effective. 
-- For small datasets (dev), it can cause empty results if lists are empty.
-- create index if not exists document_chunks_embedding_idx on document_chunks using ivfflat (embedding vector_cosine_ops)
-- with (lists = 100);
