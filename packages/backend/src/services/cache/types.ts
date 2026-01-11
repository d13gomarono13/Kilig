export interface ICacheProvider {
  /**
   * Retrieve a value from the cache.
   * @param key The unique key for the cached item.
   * @returns The cached value or null if not found/expired.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Save a value to the cache.
   * @param key The unique key.
   * @param value The value to store.
   * @param ttlSeconds Optional Time-To-Live in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Check if a key exists in the cache.
   * @param key The unique key.
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear a specific key.
   * @param key 
   */
  delete(key: string): Promise<void>;

  /**
  /**
   * Clear the entire cache.
   */
  clear(): Promise<void>;

  /**
   * Atomically increment a value.
   * @param key The unique key.
   * @param ttlSeconds Optional TTL to set if key is new.
   * @returns The new value.
   */
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

export interface CacheConfig {
  enabled: boolean;
  provider: 'file' | 'redis';
  ttl: number; // Default TTL in seconds
  baseDir?: string; // For file cache
  redisUrl?: string; // For redis cache
}
