/**
 * Unit tests for the Embeddings Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies before importing
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockGenerateKey = vi.fn().mockReturnValue('test-cache-key');
const mockEmbedContent = vi.fn();

vi.mock('./cache/index.js', () => ({
    CacheManager: {
        get: (...args: any[]) => mockCacheGet(...args),
        set: (...args: any[]) => mockCacheSet(...args),
        generateKey: (...args: any[]) => mockGenerateKey(...args)
    }
}));

vi.mock('@google/genai', () => {
    // Define mock class inside factory to avoid hoisting issues
    return {
        GoogleGenAI: class {
            models = {
                embedContent: (...args: any[]) => mockEmbedContent(...args)
            };
            constructor(_config: any) { }
        }
    };
});

// Set API key before importing
process.env.GEMINI_API_KEY = 'test-api-key';

import { generateEmbedding, generateEmbeddingsBatch } from './embeddings.js';

describe('Embeddings Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCacheGet.mockReset();
        mockCacheSet.mockReset();
        mockEmbedContent.mockReset();
    });

    describe('generateEmbedding', () => {
        it('should return cached embedding if available', async () => {
            const cachedEmbedding = Array.from({ length: 768 }, () => Math.random());
            mockCacheGet.mockResolvedValue(cachedEmbedding);

            const result = await generateEmbedding('test text');

            expect(result).toBe(cachedEmbedding);
            expect(mockCacheGet).toHaveBeenCalledWith('test-cache-key');
            expect(mockEmbedContent).not.toHaveBeenCalled();
        });

        it('should call API and cache result on cache miss', async () => {
            const apiEmbedding = Array.from({ length: 768 }, (_, i) => i * 0.001);
            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent.mockResolvedValue({
                embeddings: [{ values: apiEmbedding }]
            });

            const result = await generateEmbedding('new text');

            expect(result).toEqual(apiEmbedding);
            expect(mockCacheGet).toHaveBeenCalled();
            expect(mockEmbedContent).toHaveBeenCalledWith({
                model: 'text-embedding-004',
                contents: [{ parts: [{ text: 'new text' }] }]
            });
            expect(mockCacheSet).toHaveBeenCalledWith('test-cache-key', apiEmbedding);
        });

        it('should generate cache key with model and text', async () => {
            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent.mockResolvedValue({
                embeddings: [{ values: [0.1, 0.2] }]
            });

            await generateEmbedding('cache key test');

            expect(mockGenerateKey).toHaveBeenCalledWith(
                { model: 'text-embedding-004', text: 'cache key test' },
                'embeddings'
            );
        });

        it('should throw error if API returns no embedding', async () => {
            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent.mockResolvedValue({
                embeddings: []
            });

            await expect(generateEmbedding('empty response text')).rejects.toThrow(
                'No embedding returned from API'
            );
        });

        it('should throw error if API call fails', async () => {
            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent.mockRejectedValue(new Error('API Error'));

            await expect(generateEmbedding('error text')).rejects.toThrow('API Error');
        });
    });

    describe('generateEmbeddingsBatch', () => {
        it('should process multiple texts and return embeddings array', async () => {
            const embedding1 = [0.1, 0.2, 0.3];
            const embedding2 = [0.4, 0.5, 0.6];

            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent
                .mockResolvedValueOnce({ embeddings: [{ values: embedding1 }] })
                .mockResolvedValueOnce({ embeddings: [{ values: embedding2 }] });

            const result = await generateEmbeddingsBatch(['text1', 'text2']);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(embedding1);
            expect(result[1]).toEqual(embedding2);
        });

        it('should process in batches of 10', async () => {
            const texts = Array.from({ length: 25 }, (_, i) => `text-${i}`);

            mockCacheGet.mockResolvedValue(null);
            mockEmbedContent.mockResolvedValue({
                embeddings: [{ values: [0.1] }]
            });

            await generateEmbeddingsBatch(texts);

            // Should have processed all 25 texts
            expect(mockEmbedContent).toHaveBeenCalledTimes(25);
        });

        it('should use cache for available embeddings', async () => {
            const cachedEmbedding = [0.7, 0.8, 0.9];
            const apiEmbedding = [0.1, 0.2, 0.3];

            mockCacheGet
                .mockResolvedValueOnce(cachedEmbedding) // First text cached
                .mockResolvedValueOnce(null); // Second text not cached

            mockEmbedContent.mockResolvedValue({
                embeddings: [{ values: apiEmbedding }]
            });

            const result = await generateEmbeddingsBatch(['cached', 'new']);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(cachedEmbedding);
            expect(result[1]).toEqual(apiEmbedding);
            expect(mockEmbedContent).toHaveBeenCalledTimes(1); // Only for non-cached
        });

        it('should handle empty texts array', async () => {
            const result = await generateEmbeddingsBatch([]);

            expect(result).toHaveLength(0);
            expect(mockEmbedContent).not.toHaveBeenCalled();
        });
    });
});
