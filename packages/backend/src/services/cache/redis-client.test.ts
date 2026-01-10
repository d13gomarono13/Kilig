/**
 * Unit tests for Redis Cache Client
 * Uses mocking to test Redis interactions without a live server
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock Redis library
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGet = vi.fn();
const mockSetEx = vi.fn();
const mockDel = vi.fn();
const mockKeys = vi.fn();
const mockInfo = vi.fn();
const mockOn = vi.fn();

// Create a mock client that extends EventEmitter to support .on calls
class MockRedisClient extends EventEmitter {
    connect = mockConnect;
    disconnect = mockDisconnect;
    get = mockGet;
    setEx = mockSetEx;
    del = mockDel;
    keys = mockKeys;
    info = mockInfo;
    exists = vi.fn();
    flushDb = vi.fn();
    // Do not override 'on' so EventEmitter works
}

const mockRedisClientInstance = new MockRedisClient();

// Configure mockConnect to return unresolved promise initially if needed,
// but for our simple tests resolving is fine.
// We will manually trigger the 'connect' event handler via spy.
mockConnect.mockResolvedValue(undefined);

vi.mock('redis', () => ({
    createClient: vi.fn(() => mockRedisClientInstance)
}));

// Mock config
vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        redis: {
            enabled: true,
            host: 'localhost',
            port: 6379,
            password: '',
            db: 0,
            ttlHours: 24,
            socketConnectTimeout: 5,
            socketTimeout: 5000,
            decodeResponses: true
        }
    })
}));

import { RedisCacheClient } from './redis-client.js';

describe('RedisCacheClient', () => {
    let client: RedisCacheClient;
    let onSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Spy on the 'on' method of the mock instance to capture listeners
        onSpy = vi.spyOn(mockRedisClientInstance, 'on');

        client = new RedisCacheClient();
    });

    // Helper to connect client manually
    const connectClient = async () => {
        const connectPromise = client.connect();
        const connectCall = onSpy.mock.calls.find((call: any[]) => call[0] === 'connect');
        if (connectCall) {
            const handler = connectCall[1] as Function;
            handler();
        }
        await connectPromise;
    };

    describe('connect', () => {
        it('should create client and connect', async () => {
            await connectClient();
            expect(mockConnect).toHaveBeenCalled();
        });

        it('should handle connection error', async () => {
            mockConnect.mockRejectedValue(new Error('Connection failed'));

            const result = await client.connect();

            expect(result).toBe(false);
        });

        it('should return false if disabled in settings', async () => {
            const disabledClient = new RedisCacheClient({
                enabled: false,
                host: 'localhost',
                port: 6379,
                password: '',
                db: 0,
                ttlHours: 1,
                socketConnectTimeout: 1,
                socketTimeout: 5000,
                decodeResponses: true
            });

            const result = await disabledClient.connect();

            expect(result).toBe(false);
            expect(mockConnect).not.toHaveBeenCalled();
        });
    });

    describe('findCachedResponse', () => {
        const request = {
            query: 'test query',
            model: 'gpt-4',
            useHybrid: true
        };

        it('should return cached response if found', async () => {
            await connectClient();

            const cachedData = {
                query: 'test query',
                answer: 'cached answer',
                sources: []
            };

            mockGet.mockResolvedValue(JSON.stringify(cachedData));

            const result = await client.findCachedResponse(request);

            expect(result).toEqual(cachedData);
            expect(mockGet).toHaveBeenCalled();
        });

        it('should return null if not connected', async () => {
            // Did not call connect()
            const result = await client.findCachedResponse(request);

            expect(result).toBeNull();
            expect(mockGet).not.toHaveBeenCalled();
        });

        it('should return null if cache miss', async () => {
            await connectClient();
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

        it('should store response with TTL', async () => {
            await connectClient();
            mockSetEx.mockResolvedValue('OK');

            const result = await client.storeResponse(request, response);

            expect(result).toBe(true);
            expect(mockSetEx).toHaveBeenCalledWith(
                expect.stringContaining('exact_cache:'),
                24 * 3600, // TTL in seconds
                JSON.stringify(response)
            );
        });

        it('should return false if storage fails', async () => {
            await connectClient();
            mockSetEx.mockRejectedValue(new Error('Storage failed'));

            const result = await client.storeResponse(request, response);

            expect(result).toBe(false);
        });
    });

    describe('clear', () => {
        it('should delete all cache keys', async () => {
            await connectClient();
            mockKeys.mockResolvedValue(['exact_cache:1', 'exact_cache:2']);
            mockDel.mockResolvedValue(2);

            const result = await client.clear();

            expect(result).toBe(true);
            expect(mockKeys).toHaveBeenCalledWith('exact_cache:*');
            expect(mockDel).toHaveBeenCalledWith(['exact_cache:1', 'exact_cache:2']);
        });

        it('should do nothing if no keys found', async () => {
            await connectClient();
            mockKeys.mockResolvedValue([]);

            const result = await client.clear();

            expect(result).toBe(true);
            expect(mockDel).not.toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return keys count and memory usage', async () => {
            await connectClient();
            mockKeys.mockResolvedValue(['k1', 'k2', 'k3']);
            mockInfo.mockResolvedValue('used_memory_human:1.5M\nother_stat:val');

            const stats = await client.getStats();

            expect(stats).not.toBeNull();
            expect(stats!.keys).toBe(3);
            expect(stats!.memoryUsage).toBe('1.5M');
        });
    });

    describe('disconnect', () => {
        it('should close connection', async () => {
            await connectClient();
            await client.disconnect();

            expect(mockDisconnect).toHaveBeenCalled();
        });
    });
});
