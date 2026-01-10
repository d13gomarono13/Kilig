/**
 * Unit tests for Redis Cache Provider
 * wrapped around RedisClient
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock Redis library
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGet = vi.fn();
const mockSetEx = vi.fn();
const mockDel = vi.fn();
const mockExists = vi.fn();
const mockFlushDb = vi.fn();

class MockRedisClient extends EventEmitter {
    connect = mockConnect;
    disconnect = mockDisconnect;
    get = mockGet;
    setEx = mockSetEx;
    del = mockDel;
    exists = mockExists;
    flushDb = mockFlushDb;
    // Let EventEmitter handle 'on'
}

const mockRedisClientInstance = new MockRedisClient();

mockConnect.mockResolvedValue(undefined);

vi.mock('redis', () => ({
    createClient: vi.fn(() => mockRedisClientInstance)
}));

// Mock config
vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        redis: {
            host: 'localhost',
            port: 6379,
            password: '',
            db: 0,
            ttlHours: 1,
            socketConnectTimeout: 5
        }
    })
}));

import { RedisCache } from './redis-cache.js';

describe('RedisCache', () => {
    let cache: RedisCache;
    let onSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();

        onSpy = vi.spyOn(mockRedisClientInstance, 'on');

        cache = new RedisCache();
    });

    const triggerConnect = () => {
        const connectCall = onSpy.mock.calls.find((call: [string, (...args: any[]) => void]) => call[0] === 'connect');
        if (connectCall) {
            const handler = connectCall[1];
            handler();
        }
    };

    describe('get', () => {
        it('should connect and return value', async () => {
            mockGet.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

            const promise = cache.get('key');

            // Trigger connection
            triggerConnect();

            const result = await promise;

            expect(result).toEqual({ foo: 'bar' });
            expect(mockConnect).toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith('key');
        });

        it('should return null if not found', async () => {
            mockGet.mockResolvedValue(null);

            const promise = cache.get('key');
            triggerConnect();
            const result = await promise;

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockGet.mockRejectedValue(new Error('Redis error'));

            const promise = cache.get('key');
            triggerConnect();
            const result = await promise;

            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should set value with default TTL', async () => {
            mockSetEx.mockResolvedValue('OK');

            const promise = cache.set('key', { foo: 'bar' });
            triggerConnect();
            await promise;

            expect(mockSetEx).toHaveBeenCalledWith('key', 3600, JSON.stringify({ foo: 'bar' }));
        });

        it('should set value with custom TTL', async () => {
            mockSetEx.mockResolvedValue('OK');

            const promise = cache.set('key', { foo: 'bar' }, 100);
            triggerConnect();
            await promise;

            expect(mockSetEx).toHaveBeenCalledWith('key', 100, JSON.stringify({ foo: 'bar' }));
        });

        it('should handle set error gracefully', async () => {
            mockSetEx.mockRejectedValue(new Error('Redis error'));

            const promise = cache.set('key', {});
            triggerConnect();
            await promise;

            // Should not throw
            expect(mockSetEx).toHaveBeenCalled();
        });
    });

    describe('has', () => {
        it('should return true if key exists', async () => {
            mockExists.mockResolvedValue(1);

            const promise = cache.has('key');
            triggerConnect();
            const result = await promise;

            expect(result).toBe(true);
        });

        it('should return false if key does not exist', async () => {
            mockExists.mockResolvedValue(0);

            const promise = cache.has('key');
            triggerConnect();
            const result = await promise;

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            mockExists.mockRejectedValue(new Error('Redis error'));

            const promise = cache.has('key');
            triggerConnect();
            const result = await promise;

            expect(result).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete key', async () => {
            mockDel.mockResolvedValue(1);

            const promise = cache.delete('key');
            triggerConnect();
            await promise;

            expect(mockDel).toHaveBeenCalledWith('key');
        });

        it('should handle error gracefully', async () => {
            mockDel.mockRejectedValue(new Error('Redis error'));

            const promise = cache.delete('key');
            triggerConnect();
            await promise;

            expect(mockDel).toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should flush db', async () => {
            mockFlushDb.mockResolvedValue('OK');

            const promise = cache.clear();
            triggerConnect();
            await promise;

            expect(mockFlushDb).toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it('should disconnect if connected', async () => {
            // First connect
            mockGet.mockResolvedValue(null);
            const p = cache.get('foo');
            triggerConnect();
            await p;

            // Then disconnect
            mockDisconnect.mockResolvedValue(undefined);
            await cache.disconnect();

            expect(mockDisconnect).toHaveBeenCalled();
        });

        it('should do nothing if not connected', async () => {
            await cache.disconnect();
            expect(mockDisconnect).not.toHaveBeenCalled();
        });
    });
});
