/**
 * Unit tests for the FileSystemCache
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { FileSystemCache } from './file-system-cache.js';

describe('FileSystemCache', () => {
    const TEST_CACHE_DIR = '.cache-test';
    let cache: FileSystemCache;

    beforeEach(() => {
        cache = new FileSystemCache(TEST_CACHE_DIR);
    });

    afterEach(async () => {
        // Clean up test cache directory
        try {
            await cache.clear();
            await fs.rmdir(path.resolve(process.cwd(), TEST_CACHE_DIR));
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('set and get', () => {
        it('should store and retrieve a string value', async () => {
            await cache.set('testKey', 'testValue');
            const result = await cache.get<string>('testKey');

            expect(result).toBe('testValue');
        });

        it('should store and retrieve an object', async () => {
            const obj = { name: 'test', count: 42 };
            await cache.set('objectKey', obj);
            const result = await cache.get<typeof obj>('objectKey');

            expect(result).toEqual(obj);
        });

        it('should store and retrieve an array', async () => {
            const arr = [1, 2, 3, 4, 5];
            await cache.set('arrayKey', arr);
            const result = await cache.get<number[]>('arrayKey');

            expect(result).toEqual(arr);
        });

        it('should store and retrieve embedding vectors', async () => {
            const embedding = Array.from({ length: 768 }, (_, i) => Math.random());
            await cache.set('embedding:test', embedding);
            const result = await cache.get<number[]>('embedding:test');

            expect(result).toEqual(embedding);
            expect(result).toHaveLength(768);
        });

        it('should return null for non-existent key', async () => {
            const result = await cache.get('nonExistent');

            expect(result).toBeNull();
        });

        it('should use memory cache for repeated reads', async () => {
            await cache.set('memoryTest', 'cached');

            // First read - populates memory cache
            const result1 = await cache.get('memoryTest');
            // Second read - should use memory cache
            const result2 = await cache.get('memoryTest');

            expect(result1).toBe('cached');
            expect(result2).toBe('cached');
        });
    });

    describe('TTL expiration', () => {
        it('should return null for expired entries', async () => {
            // Mock Date.now to simulate time passing
            const originalNow = Date.now;
            let mockTime = originalNow();

            vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

            await cache.set('expiring', 'value', 1); // 1 second TTL

            // Advance time by 2 seconds
            mockTime += 2000;

            const result = await cache.get('expiring');

            expect(result).toBeNull();

            // Restore Date.now
            vi.restoreAllMocks();
        });

        it('should return value before TTL expires', async () => {
            await cache.set('notExpired', 'value', 3600); // 1 hour TTL

            const result = await cache.get('notExpired');

            expect(result).toBe('value');
        });

        it('should not expire entries without TTL', async () => {
            await cache.set('noTtl', 'persistent');

            const result = await cache.get('noTtl');

            expect(result).toBe('persistent');
        });
    });

    describe('has', () => {
        it('should return true for existing key', async () => {
            await cache.set('existsKey', 'value');

            const exists = await cache.has('existsKey');

            expect(exists).toBe(true);
        });

        it('should return false for non-existent key', async () => {
            const exists = await cache.has('doesNotExist');

            expect(exists).toBe(false);
        });
    });

    describe('delete', () => {
        it('should remove entry from cache', async () => {
            await cache.set('toDelete', 'value');
            await cache.delete('toDelete');

            const result = await cache.get('toDelete');

            expect(result).toBeNull();
        });

        it('should not throw for non-existent key', async () => {
            await expect(cache.delete('nonExistent')).resolves.not.toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all entries', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');

            await cache.clear();

            const result1 = await cache.get('key1');
            const result2 = await cache.get('key2');
            const result3 = await cache.get('key3');

            expect(result1).toBeNull();
            expect(result2).toBeNull();
            expect(result3).toBeNull();
        });
    });

    describe('key sanitization', () => {
        it('should handle keys with special characters', async () => {
            const specialKey = 'embeddings:abc123_test:value';
            await cache.set(specialKey, 'sanitized');

            const result = await cache.get(specialKey);

            expect(result).toBe('sanitized');
        });

        it('should handle keys with colons (prefixed keys)', async () => {
            const prefixedKey = 'model:text-embedding-004:hash123';
            await cache.set(prefixedKey, [0.1, 0.2, 0.3]);

            const result = await cache.get<number[]>(prefixedKey);

            expect(result).toEqual([0.1, 0.2, 0.3]);
        });
    });
});
