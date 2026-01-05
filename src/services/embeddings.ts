import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'text-embedding-004';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is not defined in environment variables');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generates a vector embedding for the given text using Gemini 'text-embedding-004'.
 * Returns a 768-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getClient();
    const result = await client.models.embedContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text }] }]
    });
    
    // Check if result.embeddings exists (plural for batch) or result.embedding
    const values = result.embeddings?.[0]?.values;
    
    if (!values) {
        throw new Error('No embedding returned from API');
    }

    console.log(`[DEBUG] Generated embedding with dimension: ${values.length}`);
    return values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generates embeddings for an array of texts with concurrency limiting.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 10; // Process 10 at a time
  const results: number[][] = [];
  
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[DEBUG] Processing embedding batch ${i / BATCH_SIZE + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`);
    const batchResults = await Promise.all(batch.map(t => generateEmbedding(t)));
    results.push(...batchResults);
  }
  
  return results;
}