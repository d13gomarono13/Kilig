/**
 * Unit tests for CacheManager
 * Tests the multi-tier caching logic (L1 Memory -> L2 Redis)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheManager } from './cache-manager.js';

// Mock dependencies
const mockMemoryGet = vi.fn();
const mockMemorySet = vi.fn();
const mockMemoryHas = vi.fn();
const mockMemoryDelete = vi.fn();
const mockMemoryClear = vi.fn();

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisHas = vi.fn();
const mockRedisDelete = vi.fn();
const mockRedisClear = vi.fn();
const mockRedisDisconnect = vi.fn();

const mockMemoryIncrement = vi.fn();
const mockRedisIncrement = vi.fn();

vi.mock('./memory-cache.js', () => {
    return {
        MemoryCache: vi.fn(function () {
            return {
                get: mockMemoryGet,
                set: mockMemorySet,
                has: mockMemoryHas,
                delete: mockMemoryDelete,
                clear: mockMemoryClear,
                increment: mockMemoryIncrement
            };
        })
    };
});

vi.mock('./redis-cache.js', () => {
    return {
        RedisCache: vi.fn(function () {
            return {
                get: mockRedisGet,
                set: mockRedisSet,
                has: mockRedisHas,
                delete: mockRedisDelete,
                clear: mockRedisClear,
                disconnect: mockRedisDisconnect,
                increment: mockRedisIncrement
            };
        })
    };
});

vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        redis: {
            enabled: true,
            ttlHours: 1
        }
    })
}));

describe('CacheManager', () => {
    let manager: CacheManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new CacheManager();
    });

    describe('get', () => {
        it('should return from L1 if available', async () => {
            mockMemoryGet.mockResolvedValue('l1-value');

            const result = await manager.get('key');

            expect(result).toBe('l1-value');
            expect(mockMemoryGet).toHaveBeenCalledWith('key');
            expect(mockRedisGet).not.toHaveBeenCalled();
        });

        it('should return from L2 if not in L1, and populate L1', async () => {
            mockMemoryGet.mockResolvedValue(null);
            mockRedisGet.mockResolvedValue('l2-value');

            const result = await manager.get('key');

            expect(result).toBe('l2-value');
            expect(mockRedisGet).toHaveBeenCalledWith('key');
            // Should populate L1
            expect(mockMemorySet).toHaveBeenCalledWith('key', 'l2-value');
        });

        it('should return null if not in L1 or L2', async () => {
            mockMemoryGet.mockResolvedValue(null);
            mockRedisGet.mockResolvedValue(null);

            const result = await manager.get('key');

            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should write to both L1 and L2', async () => {
            await manager.set('key', 'value', 100);

            expect(mockMemorySet).toHaveBeenCalledWith('key', 'value', 100);
            expect(mockRedisSet).toHaveBeenCalledWith('key', 'value', 100);
        });
    });

    describe('has', () => {
        it('should return true if in L1', async () => {
            mockMemoryHas.mockResolvedValue(true);
            const result = await manager.has('key');
            expect(result).toBe(true);
            expect(mockRedisHas).not.toHaveBeenCalled();
        });

        it('should return true if in L2', async () => {
            mockMemoryHas.mockResolvedValue(false);
            mockRedisHas.mockResolvedValue(true);
            const result = await manager.has('key');
            expect(result).toBe(true);
        });
    });

    describe('increment', () => {
        it('should increment L2 and invalidate L1', async () => {
            mockRedisIncrement.mockResolvedValue(5);

            const result = await manager.increment('key', 60);

            expect(result).toBe(5);
            expect(mockRedisIncrement).toHaveBeenCalledWith('key', 60);
            expect(mockMemoryDelete).toHaveBeenCalledWith('key');
        });
    });

    describe('delete', () => {
        it('should delete from both', async () => {
            await manager.delete('key');
            expect(mockMemoryDelete).toHaveBeenCalledWith('key');
            expect(mockRedisDelete).toHaveBeenCalledWith('key');
        });
    });

    describe('clear', () => {
        it('should clear both', async () => {
            await manager.clear();
            expect(mockMemoryClear).toHaveBeenCalled();
            expect(mockRedisClear).toHaveBeenCalled();
        });
    });
});
