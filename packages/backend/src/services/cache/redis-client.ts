import crypto from 'crypto';
import { getSettings } from '../../config/index.js';
import type { RedisSettings } from '../../config/index.js';
import { getCacheManager, CacheManager } from './cache-manager.js';

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
    private cacheManager: CacheManager;
    private settings: RedisSettings;
    private ttlSeconds: number;

    constructor(settings?: RedisSettings) {
        this.settings = settings || getSettings().redis;
        this.ttlSeconds = this.settings.ttlHours * 3600;
        this.cacheManager = getCacheManager();
    }

    /**
     * Connect to Cache (Delegate to manager)
     */
    async connect(): Promise<boolean> {
        // CacheManager connection is lazy/automatic, but we can verify here if needed
        return this.settings.enabled;
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
        if (!this.settings.enabled) return null;

        try {
            const cacheKey = this.generateCacheKey(request);
            const cached = await this.cacheManager.get<CacheableResponse>(cacheKey);

            if (cached) {
                console.log(`[QueryCache] Cache HIT for key ${cacheKey.slice(0, 20)}...`);
                return cached;
            }

            return null;
        } catch (error) {
            console.error('[QueryCache] Error checking cache:', error);
            return null;
        }
    }

    /**
     * Store response in cache
     */
    async storeResponse(request: CacheableRequest, response: CacheableResponse): Promise<boolean> {
        if (!this.settings.enabled) return false;

        try {
            const cacheKey = this.generateCacheKey(request);
            await this.cacheManager.set(cacheKey, response, this.ttlSeconds);
            console.log(`[QueryCache] Stored response with key ${cacheKey.slice(0, 20)}... (TTL: ${this.settings.ttlHours}h)`);
            return true;
        } catch (error) {
            console.error('[QueryCache] Error storing in cache:', error);
            return false;
        }
    }

    /**
     * Clear all cache entries
     * Note: This clears the ENTIRE cache manager (L1 + L2), not just exact_cache keys
     * to avoid complex pattern matching in L1.
     */
    async clear(): Promise<boolean> {
        if (!this.settings.enabled) return false;

        try {
            await this.cacheManager.clear();
            console.log(`[QueryCache] Cleared all cache entries`);
            return true;
        } catch (error) {
            console.error('[QueryCache] Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     * Note: Accessing internal Redis stats via CacheManager is tricky.
     * We'll return basic availability info for now.
     */
    async getStats(): Promise<{ keys: number; memoryUsage: string } | null> {
        return {
            keys: -1, // Not easily available via generic interface
            memoryUsage: 'unknown',
        };
    }

    /**
     * Disconnect
     */
    async disconnect(): Promise<void> {
        await this.cacheManager.disconnect();
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
    // No-op mostly, just ensures singleton creation
    getCacheClient();
    return true;
}
