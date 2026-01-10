/**
 * Unit tests for the OpenSearch Client
 * Uses comprehensive mocking to test all methods without a live OpenSearch server
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the OpenSearch client library
const mockSearch = vi.fn();
const mockIndex = vi.fn();
const mockBulk = vi.fn();
const mockDeleteByQuery = vi.fn();
const mockClose = vi.fn();
const mockClusterHealth = vi.fn();
const mockIndicesExists = vi.fn();
const mockIndicesCreate = vi.fn();
const mockIndicesDelete = vi.fn();
const mockIndicesStats = vi.fn();
const mockTransportRequest = vi.fn();

vi.mock('@opensearch-project/opensearch', () => {
    return {
        Client: class MockClient {
            search = mockSearch;
            index = mockIndex;
            bulk = mockBulk;
            deleteByQuery = mockDeleteByQuery;
            close = mockClose;
            cluster = { health: mockClusterHealth };
            indices = {
                exists: mockIndicesExists,
                create: mockIndicesCreate,
                delete: mockIndicesDelete,
                stats: mockIndicesStats
            };
            transport = { request: mockTransportRequest };
            constructor(_config: any) { }
        }
    };
});

// Mock config
vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        opensearch: {
            host: 'https://localhost:9200',
            indexName: 'kilig-papers',
            chunkIndexSuffix: 'chunks',
            vectorDimension: 768,
            rrfPipelineName: 'rrf-pipeline',
            hybridSearchSizeMultiplier: 3
        }
    })
}));

import { OpenSearchClient, createOpenSearchClient, ChunkData } from './client.js';

describe('OpenSearchClient', () => {
    let client: OpenSearchClient;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new OpenSearchClient();
    });

    describe('constructor', () => {
        it('should initialize the client', () => {
            expect(client).toBeDefined();
        });
    });

    // =========================================================================
    // Health & Stats
    // =========================================================================
    describe('healthCheck', () => {
        it('should return true for healthy cluster', async () => {
            mockClusterHealth.mockResolvedValue({ body: { status: 'green' } });

            const result = await client.healthCheck();

            expect(result).toBe(true);
        });

        it('should return true for yellow status', async () => {
            mockClusterHealth.mockResolvedValue({ body: { status: 'yellow' } });

            const result = await client.healthCheck();

            expect(result).toBe(true);
        });

        it('should return false for red status', async () => {
            mockClusterHealth.mockResolvedValue({ body: { status: 'red' } });

            const result = await client.healthCheck();

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            mockClusterHealth.mockRejectedValue(new Error('Connection failed'));

            const result = await client.healthCheck();

            expect(result).toBe(false);
        });
    });

    describe('getIndexStats', () => {
        it('should return stats for existing index', async () => {
            mockIndicesExists.mockResolvedValue({ body: true });
            mockIndicesStats.mockResolvedValue({
                body: {
                    indices: {
                        'kilig-papers-chunks': {
                            total: {
                                docs: { count: 1000 },
                                store: { size_in_bytes: 5000000 }
                            }
                        }
                    }
                }
            });

            const result = await client.getIndexStats();

            expect(result.exists).toBe(true);
            expect(result.documentCount).toBe(1000);
            expect(result.sizeInBytes).toBe(5000000);
        });

        it('should return exists=false for missing index', async () => {
            mockIndicesExists.mockResolvedValue({ body: false });

            const result = await client.getIndexStats();

            expect(result.exists).toBe(false);
            expect(result.documentCount).toBe(0);
        });

        it('should handle errors gracefully', async () => {
            mockIndicesExists.mockRejectedValue(new Error('Error'));

            const result = await client.getIndexStats();

            expect(result.exists).toBe(false);
        });
    });

    // =========================================================================
    // Index Setup
    // =========================================================================
    describe('setupIndices', () => {
        it('should create hybrid index and RRF pipeline', async () => {
            mockIndicesExists.mockResolvedValue({ body: false });
            mockIndicesCreate.mockResolvedValue({ body: { acknowledged: true } });

            // Mock transport.request to fail for GET (existence check) but succeed for others
            mockTransportRequest.mockImplementation(({ method }) => {
                if (method === 'GET') return Promise.reject(new Error('Not Found'));
                return Promise.resolve({ body: {} });
            });

            const result = await client.setupIndices();

            expect(result.hybridIndex).toBe(true);
            expect(result.rrfPipeline).toBe(true);
        });

        it('should not recreate existing index without force', async () => {
            mockIndicesExists.mockResolvedValue({ body: true });
            mockTransportRequest.mockResolvedValue({ body: {} });

            const result = await client.setupIndices(false);

            expect(result.hybridIndex).toBe(false);
            expect(mockIndicesCreate).not.toHaveBeenCalled();
        });

        it('should recreate index with force=true', async () => {
            mockIndicesExists.mockResolvedValue({ body: true });
            mockIndicesDelete.mockResolvedValue({ body: {} });
            mockIndicesCreate.mockResolvedValue({ body: { acknowledged: true } });
            mockTransportRequest.mockResolvedValue({ body: {} });

            const result = await client.setupIndices(true);

            expect(mockIndicesDelete).toHaveBeenCalled();
            expect(mockIndicesCreate).toHaveBeenCalled();
            expect(result.hybridIndex).toBe(true);
        });
    });

    // =========================================================================
    // Search Methods
    // =========================================================================
    describe('searchBM25', () => {
        const mockSearchResponse = {
            body: {
                hits: {
                    total: { value: 2 },
                    hits: [
                        {
                            _id: 'chunk1',
                            _score: 10.5,
                            _source: {
                                chunk_text: 'Attention is all you need',
                                title: 'Transformer Paper',
                                abstract: 'We propose a new architecture',
                                arxiv_id: '1706.03762',
                                paper_id: 'abc123',
                                chunk_index: 0,
                                section_title: 'Introduction'
                            }
                        },
                        {
                            _id: 'chunk2',
                            _score: 8.2,
                            _source: {
                                chunk_text: 'Self-attention mechanism explained',
                                title: 'Transformer Paper',
                                abstract: 'We propose a new architecture',
                                arxiv_id: '1706.03762',
                                paper_id: 'abc123',
                                chunk_index: 1,
                                section_title: 'Methods'
                            }
                        }
                    ]
                }
            }
        };

        it('should perform BM25 search and return results', async () => {
            mockSearch.mockResolvedValue(mockSearchResponse);

            const result = await client.searchBM25('transformer attention');

            expect(result.total).toBe(2);
            expect(result.hits).toHaveLength(2);
            expect(result.hits[0].chunkText).toBe('Attention is all you need');
        });

        it('should pass size parameter', async () => {
            mockSearch.mockResolvedValue({ body: { hits: { total: 0, hits: [] } } });

            await client.searchBM25('query', { size: 20 });

            expect(mockSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({ size: 20 })
                })
            );
        });

        it('should return empty result on error', async () => {
            mockSearch.mockRejectedValue(new Error('Search failed'));

            const result = await client.searchBM25('query');

            expect(result.total).toBe(0);
            expect(result.hits).toHaveLength(0);
        });
    });

    describe('searchVector', () => {
        it('should perform vector search', async () => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: 1,
                        hits: [{
                            _id: 'vec1',
                            _score: 0.95,
                            _source: {
                                chunk_text: 'Vector result',
                                title: 'Paper',
                                abstract: 'Abstract',
                                arxiv_id: '123',
                                paper_id: 'p1',
                                chunk_index: 0
                            }
                        }]
                    }
                }
            });

            const embedding = new Array(768).fill(0.1);
            const result = await client.searchVector(embedding);

            expect(result.total).toBe(1);
            expect(mockSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        query: expect.objectContaining({
                            knn: expect.anything()
                        })
                    })
                })
            );
        });

        it('should filter by categories', async () => {
            mockSearch.mockResolvedValue({
                body: { hits: { total: 0, hits: [] } }
            });

            const embedding = new Array(768).fill(0.1);
            await client.searchVector(embedding, { categories: ['cs.AI'] });

            expect(mockSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        query: expect.objectContaining({
                            bool: expect.anything()
                        })
                    })
                })
            );
        });

        it('should return empty result on error', async () => {
            mockSearch.mockRejectedValue(new Error('Vector search failed'));

            const result = await client.searchVector([0.1, 0.2]);

            expect(result.total).toBe(0);
        });
    });

    describe('searchHybrid', () => {
        it('should combine BM25 and vector search', async () => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 1 },
                        hits: [{
                            _id: 'hybrid1',
                            _score: 0.85,
                            _source: {
                                chunk_text: 'Hybrid result',
                                title: 'Paper',
                                abstract: 'Abstract',
                                arxiv_id: '123',
                                paper_id: 'p1',
                                chunk_index: 0
                            }
                        }]
                    }
                }
            });

            const embedding = new Array(768).fill(0.1);
            const result = await client.searchHybrid('query', embedding);

            expect(result.total).toBe(1);
        });

        it('should filter by minimum score', async () => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 2 },
                        hits: [
                            { _id: 'h1', _score: 0.9, _source: { chunk_text: 'High', title: '', abstract: '', arxiv_id: '', paper_id: '', chunk_index: 0 } },
                            { _id: 'h2', _score: 0.3, _source: { chunk_text: 'Low', title: '', abstract: '', arxiv_id: '', paper_id: '', chunk_index: 1 } }
                        ]
                    }
                }
            });

            const embedding = new Array(768).fill(0.1);
            const result = await client.searchHybrid('query', embedding, { minScore: 0.5 });

            expect(result.total).toBe(1);
            expect(result.hits[0].score).toBe(0.9);
        });

        it('should return empty on error', async () => {
            mockSearch.mockRejectedValue(new Error('Hybrid search failed'));

            const result = await client.searchHybrid('query', [0.1]);

            expect(result.total).toBe(0);
        });
    });

    describe('search (unified)', () => {
        it('should use BM25 when no embedding provided', async () => {
            mockSearch.mockResolvedValue({ body: { hits: { total: 0, hits: [] } } });

            await client.search('query');

            // Just verify it doesn't throw
            expect(mockSearch).toHaveBeenCalled();
        });

        it('should use hybrid when embedding provided', async () => {
            mockSearch.mockResolvedValue({ body: { hits: { total: 0, hits: [] } } });

            const embedding = new Array(768).fill(0.1);
            await client.search('query', embedding, { useHybrid: true });

            expect(mockSearch).toHaveBeenCalled();
        });

        it('should use BM25 when useHybrid is false', async () => {
            mockSearch.mockResolvedValue({ body: { hits: { total: 0, hits: [] } } });

            const embedding = new Array(768).fill(0.1);
            await client.search('query', embedding, { useHybrid: false });

            expect(mockSearch).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Indexing Methods
    // =========================================================================
    describe('indexChunk', () => {
        const chunkData: ChunkData = {
            chunkText: 'Test chunk content',
            title: 'Test Paper',
            abstract: 'Test abstract',
            arxivId: '2301.00001',
            paperId: 'paper-123',
            chunkIndex: 0,
            wordCount: 50
        };

        it('should index a chunk successfully', async () => {
            mockIndex.mockResolvedValue({ body: { result: 'created' } });

            const embedding = new Array(768).fill(0.1);
            const result = await client.indexChunk(chunkData, embedding);

            expect(result).toBe(true);
            expect(mockIndex).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        chunk_text: 'Test chunk content',
                        arxiv_id: '2301.00001'
                    })
                })
            );
        });

        it('should return true for updated result', async () => {
            mockIndex.mockResolvedValue({ body: { result: 'updated' } });

            const result = await client.indexChunk(chunkData, [0.1]);

            expect(result).toBe(true);
        });

        it('should return false on error', async () => {
            mockIndex.mockRejectedValue(new Error('Index failed'));

            const result = await client.indexChunk(chunkData, [0.1]);

            expect(result).toBe(false);
        });
    });

    describe('bulkIndexChunks', () => {
        const chunks = [
            {
                chunkData: { chunkText: 'Chunk 1', title: 'Paper', abstract: '', arxivId: '123', paperId: 'p1', chunkIndex: 0, wordCount: 10 },
                embedding: [0.1, 0.2]
            },
            {
                chunkData: { chunkText: 'Chunk 2', title: 'Paper', abstract: '', arxivId: '123', paperId: 'p1', chunkIndex: 1, wordCount: 10 },
                embedding: [0.3, 0.4]
            }
        ];

        it('should bulk index chunks successfully', async () => {
            mockBulk.mockResolvedValue({
                body: {
                    items: [
                        { index: { result: 'created' } },
                        { index: { result: 'created' } }
                    ]
                }
            });

            const result = await client.bulkIndexChunks(chunks);

            expect(result.success).toBe(2);
            expect(result.failed).toBe(0);
        });

        it('should report failed items', async () => {
            mockBulk.mockResolvedValue({
                body: {
                    items: [
                        { index: { result: 'created' } },
                        { index: { error: { reason: 'failed' } } }
                    ]
                }
            });

            const result = await client.bulkIndexChunks(chunks);

            expect(result.success).toBe(1);
            expect(result.failed).toBe(1);
        });

        it('should throw on bulk error', async () => {
            mockBulk.mockRejectedValue(new Error('Bulk failed'));

            await expect(client.bulkIndexChunks(chunks)).rejects.toThrow('Bulk failed');
        });
    });

    describe('deletePaperChunks', () => {
        it('should delete chunks for a paper', async () => {
            mockDeleteByQuery.mockResolvedValue({ body: { deleted: 5 } });

            const result = await client.deletePaperChunks('1706.03762');

            expect(result).toBe(true);
            expect(mockDeleteByQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: { query: { term: { arxiv_id: '1706.03762' } } }
                })
            );
        });

        it('should return false when nothing deleted', async () => {
            mockDeleteByQuery.mockResolvedValue({ body: { deleted: 0 } });

            const result = await client.deletePaperChunks('nonexistent');

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            mockDeleteByQuery.mockRejectedValue(new Error('Delete failed'));

            const result = await client.deletePaperChunks('123');

            expect(result).toBe(false);
        });
    });

    describe('getChunksByPaper', () => {
        it('should get all chunks for a paper', async () => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: 3,
                        hits: [
                            { _id: 'c1', _score: 1, _source: { chunk_text: 'Chunk 1', title: '', abstract: '', arxiv_id: '123', paper_id: '', chunk_index: 0 } },
                            { _id: 'c2', _score: 1, _source: { chunk_text: 'Chunk 2', title: '', abstract: '', arxiv_id: '123', paper_id: '', chunk_index: 1 } }
                        ]
                    }
                }
            });

            const result = await client.getChunksByPaper('123');

            expect(result).toHaveLength(2);
            expect(result[0].chunkText).toBe('Chunk 1');
        });

        it('should return empty array on error', async () => {
            mockSearch.mockRejectedValue(new Error('Search failed'));

            const result = await client.getChunksByPaper('123');

            expect(result).toHaveLength(0);
        });
    });

    describe('close', () => {
        it('should close the client connection', async () => {
            mockClose.mockResolvedValue(undefined);

            await client.close();

            expect(mockClose).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Factory Function
    // =========================================================================
    describe('createOpenSearchClient', () => {
        it('should create an OpenSearchClient instance', () => {
            const newClient = createOpenSearchClient();

            expect(newClient).toBeInstanceOf(OpenSearchClient);
        });

        it('should accept custom host', () => {
            const newClient = createOpenSearchClient('https://custom:9200');

            expect(newClient).toBeDefined();
        });
    });
});
