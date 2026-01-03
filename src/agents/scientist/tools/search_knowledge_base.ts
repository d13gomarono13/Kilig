import { supabase } from '../../../utils/supabase.js';
import { generateEmbedding } from '../../../services/embeddings.js';

interface SearchArgs {
  query: string;
  limit?: number; // default 5
  threshold?: number; // default 0.7
}

export async function searchKnowledgeBase({ query, limit = 5, threshold = 0.5 }: SearchArgs) {
  console.log(`[Search] Querying knowledge base for: "${query}"`);

  // 1. Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  console.log(`[Search] Embedding generated. Length: ${queryEmbedding.length}, Type: ${typeof queryEmbedding}, FirstVal: ${queryEmbedding[0]}`);
  console.log(`[Search] RPC Params -> Threshold: ${threshold}, Limit: ${limit}`);

  // 2. Call Supabase RPC
  // Note: match_documents accepts 'text' for query_embedding to avoid vector type issues with supabase-js
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: threshold,
    match_count: limit
  });

  if (error) {
    console.error('[Search] Supabase search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  console.log(`[Search] Found ${documents?.length || 0} matches.`);
  
  // 3. Format results
  return documents?.map((doc: any) => ({
    content: doc.content,
    metadata: doc.metadata,
    similarity: doc.similarity
  })) || [];
}
