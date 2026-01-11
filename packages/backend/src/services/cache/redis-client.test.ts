/**
 * Unit tests for RedisCacheClient (QueryCacheService)
 * Now tests interaction with CacheManager instead of direct Redis
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCacheClient } from './redis-client.js';

// Mock CacheManager
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockClear = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('./cache-manager.js', () => ({
    getCacheManager: () => ({
        get: mockGet,
        set: mockSet,
        clear: mockClear,
        disconnect: mockDisconnect
    })
}));

// Mock config
vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        redis: {
            enabled: true,
            ttlHours: 1
        }
    })
}));

describe('RedisCacheClient', () => {
    let client: RedisCacheClient;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new RedisCacheClient();
    });

    describe('findCachedResponse', () => {
        const request = {
            query: 'test query',
            model: 'gpt-4',
            useHybrid: true
        };

        it('should return cached response from manager', async () => {
            const cachedData = {
                query: 'test query',
                answer: 'cached answer',
                sources: []
            };

            mockGet.mockResolvedValue(cachedData);

            const result = await client.findCachedResponse(request);

            expect(result).toEqual(cachedData);
            expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('exact_cache:'));
        });

        it('should return null if manager returns null', async () => {
            mockGet.mockResolvedValue(null);

            const result = await client.findCachedResponse(request);

            expect(result).toBeNull();
        });
    });

    describe('storeResponse', () => {
        const request = { query: 'test' };
        const response = {
            query: 'test',
            answer: 'answer',
            sources: []
        };

        it('should store in manager', async () => {
            mockSet.mockResolvedValue(undefined);

            const result = await client.storeResponse(request, response);

            expect(result).toBe(true);
            expect(mockSet).toHaveBeenCalledWith(
                expect.stringContaining('exact_cache:'),
                response,
                3600 // TTL
            );
        });
    });

    describe('clear', () => {
        it('should call manager clear', async () => {
            mockClear.mockResolvedValue(undefined);

            const result = await client.clear();

            expect(result).toBe(true);
            expect(mockClear).toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it('should call manager disconnect', async () => {
            await client.disconnect();
            expect(mockDisconnect).toHaveBeenCalled();
        });
    });
});
