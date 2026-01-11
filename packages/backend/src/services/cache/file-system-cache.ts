import fs from 'fs/promises';
import path from 'path';
import { ICacheProvider } from './types.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // Timestamp in ms
}

export class FileSystemCache implements ICacheProvider {
  private baseDir: string;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private isInitialized = false;

  constructor(baseDir: string = '.cache') {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  private async init() {
    if (this.isInitialized) return;
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      this.isInitialized = true;
    } catch (error) {
      console.error(`[FileSystemCache] Failed to create cache directory: ${this.baseDir}`, error);
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to be safe for filenames
    const safeKey = key.replace(/[^a-z0-9]/gi, '_');
    return path.join(this.baseDir, `${safeKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();

    // Check memory first (optimization)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key) as CacheEntry<T>;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        // Also delete file async
        this.delete(key).catch(() => { });
        return null;
      }
      return entry.value;
    }

    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      // Populate memory cache
      this.memoryCache.set(key, entry);
      return entry.value;

    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`[FileSystemCache] Read error for key ${key}:`, error);
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.init();

    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    const entry: CacheEntry<T> = { value, expiresAt };

    // Update memory
    this.memoryCache.set(key, entry);

    // Write to disk
    try {
      const filePath = this.getFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[FileSystemCache] Write error for key ${key}:`, error);
    }
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async delete(key: string): Promise<void> {
    await this.init();
    this.memoryCache.delete(key);
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.warn(`[FileSystemCache] Delete error for key ${key}:`, error);
      }
    }
  }

  async clear(): Promise<void> {
    await this.init();
    this.memoryCache.clear();
    try {
      const files = await fs.readdir(this.baseDir);
      await Promise.all(files.map(file => fs.unlink(path.join(this.baseDir, file))));
    } catch (error) {
      console.error(`[FileSystemCache] Clear error:`, error);
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    // Not truly atomic across processes, but sufficient for single instance local dev
    // or if this cache is just a fallback.
    let val = await this.get<number>(key) || 0;
    if (typeof val !== 'number') val = 0;
    val++;
    await this.set(key, val, ttlSeconds);
    return val;
  }
}
