import { ICacheProvider } from './types.js';

interface CacheItem<T> {
    value: T;
    expiresAt: number;
}

export class MemoryCache implements ICacheProvider {
    private cache = new Map<string, CacheItem<any>>();
    private defaultTtlSeconds: number;

    constructor(defaultTtlSeconds: number = 60) {
        this.defaultTtlSeconds = defaultTtlSeconds;
    }

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value as T;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const ttl = ttlSeconds ?? this.defaultTtlSeconds;
        const expiresAt = Date.now() + (ttl * 1000);
        this.cache.set(key, { value, expiresAt });

        // Lazy cleanup: We don't set a timeout per key to avoid overhead.
        // We just let them expire on access or use a periodic cleanup if needed.
        // For L1 cache, expiration on access is usually fine for memory management 
        // if the map doesn't grow indefinitely in short time.
        // To be safe, let's limit size.
        if (this.cache.size > 10000) {
            // Simple LRU-approx: Delete first key (Map preserves insertion order)
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
    }

    async has(key: string): Promise<boolean> {
        const item = this.cache.get(key);
        if (!item) return false;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        const item = this.cache.get(key);
        let val = 0;

        if (item && Date.now() <= item.expiresAt) {
            if (typeof item.value === 'number') {
                val = item.value;
            } else {
                // Determine behavior if value is not number? 
                // Redis throws error, but we can restart at 0 or throw.
                // For simplicity, overwrite.
                val = 0;
            }
        }

        val++;
        const ttl = ttlSeconds ?? this.defaultTtlSeconds;
        // Preserve existing TTL if not setting new one? 
        // Redis INCR doesn't change TTL, BUT INCR on new key does (no TTL).
        // If we want sliding window, we usually want to set TTL on first Create.

        let expiresAt = item ? item.expiresAt : Date.now() + (ttl * 1000);
        if (ttlSeconds) {
            expiresAt = Date.now() + (ttlSeconds * 1000);
        }

        this.cache.set(key, { value: val, expiresAt });
        return val;
    }
}
