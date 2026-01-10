/**
 * Mock OpenSearch Client
 * 
 * A drop-in replacement for OpenSearchClient that returns pre-recorded search results.
 * Used in `mock` testing mode for CI/CD and unit tests.
 * 
 * Usage:
 *   import { MockOpenSearchClient } from './mock-opensearch.js';
 *   const client = new MockOpenSearchClient('./tests/golden/opensearch/kilig_papers_v1');
 */

import fs from 'fs';
import path from 'path';
import type { SearchResult, ChunkHit, ChunkData } from '../services/opensearch/client.js';

interface MockDocument {
    _id: string;
    _source: Record<string, any>;
}

export class MockOpenSearchClient {
    private documents: MockDocument[] = [];
    private indexName: string = 'mock-index';

    constructor(snapshotDir?: string) {
        if (snapshotDir && fs.existsSync(snapshotDir)) {
            const documentsPath = path.join(snapshotDir, 'documents.json');
            const metadataPath = path.join(snapshotDir, 'metadata.json');

            if (fs.existsSync(documentsPath)) {
                this.documents = JSON.parse(fs.readFileSync(documentsPath, 'utf-8'));
                console.log(`[MockOpenSearch] Loaded ${this.documents.length} documents from snapshot`);
            }

            if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                this.indexName = metadata.indexName;
            }
        }
    }

    async checkHealth(): Promise<boolean> {
        return true; // Always healthy in mock mode
    }

    async setupIndex(): Promise<void> {
        console.log('[MockOpenSearch] Setup index (no-op in mock mode)');
    }

    private toChunkHit(doc: MockDocument, score: number): ChunkHit {
        return {
            chunkId: doc._id,
            chunkText: doc._source.chunk_text || doc._source.content || '',
            title: doc._source.title || doc._source.paper_title || '',
            abstract: doc._source.abstract || '',
            arxivId: doc._source.arxiv_id || '',
            paperId: doc._source.paper_id || '',
            chunkIndex: doc._source.chunk_index || 0,
            sectionTitle: doc._source.section_title || doc._source.section_type,
            score: score,
            highlights: {}
        };
    }

    /**
     * Simulates hybrid search by filtering documents based on text matching.
     */
    async searchHybrid(
        queryText: string,
        _queryVector: number[],
        limit: number = 10
    ): Promise<SearchResult> {
        console.log(`[MockOpenSearch] Hybrid search: "${queryText.substring(0, 50)}..."`);

        const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        // Simple text matching simulation
        const scored = this.documents.map(doc => {
            const content = (doc._source.chunk_text || doc._source.content || '').toLowerCase();
            const title = (doc._source.title || doc._source.paper_title || '').toLowerCase();

            let score = 0;
            for (const term of queryTerms) {
                if (content.includes(term)) score += 1;
                if (title.includes(term)) score += 2;
            }

            return { doc, score };
        });

        // Sort by score and return top results
        const hits = scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => this.toChunkHit(s.doc, s.score / queryTerms.length));

        console.log(`[MockOpenSearch] Found ${hits.length} matching documents`);
        return { total: hits.length, hits };
    }

    /**
     * Simulates BM25 keyword search.
     */
    async searchBM25(
        queryText: string,
        limit: number = 10
    ): Promise<SearchResult> {
        return this.searchHybrid(queryText, [], limit);
    }

    /**
     * Simulates vector search (same as hybrid for mock).
     */
    async searchVector(
        _queryVector: number[],
        limit: number = 10
    ): Promise<SearchResult> {
        console.log('[MockOpenSearch] Vector search (returning random sample in mock mode)');

        const hits = this.documents
            .slice(0, limit)
            .map(doc => this.toChunkHit(doc, Math.random()));

        return { total: hits.length, hits };
    }

    async indexChunk(_chunk: ChunkData): Promise<string> {
        console.log('[MockOpenSearch] Index chunk (no-op in mock mode)');
        return 'mock-chunk-id';
    }

    async bulkIndexChunks(_chunks: ChunkData[]): Promise<number> {
        console.log('[MockOpenSearch] Bulk index (no-op in mock mode)');
        return _chunks.length;
    }

    async deleteChunksForPaper(_paperId: string): Promise<number> {
        console.log('[MockOpenSearch] Delete chunks (no-op in mock mode)');
        return 0;
    }

    async getChunksForPaper(paperId: string): Promise<ChunkHit[]> {
        return this.documents
            .filter(d => d._source.paper_id === paperId)
            .map(d => this.toChunkHit(d, 1.0));
    }
}

export default MockOpenSearchClient;
