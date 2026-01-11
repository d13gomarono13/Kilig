import { ICacheProvider } from './types.js';
import { MemoryCache } from './memory-cache.js';
import { RedisCache } from './redis-cache.js';
import { getSettings } from '../../config/index.js';

export class CacheManager implements ICacheProvider {
    private l1: MemoryCache;
    private l2: RedisCache; // Always created, but might not be "connected" if disabled
    private isRedisEnabled: boolean;

    constructor() {
        const settings = getSettings();
        // L1: Short TTL (e.g., 60s) for very hot data
        this.l1 = new MemoryCache(60);

        // L2: Redis with configured TTL
        this.l2 = new RedisCache(settings.redis.ttlHours * 3600);
        this.isRedisEnabled = settings.redis.enabled;
    }

    async get<T>(key: string): Promise<T | null> {
        // 1. Check L1 (Memory)
        try {
            const l1Value = await this.l1.get<T>(key);
            if (l1Value !== null) {
                return l1Value;
            }
        } catch (error) {
            console.warn(`[CacheManager] L1 get error for ${key}:`, error);
        }

        // 2. Check L2 (Redis)
        if (this.isRedisEnabled) {
            try {
                const l2Value = await this.l2.get<T>(key);
                if (l2Value !== null) {
                    // Populate L1
                    await this.l1.set(key, l2Value);
                    return l2Value;
                }
            } catch (error) {
                console.error(`[CacheManager] L2 get error for ${key}:`, error);
            }
        }

        return null;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        // 1. Set L1
        try {
            await this.l1.set(key, value, ttlSeconds);
        } catch (error) {
            console.warn(`[CacheManager] L1 set error for ${key}:`, error);
        }

        // 2. Set L2
        if (this.isRedisEnabled) {
            try {
                await this.l2.set(key, value, ttlSeconds);
            } catch (error) {
                console.error(`[CacheManager] L2 set error for ${key}:`, error);
            }
        }
    }

    async has(key: string): Promise<boolean> {
        // Check L1
        if (await this.l1.has(key)) return true;

        // Check L2
        if (this.isRedisEnabled) {
            return await this.l2.has(key);
        }

        return false;
    }

    async delete(key: string): Promise<void> {
        await this.l1.delete(key);
        if (this.isRedisEnabled) {
            await this.l2.delete(key);
        }
    }

    async clear(): Promise<void> {
        await this.l1.clear();
        if (this.isRedisEnabled) {
            await this.l2.clear();
        }
    }

    async disconnect(): Promise<void> {
        await this.l2.disconnect();
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        // If L2 is enabled, it is the source of truth for counters
        if (this.isRedisEnabled) {
            const val = await this.l2.increment(key, ttlSeconds);
            // Invalidate L1 to ensure next get fetches fresh count from L2
            await this.l1.delete(key);
            return val;
        }

        // Fallback to L1
        return await this.l1.increment(key, ttlSeconds);
    }
}

// Singleton
let _cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
    if (!_cacheManager) {
        _cacheManager = new CacheManager();
    }
    return _cacheManager;
}
