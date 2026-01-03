import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

/**
 * Generates a vector embedding for the given text using Gemini 'text-embedding-004'.
 * Returns a 768-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    console.log(`[DEBUG] Generated embedding with dimension: ${embedding.values.length}`);
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generates embeddings for an array of texts in parallel (or batched if supported).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  // text-embedding-004 supports batching, but the JS SDK method embedContent is single.
  // There is batchEmbedContents, let's try to use that for efficiency.
  try {
     // NOTE: batchEmbedContents might have limits on request size. 
     // For simplicity and robustness, we map over them for now, 
     // but in production, you'd want to use batchEmbedContents properly.
    const promises = texts.map(t => generateEmbedding(t));
    return Promise.all(promises);
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}
