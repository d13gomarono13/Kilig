/**
 * Hybrid Indexer Service
 * 
 * Orchestrates the chunking → embedding → indexing pipeline.
 */

import { TextChunker, createTextChunker, TextChunk, Section } from './text-chunker.js';
import { OpenSearchClient, createOpenSearchClient, ChunkData } from '../opensearch/index.js';
import { generateEmbeddingsBatch } from '../embeddings.js';
import { getLogger } from '../../utils/logger.js';

const log = getLogger('HybridIndexer');

export interface PaperInput {
    title: string;
    abstract: string;
    fullText: string;
    arxivId: string;
    paperId: string;
    sections?: Section[] | Record<string, string> | string;
    categories?: string[];
    publishedDate?: string;
    metadata?: Record<string, any>;
}

export interface IndexingResult {
    success: boolean;
    chunksCreated: number;
    chunksIndexed: number;
    errors: string[];
}

export class HybridIndexer {
    private chunker: TextChunker;
    private searchClient: OpenSearchClient;

    constructor(chunker?: TextChunker, searchClient?: OpenSearchClient) {
        this.chunker = chunker || createTextChunker();
        this.searchClient = searchClient || createOpenSearchClient();
    }

    /**
     * Index a paper: chunk → embed → store in OpenSearch
     */
    async indexPaper(paper: PaperInput): Promise<IndexingResult> {
        const errors: string[] = [];

        log.info('Starting indexing', { arxivId: paper.arxivId });

        // Step 1: Chunk the paper
        let chunks: TextChunk[];
        try {
            chunks = this.chunker.chunkPaper(
                paper.title,
                paper.abstract,
                paper.fullText,
                paper.arxivId,
                paper.paperId,
                paper.sections
            );
        } catch (error) {
            const msg = `Chunking failed: ${error}`;
            log.error('Chunking failed', error as Error);
            return { success: false, chunksCreated: 0, chunksIndexed: 0, errors: [msg] };
        }

        if (chunks.length === 0) {
            const msg = 'No chunks created from paper content';
            log.warn('No chunks created', { arxivId: paper.arxivId });
            return { success: false, chunksCreated: 0, chunksIndexed: 0, errors: [msg] };
        }

        log.info('Created chunks', { count: chunks.length });

        // Step 2: Generate embeddings
        let embeddings: number[][];
        try {
            const texts = chunks.map(c => c.text);
            embeddings = await generateEmbeddingsBatch(texts);
        } catch (error) {
            const msg = `Embedding generation failed: ${error}`;
            log.error('Embedding generation failed', error as Error);
            return { success: false, chunksCreated: chunks.length, chunksIndexed: 0, errors: [msg] };
        }

        log.info('Generated embeddings', { count: embeddings.length });

        // Step 3: Prepare chunk data
        const chunkDataList: Array<{ chunkData: ChunkData; embedding: number[] }> = chunks.map((chunk, i) => ({
            chunkData: {
                chunkText: chunk.text,
                title: paper.title,
                abstract: paper.abstract,
                arxivId: paper.arxivId,
                paperId: paper.paperId,
                chunkIndex: chunk.metadata.chunkIndex,
                sectionTitle: chunk.metadata.sectionTitle,
                categories: paper.categories,
                publishedDate: paper.publishedDate,
                wordCount: chunk.metadata.wordCount,
                metadata: {
                    ...paper.metadata,
                    startChar: chunk.metadata.startChar,
                    endChar: chunk.metadata.endChar,
                    overlapWithPrevious: chunk.metadata.overlapWithPrevious,
                    overlapWithNext: chunk.metadata.overlapWithNext,
                },
            },
            embedding: embeddings[i],
        }));

        // Step 4: Bulk index
        try {
            const result = await this.searchClient.bulkIndexChunks(chunkDataList);

            if (result.failed > 0) {
                errors.push(`${result.failed} chunks failed to index`);
            }

            log.info('Indexed chunks', { success: result.success, total: chunks.length, arxivId: paper.arxivId });

            return {
                success: result.failed === 0,
                chunksCreated: chunks.length,
                chunksIndexed: result.success,
                errors,
            };
        } catch (error) {
            const msg = `Bulk indexing failed: ${error}`;
            log.error('Bulk indexing failed', error as Error);
            return { success: false, chunksCreated: chunks.length, chunksIndexed: 0, errors: [msg] };
        }
    }

    /**
     * Re-index a paper (delete old chunks first)
     */
    async reindexPaper(paper: PaperInput): Promise<IndexingResult> {
        log.info('Re-indexing paper', { arxivId: paper.arxivId });

        // Delete existing chunks
        await this.searchClient.deletePaperChunks(paper.arxivId);

        // Index fresh
        return this.indexPaper(paper);
    }

    /**
     * Delete a paper's chunks from the index
     */
    async deletePaper(arxivId: string): Promise<boolean> {
        return this.searchClient.deletePaperChunks(arxivId);
    }

    /**
     * Setup the search index (call once)
     */
    async setupIndex(force: boolean = false): Promise<void> {
        await this.searchClient.setupIndices(force);
    }
}

// Factory function
export function createHybridIndexer(): HybridIndexer {
    return new HybridIndexer();
}
