import { createClient, RedisClientType } from 'redis';
import { ICacheProvider } from './types.js';
import { getSettings } from '../../config/index.js';

export class RedisCache implements ICacheProvider {
    private client: RedisClientType;
    private isConnected: boolean = false;
    private defaultTtl: number;

    constructor(ttlSeconds?: number) {
        const settings = getSettings().redis;
        const url = settings.password
            ? `redis://:${settings.password}@${settings.host}:${settings.port}/${settings.db}`
            : `redis://${settings.host}:${settings.port}/${settings.db}`;

        this.client = createClient({
            url,
            socket: {
                connectTimeout: settings.socketConnectTimeout * 1000,
            },
        });

        this.defaultTtl = ttlSeconds || settings.ttlHours * 3600;

        this.client.on('error', (err) => {
            console.error('[RedisCache] Error:', err);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            console.log('[RedisCache] Connected');
            this.isConnected = true;
        });
    }

    private async ensureConnected() {
        if (!this.isConnected) {
            await this.client.connect();
            this.isConnected = true;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            await this.ensureConnected();
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`[RedisCache] Get failed for key ${key}:`, error);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            await this.ensureConnected();
            const ttl = ttlSeconds || this.defaultTtl;
            await this.client.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error(`[RedisCache] Set failed for key ${key}:`, error);
        }
    }

    async has(key: string): Promise<boolean> {
        try {
            await this.ensureConnected();
            const exists = await this.client.exists(key);
            return exists === 1;
        } catch (error) {
            console.error(`[RedisCache] Has failed for key ${key}:`, error);
            return false;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.del(key);
        } catch (error) {
            console.error(`[RedisCache] Delete failed for key ${key}:`, error);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.flushDb();
            console.log('[RedisCache] Cache cleared (FLUSHDB)');
        } catch (error) {
            console.error('[RedisCache] Clear failed:', error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }

    async increment(key: string, ttlSeconds?: number): Promise<number> {
        try {
            await this.ensureConnected();
            const val = await this.client.incr(key);

            if (ttlSeconds) {
                // Set TTL only if provided (or maybe if key was new? Redis incr doesn't tell us easily if new without script)
                // Common pattern: expire if new. 
                // But simplified: 
                await this.client.expire(key, ttlSeconds);
            }
            return val;
        } catch (error) {
            console.error(`[RedisCache] Increment failed for key ${key}:`, error);
            return 0;
        }
    }
}
