import { supabase } from '../../../utils/supabase.js';
import { generateEmbeddingsBatch } from '../../../services/embeddings.js';

interface IngestPaperArgs {
  content: string;
  metadata: Record<string, any>;
}

// Simple chunking configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function splitText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    
    if (end === text.length) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function ingestPaper({ content, metadata }: IngestPaperArgs) {
  console.log(`[Ingest] Starting ingestion for paper: ${metadata.title || 'Unknown'}`);
  
  // 1. Split text into chunks
  const chunks = splitText(content);
  console.log(`[Ingest] Split content into ${chunks.length} chunks.`);

  // 2. Generate embeddings
  console.log(`[Ingest] Generating embeddings...`);
  const embeddings = await generateEmbeddingsBatch(chunks);

  // 3. Prepare rows for Supabase
  const rows = chunks.map((chunk, i) => ({
    content: chunk,
    metadata: { ...metadata, chunk_index: i },
    embedding: embeddings[i]
  }));

  // 4. Insert into Supabase
  const { error } = await supabase.from('document_chunks').insert(rows);

  if (error) {
    console.error('[Ingest] Supabase insertion error:', error);
    throw new Error(`Failed to store chunks: ${error.message}`);
  }

  console.log(`[Ingest] Successfully ingested ${rows.length} chunks.`);
  return { success: true, chunks: rows.length };
}
