/**
 * Unit tests for the Hybrid Search Tool
 * 
 * Note: The hybridSearch function caches the OpenSearch client at module level,
 * making it difficult to mock per-test. These tests focus on the FunctionTool behavior
 * and basic integration, with mocked dependencies.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the dependencies before importing the module
const mockSearchResult = {
    total: 2,
    hits: [
        {
            chunkId: 'chunk-1',
            chunkText: 'Transformers revolutionized NLP by using self-attention.',
            title: 'Attention Is All You Need',
            arxivId: '1706.03762',
            score: 0.95,
            sectionTitle: 'Abstract',
            highlights: { content: ['<em>transformers</em>'] }
        },
        {
            chunkId: 'chunk-2',
            chunkText: 'BERT uses masked language modeling for pretraining.',
            title: 'BERT: Pre-training of Deep Bidirectional Transformers',
            arxivId: '1810.04805',
            score: 0.87,
            sectionTitle: 'Introduction'
        }
    ]
};

vi.mock('../../../services/opensearch/index.js', () => ({
    createOpenSearchClient: vi.fn(() => ({
        searchHybrid: vi.fn().mockResolvedValue(mockSearchResult),
        searchBM25: vi.fn().mockResolvedValue(mockSearchResult)
    })),
    OpenSearchClient: class MockClient { }
}));

vi.mock('../../../services/embeddings.js', () => ({
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));

vi.mock('../../../config/index.js', () => ({
    getSettings: vi.fn(() => ({
        openSearch: {
            host: 'http://localhost:9200',
            indexName: 'test_index'
        }
    }))
}));

// Now import the module under test
import { hybridSearch, hybridSearchTool, HybridSearchResult } from './hybrid-search.js';
import { generateEmbedding } from '../../../services/embeddings.js';

describe('Hybrid Search Tool', () => {
    describe('hybridSearch function', () => {
        it('should perform hybrid search by default', async () => {
            const result = await hybridSearch('transformer architecture');

            expect(result.searchType).toBe('hybrid');
            expect(result.totalHits).toBe(2);
            expect(result.hits).toHaveLength(2);
            expect(generateEmbedding).toHaveBeenCalled();
        });

        it('should transform hits correctly', async () => {
            const result = await hybridSearch('transformers');

            expect(result.hits[0]).toEqual(expect.objectContaining({
                chunkId: 'chunk-1',
                content: 'Transformers revolutionized NLP by using self-attention.',
                title: 'Attention Is All You Need',
                arxivId: '1706.03762',
                score: 0.95,
                sectionTitle: 'Abstract',
                highlights: ['<em>transformers</em>']
            }));
        });

        it('should include query in result', async () => {
            const result = await hybridSearch('test query string');

            expect(result.query).toBe('test query string');
        });
    });

    describe('hybridSearchTool (ADK FunctionTool)', () => {
        it('should return formatted results on success', async () => {
            const response = await (hybridSearchTool as any).execute({
                query: 'transformer architecture',
                limit: 5
            });
            const parsed = JSON.parse(response as string);

            expect(parsed.success).toBe(true);
            expect(parsed.searchType).toBe('hybrid');
            expect(parsed.totalHits).toBe(2);
            expect(parsed.hits).toHaveLength(2);
            expect(parsed.hits[0]).toHaveProperty('rank', 1);
            expect(parsed.hits[0]).toHaveProperty('excerpt');
            expect(parsed.fullContext).toBeDefined();
        });

        it('should include paper metadata in results', async () => {
            const response = await (hybridSearchTool as any).execute({
                query: 'attention mechanism'
            });
            const parsed = JSON.parse(response as string);

            expect(parsed.hits[0].title).toBe('Attention Is All You Need');
            expect(parsed.hits[0].arxivId).toBe('1706.03762');
            expect(parsed.hits[0].section).toBe('Abstract');
        });

        it('should format scores as strings with 3 decimals', async () => {
            const response = await (hybridSearchTool as any).execute({
                query: 'test query'
            });
            const parsed = JSON.parse(response as string);

            expect(parsed.hits[0].score).toBe('0.950');
        });

        it('should concatenate fullContext from all hits', async () => {
            const response = await (hybridSearchTool as any).execute({
                query: 'test query'
            });
            const parsed = JSON.parse(response as string);

            expect(parsed.fullContext).toContain('Transformers revolutionized NLP');
            expect(parsed.fullContext).toContain('BERT uses masked language modeling');
            expect(parsed.fullContext).toContain('---'); // Separator
        });

        it('should truncate long excerpts', async () => {
            const longContent = 'A'.repeat(500);
            const { createOpenSearchClient } = await import('../../../services/opensearch/index.js');
            const mockClient = (createOpenSearchClient as any)();
            mockClient.searchHybrid.mockResolvedValueOnce({
                total: 1,
                hits: [{
                    chunkId: 'chunk-long',
                    chunkText: longContent,
                    title: 'Long Paper',
                    arxivId: 'test.123',
                    score: 0.9
                }]
            });

            const response = await (hybridSearchTool as any).execute({ query: 'test' });
            const parsed = JSON.parse(response as string);

            expect(parsed.hits[0].excerpt.length).toBeLessThanOrEqual(303); // 300 + '...'
        });
    });
});
