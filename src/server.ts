import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { agentRoutes } from './routes/agent.js';
import { analyticsRoutes } from './routes/analytics.js';

// Initialize Fastify
const server: FastifyInstance = Fastify({
  logger: true
});

// Register Middleware
server.register(cors, {
  origin: '*', // Allow all origins for dev, lock down in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register Routes
server.register(agentRoutes);
server.register(analyticsRoutes);

// Health Check
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start Server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
