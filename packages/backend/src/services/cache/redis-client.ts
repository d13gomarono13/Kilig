/**
 * Redis Cache Client
 * 
 * Exact match query caching with TTL.
 * Ported from arxiv-paper-curator Python implementation.
 */

import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';
import { getSettings } from '../../config/index.js';
import type { RedisSettings } from '../../config/index.js';

export interface CacheableRequest {
    query: string;
    model?: string;
    topK?: number;
    useHybrid?: boolean;
    categories?: string[];
}

export interface CacheableResponse {
    query: string;
    answer: string;
    sources: any[];
    reasoningSteps?: string[];
    retrievalAttempts?: number;
    executionTime?: number;
    [key: string]: any;
}

export class RedisCacheClient {
    private client: RedisClientType | null = null;
    private settings: RedisSettings;
    private ttlSeconds: number;
    private isConnected: boolean = false;

    constructor(settings?: RedisSettings) {
        this.settings = settings || getSettings().redis;
        this.ttlSeconds = this.settings.ttlHours * 3600;
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<boolean> {
        if (!this.settings.enabled) {
            console.log('[RedisCache] Cache is disabled');
            return false;
        }

        try {
            const url = this.settings.password
                ? `redis://:${this.settings.password}@${this.settings.host}:${this.settings.port}/${this.settings.db}`
                : `redis://${this.settings.host}:${this.settings.port}/${this.settings.db}`;

            this.client = createClient({
                url,
                socket: {
                    connectTimeout: this.settings.socketConnectTimeout * 1000,
                },
            });

            this.client.on('error', (err) => {
                console.error('[RedisCache] Client error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('[RedisCache] Connected to Redis');
                this.isConnected = true;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            console.error('[RedisCache] Failed to connect:', error);
            return false;
        }
    }

    /**
     * Generate cache key from request parameters
     */
    private generateCacheKey(request: CacheableRequest): string {
        const keyData = {
            query: request.query,
            model: request.model || 'default',
            topK: request.topK || 5,
            useHybrid: request.useHybrid ?? true,
            categories: (request.categories || []).sort(),
        };

        const keyString = JSON.stringify(keyData);
        const hash = crypto.createHash('sha256').update(keyString).digest('hex').slice(0, 16);
        return `exact_cache:${hash}`;
    }

    /**
     * Find cached response for exact query match
     */
    async findCachedResponse(request: CacheableRequest): Promise<CacheableResponse | null> {
        if (!this.client || !this.isConnected) return null;

        try {
            const cacheKey = this.generateCacheKey(request);
            const cached = await this.client.get(cacheKey);

            if (cached) {
                console.log(`[RedisCache] Cache HIT for key ${cacheKey.slice(0, 20)}...`);
                return JSON.parse(cached) as CacheableResponse;
            }

            return null;
        } catch (error) {
            console.error('[RedisCache] Error checking cache:', error);
            return null;
        }
    }

    /**
     * Store response in cache
     */
    async storeResponse(request: CacheableRequest, response: CacheableResponse): Promise<boolean> {
        if (!this.client || !this.isConnected) return false;

        try {
            const cacheKey = this.generateCacheKey(request);
            await this.client.setEx(cacheKey, this.ttlSeconds, JSON.stringify(response));
            console.log(`[RedisCache] Stored response with key ${cacheKey.slice(0, 20)}... (TTL: ${this.settings.ttlHours}h)`);
            return true;
        } catch (error) {
            console.error('[RedisCache] Error storing in cache:', error);
            return false;
        }
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<boolean> {
        if (!this.client || !this.isConnected) return false;

        try {
            const keys = await this.client.keys('exact_cache:*');
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log(`[RedisCache] Cleared ${keys.length} cache entries`);
            }
            return true;
        } catch (error) {
            console.error('[RedisCache] Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ keys: number; memoryUsage: string } | null> {
        if (!this.client || !this.isConnected) return null;

        try {
            const keys = await this.client.keys('exact_cache:*');
            const info = await this.client.info('memory');
            const memoryMatch = info.match(/used_memory_human:(\S+)/);

            return {
                keys: keys.length,
                memoryUsage: memoryMatch ? memoryMatch[1] : 'unknown',
            };
        } catch (error) {
            console.error('[RedisCache] Error getting stats:', error);
            return null;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.isConnected = false;
            console.log('[RedisCache] Disconnected from Redis');
        }
    }
}

// Singleton instance
let _cacheClient: RedisCacheClient | null = null;

export function getCacheClient(): RedisCacheClient {
    if (!_cacheClient) {
        _cacheClient = new RedisCacheClient();
    }
    return _cacheClient;
}

export async function initializeCache(): Promise<boolean> {
    const client = getCacheClient();
    return client.connect();
}
