/**
 * Unit tests for the Hybrid Indexer Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockChunkPaper = vi.fn();
const mockBulkIndexChunks = vi.fn();
const mockDeletePaperChunks = vi.fn();
const mockSetupIndices = vi.fn();
const mockGenerateEmbeddingsBatch = vi.fn();

vi.mock('./text-chunker.js', () => ({
    createTextChunker: () => ({
        chunkPaper: mockChunkPaper
    }),
    TextChunker: class { }
}));

vi.mock('../opensearch/index.js', () => ({
    createOpenSearchClient: () => ({
        bulkIndexChunks: mockBulkIndexChunks,
        deletePaperChunks: mockDeletePaperChunks,
        setupIndices: mockSetupIndices
    }),
    OpenSearchClient: class { }
}));

vi.mock('../embeddings.js', () => ({
    generateEmbeddingsBatch: (...args: any[]) => mockGenerateEmbeddingsBatch(...args)
}));

import { HybridIndexer, createHybridIndexer, PaperInput } from './hybrid-indexer.js';

describe('HybridIndexer', () => {
    const testPaper: PaperInput = {
        title: 'Attention Is All You Need',
        abstract: 'A new architecture based on attention mechanisms.',
        fullText: 'Full paper content here...',
        arxivId: '1706.03762',
        paperId: 'paper-123',
        categories: ['cs.AI', 'cs.LG'],
        publishedDate: '2017-06-12'
    };

    const mockChunks = [
        {
            text: 'Chunk 1 content',
            arxivId: '1706.03762',
            paperId: 'paper-123',
            metadata: {
                chunkIndex: 0,
                startChar: 0,
                endChar: 15,
                wordCount: 3,
                overlapWithPrevious: 0,
                overlapWithNext: 5
            }
        },
        {
            text: 'Chunk 2 content',
            arxivId: '1706.03762',
            paperId: 'paper-123',
            metadata: {
                chunkIndex: 1,
                startChar: 10,
                endChar: 25,
                wordCount: 3,
                overlapWithPrevious: 5,
                overlapWithNext: 0
            }
        }
    ];

    let indexer: HybridIndexer;

    beforeEach(() => {
        vi.clearAllMocks();
        indexer = new HybridIndexer();

        // Default mock implementations
        mockChunkPaper.mockReturnValue(mockChunks);
        mockGenerateEmbeddingsBatch.mockResolvedValue([
            [0.1, 0.2, 0.3],
            [0.4, 0.5, 0.6]
        ]);
        mockBulkIndexChunks.mockResolvedValue({ success: 2, failed: 0 });
        mockDeletePaperChunks.mockResolvedValue(true);
        mockSetupIndices.mockResolvedValue(undefined);
    });

    describe('indexPaper', () => {
        it('should successfully index a paper through the pipeline', async () => {
            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(true);
            expect(result.chunksCreated).toBe(2);
            expect(result.chunksIndexed).toBe(2);
            expect(result.errors).toHaveLength(0);
        });

        it('should call chunker with correct parameters', async () => {
            await indexer.indexPaper(testPaper);

            expect(mockChunkPaper).toHaveBeenCalledWith(
                testPaper.title,
                testPaper.abstract,
                testPaper.fullText,
                testPaper.arxivId,
                testPaper.paperId,
                testPaper.sections
            );
        });

        it('should call embedding generator with chunk texts', async () => {
            await indexer.indexPaper(testPaper);

            expect(mockGenerateEmbeddingsBatch).toHaveBeenCalledWith([
                'Chunk 1 content',
                'Chunk 2 content'
            ]);
        });

        it('should call bulk index with prepared chunk data', async () => {
            await indexer.indexPaper(testPaper);

            expect(mockBulkIndexChunks).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        chunkData: expect.objectContaining({
                            arxivId: '1706.03762',
                            title: testPaper.title
                        }),
                        embedding: [0.1, 0.2, 0.3]
                    })
                ])
            );
        });

        it('should handle chunking failure', async () => {
            mockChunkPaper.mockImplementation(() => {
                throw new Error('Chunking error');
            });

            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(false);
            expect(result.chunksCreated).toBe(0);
            expect(result.errors[0]).toContain('Chunking failed');
        });

        it('should handle empty chunks', async () => {
            mockChunkPaper.mockReturnValue([]);

            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(false);
            expect(result.errors[0]).toContain('No chunks created');
        });

        it('should handle embedding generation failure', async () => {
            mockGenerateEmbeddingsBatch.mockRejectedValue(new Error('API rate limit'));

            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(false);
            expect(result.chunksCreated).toBe(2);
            expect(result.chunksIndexed).toBe(0);
            expect(result.errors[0]).toContain('Embedding generation failed');
        });

        it('should handle bulk indexing failure', async () => {
            mockBulkIndexChunks.mockRejectedValue(new Error('OpenSearch error'));

            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(false);
            expect(result.chunksCreated).toBe(2);
            expect(result.chunksIndexed).toBe(0);
            expect(result.errors[0]).toContain('Bulk indexing failed');
        });

        it('should report partial failures', async () => {
            mockBulkIndexChunks.mockResolvedValue({ success: 1, failed: 1 });

            const result = await indexer.indexPaper(testPaper);

            expect(result.success).toBe(false);
            expect(result.chunksIndexed).toBe(1);
            expect(result.errors[0]).toContain('1 chunks failed to index');
        });
    });

    describe('reindexPaper', () => {
        it('should delete old chunks before reindexing', async () => {
            await indexer.reindexPaper(testPaper);

            expect(mockDeletePaperChunks).toHaveBeenCalledWith('1706.03762');
            expect(mockChunkPaper).toHaveBeenCalled();
        });

        it('should return indexing result', async () => {
            const result = await indexer.reindexPaper(testPaper);

            expect(result.success).toBe(true);
            expect(result.chunksIndexed).toBe(2);
        });
    });

    describe('deletePaper', () => {
        it('should call searchClient deletePaperChunks', async () => {
            const result = await indexer.deletePaper('1706.03762');

            expect(mockDeletePaperChunks).toHaveBeenCalledWith('1706.03762');
            expect(result).toBe(true);
        });
    });

    describe('setupIndex', () => {
        it('should call searchClient setupIndices', async () => {
            await indexer.setupIndex();

            expect(mockSetupIndices).toHaveBeenCalledWith(false);
        });

        it('should pass force parameter', async () => {
            await indexer.setupIndex(true);

            expect(mockSetupIndices).toHaveBeenCalledWith(true);
        });
    });

    describe('createHybridIndexer factory', () => {
        it('should create a HybridIndexer instance', () => {
            const indexer = createHybridIndexer();

            expect(indexer).toBeInstanceOf(HybridIndexer);
        });
    });
});
