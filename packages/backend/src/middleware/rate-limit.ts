import { FastifyRequest, FastifyReply } from 'fastify';
import { getCacheManager } from '../services/cache/cache-manager.js';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute

export const rateLimitMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip;
    const minute = Math.floor(Date.now() / 60000);
    const key = `ratelimit:${ip}:${minute}`;

    const cache = getCacheManager();

    try {
        const count = await cache.increment(key, RATE_LIMIT_WINDOW);

        reply.header('X-RateLimit-Limit', RATE_LIMIT_MAX);
        reply.header('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - count));
        reply.header('X-RateLimit-Reset', (minute + 1) * 60);

        if (count > RATE_LIMIT_MAX) {
            reply.code(429).send({ error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in a minute.' });
            return; // Stop processing
        }
    } catch (error) {
        // Fail open if cache errors
        console.error('[RateLimit] Error:', error);
    }
};
