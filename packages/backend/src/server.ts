import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { agentRoutes } from './routes/agent.js';
import { analyticsRoutes } from './routes/analytics.js';
import { voiceoverRoutes } from './routes/voiceover.js';

import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { sanitizerMiddleware } from './middleware/sanitizer.js';
import { adminAuthMiddleware } from './middleware/auth.js';

// Initialize Fastify
const server: FastifyInstance = Fastify({
  logger: true
});

// Register Middleware
server.register(cors, {
  origin: '*', // Allow all origins for dev, lock down in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Global Rate Limit
server.addHook('onRequest', rateLimitMiddleware);

// Global Input Sanitization
server.addHook('preValidation', sanitizerMiddleware);

// Register Routes
server.register(agentRoutes);
server.register(voiceoverRoutes);

// Protected Analytics Routes
server.register(async (instance) => {
  instance.addHook('preHandler', adminAuthMiddleware);
  instance.register(analyticsRoutes);
});

// Health Check
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start Server
export const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Only run if executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}

export { server };
