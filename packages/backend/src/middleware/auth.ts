import { FastifyRequest, FastifyReply } from 'fastify';

export const adminAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminKey = process.env.ADMIN_API_KEY;

    // If no admin key configured, we might want to allow everything or deny everything.
    // For safety, if specific admin routes are protected, we should require the key.
    if (!adminKey) {
        request.log.warn('[Auth] ADMIN_API_KEY not configured. Allowing request but this is insecure.');
        return;
    }

    const apiKey = request.headers['x-api-key'];

    if (!apiKey || apiKey !== adminKey) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing API key' });
    }
};
