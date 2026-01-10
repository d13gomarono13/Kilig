/**
 * Hybrid Search Tool for Agentic RAG
 * 
 * Unified search combining BM25 keyword search and vector semantic search.
 * Replaces the old search_knowledge_base tool.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { createOpenSearchClient, OpenSearchClient, SearchResult, ChunkHit } from '../../../services/opensearch/index.js';
import { generateEmbedding } from '../../../services/embeddings.js';
import { getSettings } from '../../../config/index.js';

let searchClient: OpenSearchClient | null = null;

function getSearchClient(): OpenSearchClient {
    if (!searchClient) {
        searchClient = createOpenSearchClient();
    }
    return searchClient;
}

export interface HybridSearchResult {
    query: string;
    totalHits: number;
    hits: Array<{
        chunkId: string;
        content: string;
        title: string;
        arxivId: string;
        score: number;
        sectionTitle?: string;
        highlights?: string[];
    }>;
    searchType: 'hybrid' | 'bm25' | 'vector';
}

/**
 * Perform hybrid search combining BM25 and vector similarity
 */
export async function hybridSearch(
    query: string,
    options: {
        limit?: number;
        useHybrid?: boolean;
        categories?: string[];
        minScore?: number;
    } = {}
): Promise<HybridSearchResult> {
    const { limit = 5, useHybrid = true, categories, minScore = 0.0 } = options;
    const settings = getSettings();

    console.log(`[HybridSearch] Searching: "${query.slice(0, 50)}..." (hybrid=${useHybrid})`);

    const client = getSearchClient();

    try {
        let result: SearchResult;
        let searchType: 'hybrid' | 'bm25' | 'vector';

        if (useHybrid) {
            // Generate query embedding for hybrid search
            const queryEmbedding = await generateEmbedding(query);

            result = await client.searchHybrid(query, queryEmbedding, {
                size: limit,
                categories,
                minScore,
            });
            searchType = 'hybrid';
        } else {
            // BM25-only search
            result = await client.searchBM25(query, {
                size: limit,
                categories,
            });
            searchType = 'bm25';
        }

        console.log(`[HybridSearch] Found ${result.total} results`);

        return {
            query,
            totalHits: result.total,
            hits: result.hits.map(hit => ({
                chunkId: hit.chunkId,
                content: hit.chunkText,
                title: hit.title,
                arxivId: hit.arxivId,
                score: hit.score,
                sectionTitle: hit.sectionTitle,
                highlights: hit.highlights ? Object.values(hit.highlights).flat() : undefined,
            })),
            searchType,
        };
    } catch (error) {
        console.error('[HybridSearch] Search failed:', error);
        return {
            query,
            totalHits: 0,
            hits: [],
            searchType: 'hybrid',
        };
    }
}

/**
 * Hybrid Search Tool for ADK Agent
 */
export const hybridSearchTool = new FunctionTool({
    name: 'search_papers',
    description: 'Searches the academic paper knowledge base using hybrid search (keyword + semantic). Returns relevant paper chunks with scores and highlights.',
    parameters: z.object({
        query: z.string().describe('The search query (natural language question or keywords)'),
        limit: z.number().optional().describe('Maximum number of results to return (default: 5)'),
        useHybrid: z.boolean().optional().describe('Use hybrid search combining BM25 + vector (default: true)'),
        categories: z.array(z.string()).optional().describe('Filter by arXiv categories (e.g., ["cs.AI", "cs.LG"])'),
    }),
    execute: async ({ query, limit = 5, useHybrid = true, categories }) => {
        console.log(`[HybridSearchTool] Query: "${query.slice(0, 50)}..."`);

        try {
            const result = await hybridSearch(query, { limit, useHybrid, categories });

            if (result.totalHits === 0) {
                return JSON.stringify({
                    success: true,
                    query,
                    message: 'No results found. Consider rewriting the query.',
                    totalHits: 0,
                    hits: [],
                });
            }

            // Format results for agent consumption
            const formattedHits = result.hits.map((hit, i) => ({
                rank: i + 1,
                title: hit.title,
                arxivId: hit.arxivId,
                score: hit.score.toFixed(3),
                section: hit.sectionTitle || 'Unknown',
                excerpt: hit.content.slice(0, 300) + (hit.content.length > 300 ? '...' : ''),
                highlights: hit.highlights?.slice(0, 2),
            }));

            return JSON.stringify({
                success: true,
                query,
                searchType: result.searchType,
                totalHits: result.totalHits,
                hits: formattedHits,
                // Also include full content for context
                fullContext: result.hits.map(h => h.content).join('\n\n---\n\n'),
            });
        } catch (error) {
            console.error('[HybridSearchTool] Error:', error);
            return JSON.stringify({
                success: false,
                query,
                error: String(error),
                message: 'Search failed. Please try again.',
            });
        }
    },
});
