import { ICacheProvider, CacheConfig } from './types.js';
import { FileSystemCache } from './file-system-cache.js';
import { CacheKeyGenerator } from './key-generator.js';

class CacheManagerService {
  private provider: ICacheProvider | null = null;
  private config: CacheConfig;

  constructor() {
    this.config = {
      enabled: process.env.CACHE_ENABLED === 'true',
      provider: (process.env.CACHE_PROVIDER as 'file' | 'redis') || 'file',
      ttl: parseInt(process.env.CACHE_TTL || '86400', 10), // 24 hours
      baseDir: process.env.CACHE_DIR || '.cache',
      redisUrl: process.env.REDIS_URL
    };

    if (this.config.enabled) {
      console.log(`[CacheManager] Initializing with provider: ${this.config.provider}`);
      if (this.config.provider === 'file') {
        this.provider = new FileSystemCache(this.config.baseDir);
      } else if (this.config.provider === 'redis') {
        // TODO: Implement Redis provider
        console.warn('[CacheManager] Redis provider not implemented yet. Falling back to FileSystem.');
        this.provider = new FileSystemCache(this.config.baseDir);
      }
    } else {
      console.log('[CacheManager] Cache is DISABLED.');
    }
  }

  get isEnabled(): boolean {
    return this.config.enabled && this.provider !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.provider) return null;
    return this.provider.get<T>(key);
  }

  async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
    if (!this.isEnabled || !this.provider) return;
    return this.provider.set<T>(key, value, customTtl || this.config.ttl);
  }

  generateKey(input: any, prefix: string = ''): string {
    return CacheKeyGenerator.generate(input, prefix);
  }
}

export const CacheManager = new CacheManagerService();
