/**
 * OpenSearch Client for Kilig
 * 
 * Supports BM25 keyword search, vector search, and hybrid search with RRF fusion.
 * Ported from arxiv-paper-curator Python implementation.
 */

import { Client } from '@opensearch-project/opensearch';
import type { OpenSearchSettings } from '../../config/index.js';
import { getSettings } from '../../config/index.js';
import { QueryBuilder } from './query-builder.js';
import { ARXIV_PAPERS_CHUNKS_MAPPING, HYBRID_RRF_PIPELINE } from './index-config.js';

export interface SearchResult {
    total: number;
    hits: ChunkHit[];
}

export interface ChunkHit {
    chunkId: string;
    chunkText: string;
    title: string;
    abstract: string;
    arxivId: string;
    paperId: string;
    chunkIndex: number;
    sectionTitle?: string;
    score: number;
    highlights?: Record<string, string[]>;
    metadata?: Record<string, any>;
}

export interface ChunkData {
    chunkText: string;
    title: string;
    abstract: string;
    arxivId: string;
    paperId: string;
    chunkIndex: number;
    sectionTitle?: string;
    categories?: string[];
    publishedDate?: string;
    wordCount: number;
    metadata?: Record<string, any>;
}

export class OpenSearchClient {
    private client: Client;
    private settings: OpenSearchSettings;
    private indexName: string;

    constructor(host?: string, settings?: OpenSearchSettings) {
        const config = getSettings();
        this.settings = settings || config.opensearch;
        const hostUrl = host || this.settings.host;

        this.indexName = `${this.settings.indexName}-${this.settings.chunkIndexSuffix}`;

        this.client = new Client({
            node: hostUrl,
            ssl: { rejectUnauthorized: false },
        });

        console.log(`[OpenSearch] Client initialized with host: ${hostUrl}, index: ${this.indexName}`);
    }

    // ===========================================================================
    // Health & Stats
    // ===========================================================================

    async healthCheck(): Promise<boolean> {
        try {
            const health = await this.client.cluster.health({});
            return ['green', 'yellow'].includes(health.body.status);
        } catch (error) {
            console.error('[OpenSearch] Health check failed:', error);
            return false;
        }
    }

    async getIndexStats(): Promise<{
        indexName: string;
        exists: boolean;
        documentCount: number;
        sizeInBytes?: number;
    }> {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });
            if (!exists.body) {
                return { indexName: this.indexName, exists: false, documentCount: 0 };
            }

            const stats = await this.client.indices.stats({ index: this.indexName });
            const indexStats = (stats.body.indices as any)?.[this.indexName]?.total;

            return {
                indexName: this.indexName,
                exists: true,
                documentCount: indexStats?.docs?.count || 0,
                sizeInBytes: indexStats?.store?.size_in_bytes,
            };
        } catch (error) {
            console.error('[OpenSearch] Error getting index stats:', error);
            return { indexName: this.indexName, exists: false, documentCount: 0 };
        }
    }

    // ===========================================================================
    // Index Setup
    // ===========================================================================

    async setupIndices(force: boolean = false): Promise<{ hybridIndex: boolean; rrfPipeline: boolean }> {
        const hybridIndex = await this.createHybridIndex(force);
        const rrfPipeline = await this.createRrfPipeline(force);
        return { hybridIndex, rrfPipeline };
    }

    private async createHybridIndex(force: boolean = false): Promise<boolean> {
        try {
            const exists = await this.client.indices.exists({ index: this.indexName });

            if (force && exists.body) {
                await this.client.indices.delete({ index: this.indexName });
                console.log(`[OpenSearch] Deleted existing hybrid index: ${this.indexName}`);
            }

            if (!exists.body || force) {
                // Update vector dimension from settings
                const mapping = JSON.parse(JSON.stringify(ARXIV_PAPERS_CHUNKS_MAPPING));
                mapping.mappings.properties.embedding.dimension = this.settings.vectorDimension;

                await this.client.indices.create({
                    index: this.indexName,
                    body: mapping,
                });
                console.log(`[OpenSearch] Created hybrid index: ${this.indexName}`);
                return true;
            }

            console.log(`[OpenSearch] Hybrid index already exists: ${this.indexName}`);
            return false;
        } catch (error) {
            console.error('[OpenSearch] Error creating hybrid index:', error);
            throw error;
        }
    }

    private async createRrfPipeline(force: boolean = false): Promise<boolean> {
        try {
            const pipelineId = HYBRID_RRF_PIPELINE.id;

            if (force) {
                try {
                    await this.client.transport.request({
                        method: 'DELETE',
                        path: `/_search/pipeline/${pipelineId}`,
                    });
                    console.log(`[OpenSearch] Deleted existing RRF pipeline: ${pipelineId}`);
                } catch {
                    // Pipeline doesn't exist, ignore
                }
            }

            // Check if pipeline exists
            try {
                await this.client.transport.request({
                    method: 'GET',
                    path: `/_search/pipeline/${pipelineId}`,
                });
                console.log(`[OpenSearch] RRF pipeline already exists: ${pipelineId}`);
                return false;
            } catch {
                // Pipeline doesn't exist, create it
            }

            await this.client.transport.request({
                method: 'PUT',
                path: `/_search/pipeline/${pipelineId}`,
                body: {
                    description: HYBRID_RRF_PIPELINE.description,
                    phase_results_processors: HYBRID_RRF_PIPELINE.phaseResultsProcessors,
                },
            });

            console.log(`[OpenSearch] Created RRF search pipeline: ${pipelineId}`);
            return true;
        } catch (error) {
            console.error('[OpenSearch] Error creating RRF pipeline:', error);
            throw error;
        }
    }

    // ===========================================================================
    // Search Methods
    // ===========================================================================

    /**
     * BM25 keyword-only search
     */
    async searchBM25(
        query: string,
        options: {
            size?: number;
            from?: number;
            categories?: string[];
            latest?: boolean;
        } = {}
    ): Promise<SearchResult> {
        const { size = 10, from = 0, categories, latest = false } = options;

        const builder = new QueryBuilder({
            query,
            size,
            from,
            categories,
            latestPapers: latest,
            searchChunks: true,
        });

        const searchBody = builder.build();

        try {
            const response = await this.client.search({
                index: this.indexName,
                body: searchBody as any,
            });

            return this.parseSearchResponse(response.body);
        } catch (error) {
            console.error('[OpenSearch] BM25 search error:', error);
            return { total: 0, hits: [] };
        }
    }

    /**
     * Vector-only search
     */
    async searchVector(
        queryEmbedding: number[],
        options: {
            size?: number;
            categories?: string[];
        } = {}
    ): Promise<SearchResult> {
        const { size = 10, categories } = options;

        try {
            const searchBody: any = {
                size,
                query: {
                    knn: {
                        embedding: {
                            vector: queryEmbedding,
                            k: size,
                        },
                    },
                },
                _source: { excludes: ['embedding'] },
            };

            if (categories && categories.length > 0) {
                searchBody.query = {
                    bool: {
                        must: [searchBody.query],
                        filter: [{ terms: { categories } }],
                    },
                };
            }

            const response = await this.client.search({
                index: this.indexName,
                body: searchBody,
            });

            return this.parseSearchResponse(response.body);
        } catch (error) {
            console.error('[OpenSearch] Vector search error:', error);
            return { total: 0, hits: [] };
        }
    }

    /**
     * Hybrid search combining BM25 + vector with RRF fusion
     */
    async searchHybrid(
        query: string,
        queryEmbedding: number[],
        options: {
            size?: number;
            categories?: string[];
            minScore?: number;
        } = {}
    ): Promise<SearchResult> {
        const { size = 10, categories, minScore = 0.0 } = options;

        try {
            // Build BM25 query
            const builder = new QueryBuilder({
                query,
                size: size * this.settings.hybridSearchSizeMultiplier,
                from: 0,
                categories,
                latestPapers: false,
                searchChunks: true,
            });

            const bm25SearchBody = builder.build();
            const bm25Query = bm25SearchBody.query;

            // Hybrid query combining BM25 and vector
            const hybridQuery = {
                hybrid: {
                    queries: [
                        bm25Query,
                        {
                            knn: {
                                embedding: {
                                    vector: queryEmbedding,
                                    k: size * this.settings.hybridSearchSizeMultiplier,
                                },
                            },
                        },
                    ],
                },
            };

            const searchBody = {
                size,
                query: hybridQuery,
                _source: bm25SearchBody._source,
                highlight: bm25SearchBody.highlight,
            };

            const response = await this.client.search({
                index: this.indexName,
                body: searchBody as any,
                search_pipeline: this.settings.rrfPipelineName,
            } as any);

            const result = this.parseSearchResponse(response.body);

            // Filter by min score
            if (minScore > 0) {
                result.hits = result.hits.filter(hit => hit.score >= minScore);
                result.total = result.hits.length;
            }

            console.log(`[OpenSearch] Hybrid search for '${query.slice(0, 50)}...' returned ${result.total} results`);
            return result;
        } catch (error) {
            console.error('[OpenSearch] Hybrid search error:', error);
            return { total: 0, hits: [] };
        }
    }

    /**
     * Unified search method - uses hybrid if embedding provided, otherwise BM25
     */
    async search(
        query: string,
        queryEmbedding?: number[],
        options: {
            size?: number;
            from?: number;
            categories?: string[];
            latest?: boolean;
            useHybrid?: boolean;
            minScore?: number;
        } = {}
    ): Promise<SearchResult> {
        const { useHybrid = true } = options;

        if (!queryEmbedding || !useHybrid) {
            return this.searchBM25(query, options);
        }

        return this.searchHybrid(query, queryEmbedding, options);
    }

    // ===========================================================================
    // Indexing Methods
    // ===========================================================================

    /**
     * Index a single chunk with its embedding
     */
    async indexChunk(chunkData: ChunkData, embedding: number[]): Promise<boolean> {
        try {
            const document = {
                chunk_text: chunkData.chunkText,
                title: chunkData.title,
                abstract: chunkData.abstract,
                arxiv_id: chunkData.arxivId,
                paper_id: chunkData.paperId,
                chunk_index: chunkData.chunkIndex,
                section_title: chunkData.sectionTitle,
                categories: chunkData.categories,
                published_date: chunkData.publishedDate,
                word_count: chunkData.wordCount,
                embedding,
                metadata: chunkData.metadata,
            };

            const response = await this.client.index({
                index: this.indexName,
                body: document,
                refresh: true,
            });

            return ['created', 'updated'].includes(response.body.result);
        } catch (error) {
            console.error('[OpenSearch] Error indexing chunk:', error);
            return false;
        }
    }

    /**
     * Bulk index multiple chunks with embeddings
     */
    async bulkIndexChunks(
        chunks: Array<{ chunkData: ChunkData; embedding: number[] }>
    ): Promise<{ success: number; failed: number }> {
        try {
            const operations = chunks.flatMap(({ chunkData, embedding }) => [
                { index: { _index: this.indexName } },
                {
                    chunk_text: chunkData.chunkText,
                    title: chunkData.title,
                    abstract: chunkData.abstract,
                    arxiv_id: chunkData.arxivId,
                    paper_id: chunkData.paperId,
                    chunk_index: chunkData.chunkIndex,
                    section_title: chunkData.sectionTitle,
                    categories: chunkData.categories,
                    published_date: chunkData.publishedDate,
                    word_count: chunkData.wordCount,
                    embedding,
                    metadata: chunkData.metadata,
                },
            ]);

            const response = await this.client.bulk({
                body: operations,
                refresh: true,
            });

            const failed = response.body.items.filter((item: any) => item.index?.error).length;
            const success = chunks.length - failed;

            console.log(`[OpenSearch] Bulk indexed ${success} chunks, ${failed} failed`);
            return { success, failed };
        } catch (error) {
            console.error('[OpenSearch] Bulk indexing error:', error);
            throw error;
        }
    }

    /**
     * Delete all chunks for a specific paper
     */
    async deletePaperChunks(arxivId: string): Promise<boolean> {
        try {
            const response = await this.client.deleteByQuery({
                index: this.indexName,
                body: {
                    query: { term: { arxiv_id: arxivId } },
                },
                refresh: true,
            });

            const deleted = (response.body as any)?.deleted || 0;
            console.log(`[OpenSearch] Deleted ${deleted} chunks for paper ${arxivId}`);
            return deleted > 0;
        } catch (error) {
            console.error('[OpenSearch] Error deleting chunks:', error);
            return false;
        }
    }

    /**
     * Get all chunks for a specific paper
     */
    async getChunksByPaper(arxivId: string): Promise<ChunkHit[]> {
        try {
            const response = await this.client.search({
                index: this.indexName,
                body: {
                    query: { term: { arxiv_id: arxivId } },
                    size: 1000,
                    sort: [{ chunk_index: 'asc' }],
                    _source: { excludes: ['embedding'] },
                },
            });

            return this.parseSearchResponse(response.body).hits;
        } catch (error) {
            console.error('[OpenSearch] Error getting chunks:', error);
            return [];
        }
    }

    // ===========================================================================
    // Helpers
    // ===========================================================================

    private parseSearchResponse(response: any): SearchResult {
        const hits: ChunkHit[] = response.hits.hits.map((hit: any) => ({
            chunkId: hit._id,
            chunkText: hit._source.chunk_text,
            title: hit._source.title,
            abstract: hit._source.abstract,
            arxivId: hit._source.arxiv_id,
            paperId: hit._source.paper_id,
            chunkIndex: hit._source.chunk_index,
            sectionTitle: hit._source.section_title,
            score: hit._score,
            highlights: hit.highlight,
            metadata: hit._source.metadata,
        }));

        return {
            total: response.hits.total?.value || response.hits.total || hits.length,
            hits,
        };
    }

    /**
     * Close the client connection
     */
    async close(): Promise<void> {
        await this.client.close();
    }
}

// Factory function
export function createOpenSearchClient(host?: string): OpenSearchClient {
    return new OpenSearchClient(host);
}
