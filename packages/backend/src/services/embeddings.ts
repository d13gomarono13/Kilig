import { GoogleGenAI } from '@google/genai';
import { CacheManager } from './cache/index.js';
import { getLogger } from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';

const MODEL_NAME = 'text-embedding-004';
const log = getLogger('Embeddings');

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw AppError.internal('EMBEDDING_FAILED', 'GEMINI_API_KEY or GOOGLE_API_KEY is not defined');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Retry a function with exponential backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 500,
        maxDelay
      );

      log.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error instanceof Error ? error.message : String(error)
      });

      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw AppError.internal('EMBEDDING_FAILED', 'Retry exhausted');
}

/**
 * Check if an error is retryable (rate limits, network issues).
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('network')
    );
  }
  return false;
}

/**
 * Generates a vector embedding for the given text using Gemini 'text-embedding-004'.
 * Returns a 768-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = CacheManager.generateKey({ model: MODEL_NAME, text }, 'embeddings');

  // Check Cache
  const cached = await CacheManager.get<number[]>(cacheKey);
  if (cached) {
    return cached;
  }

  return withRetry(async () => {
    const client = getClient();
    const result = await client.models.embedContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text }] }]
    });

    const values = result.embeddings?.[0]?.values;

    if (!values) {
      throw AppError.internal('EMBEDDING_FAILED', 'No embedding returned from API');
    }

    // Save to Cache
    await CacheManager.set(cacheKey, values);

    return values;
  });
}

/**
 * Generates embeddings for an array of texts with concurrency limiting and retry.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 10;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(t => generateEmbedding(t)));
    results.push(...batchResults);
  }

  return results;
}