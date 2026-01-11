/**
 * Mem0-inspired Memory Service for Kilig Agents
 * 
 * Provides persistent memory storage using OpenSearch as vector store
 * and Gemini for embeddings. Enables:
 * - User preference storage
 * - Learning from validation feedback
 * - Semantic search over past interactions
 */

import { Client } from '@opensearch-project/opensearch';
import { settings } from '../../config/index.js';
import { generateEmbedding } from '../embeddings.js';

const INDEX_NAME = 'kilig-agent-memories';

export interface Memory {
    id: string;
    userId: string;
    content: string;
    metadata: Record<string, any>;
    timestamp: string;
    embedding?: number[];
}

export interface MemorySearchResult {
    memory: Memory;
    score: number;
}

// OpenSearch client (reuse existing connection logic)
const client = new Client({ node: settings.opensearch.host });

/**
 * Initialize the memories index if it doesn't exist
 */
async function ensureIndex(): Promise<void> {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (!exists.body) {
        await client.indices.create({
            index: INDEX_NAME,
            body: {
                settings: {
                    index: {
                        knn: true,
                        'knn.algo_param.ef_search': 100
                    }
                },
                mappings: {
                    properties: {
                        userId: { type: 'keyword' },
                        content: { type: 'text' },
                        metadata: { type: 'object', enabled: true },
                        timestamp: { type: 'date' },
                        embedding: {
                            type: 'knn_vector',
                            dimension: settings.opensearch.vectorDimension,
                            method: {
                                name: 'hnsw',
                                space_type: 'cosinesimil',
                                engine: 'nmslib',
                                parameters: { ef_construction: 128, m: 24 }
                            }
                        }
                    }
                }
            }
        });
        console.log(`[MemoryService] Created index: ${INDEX_NAME}`);
    }
}

export class MemoryService {
    private initialized = false;

    private async init() {
        if (!this.initialized) {
            await ensureIndex();
            this.initialized = true;
        }
    }

    /**
     * Add a new memory for a user
     */
    async addMemory(userId: string, content: string, metadata: Record<string, any> = {}): Promise<string> {
        await this.init();

        // Generate embedding for semantic search
        const embedding = await generateEmbedding(content);

        const memory: Memory = {
            id: crypto.randomUUID(),
            userId,
            content,
            metadata,
            timestamp: new Date().toISOString(),
            embedding
        };

        await client.index({
            index: INDEX_NAME,
            id: memory.id,
            body: memory,
            refresh: true
        });

        console.log(`[MemoryService] Added memory for user ${userId}: "${content.slice(0, 50)}..."`);
        return memory.id;
    }

    /**
     * Semantic search for relevant memories
     */
    async searchMemories(userId: string, query: string, limit: number = 5): Promise<MemorySearchResult[]> {
        await this.init();

        const queryEmbedding = await generateEmbedding(query);

        const response = await client.search({
            index: INDEX_NAME,
            body: {
                size: limit,
                query: {
                    bool: {
                        must: [
                            { term: { userId } }
                        ],
                        should: [
                            {
                                knn: {
                                    embedding: {
                                        vector: queryEmbedding,
                                        k: limit
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });

        return response.body.hits.hits.map((hit: any) => ({
            memory: {
                id: hit._id,
                userId: hit._source.userId,
                content: hit._source.content,
                metadata: hit._source.metadata,
                timestamp: hit._source.timestamp
            },
            score: hit._score
        }));
    }

    /**
     * Get all memories for a user (for debugging/admin)
     */
    async getAllMemories(userId: string): Promise<Memory[]> {
        await this.init();

        const response = await client.search({
            index: INDEX_NAME,
            body: {
                size: 100,
                query: { term: { userId } },
                sort: [{ timestamp: { order: 'desc' } }]
            }
        });

        return response.body.hits.hits.map((hit: any) => ({
            id: hit._id,
            userId: hit._source.userId,
            content: hit._source.content,
            metadata: hit._source.metadata,
            timestamp: hit._source.timestamp
        }));
    }

    /**
     * Delete a specific memory
     */
    async deleteMemory(memoryId: string): Promise<void> {
        await this.init();
        await client.delete({ index: INDEX_NAME, id: memoryId, refresh: true });
    }

    /**
     * Clear all memories for a user
     */
    async clearUserMemories(userId: string): Promise<number> {
        await this.init();

        const response = await client.deleteByQuery({
            index: INDEX_NAME,
            body: { query: { term: { userId } } },
            refresh: true
        });

        // OpenSearch types may not include 'deleted', but it's present in the response
        return (response.body as any).deleted || 0;
    }
}

// Singleton instance
export const memoryService = new MemoryService();
