/**
 * Memory API Routes
 * 
 * Provides REST endpoints for managing agent memories.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { memoryService } from '../services/memory/mem0-service.js';
import { z } from 'zod';

// Schemas
const AddMemorySchema = z.object({
    content: z.string().min(1),
    metadata: z.record(z.any()).optional().default({})
});

const SearchMemoriesSchema = z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).optional().default(5)
});

export async function memoryRoutes(fastify: FastifyInstance) {

    /**
     * GET /api/memories/:userId - Get all memories for a user
     */
    fastify.get('/memories/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const { userId } = request.params;

        try {
            const memories = await memoryService.getAllMemories(userId);
            return reply.send({ success: true, data: memories, count: memories.length });
        } catch (error: any) {
            fastify.log.error(error, 'Failed to get memories');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/memories/:userId - Add a new memory
     */
    fastify.post('/memories/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const { userId } = request.params;

        try {
            const body = AddMemorySchema.parse(request.body);
            const memoryId = await memoryService.addMemory(userId, body.content, body.metadata);
            return reply.status(201).send({ success: true, id: memoryId });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.status(400).send({ success: false, error: error.errors });
            }
            fastify.log.error(error, 'Failed to add memory');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/memories/:userId/search - Semantic search for memories
     */
    fastify.post('/memories/:userId/search', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const { userId } = request.params;

        try {
            const body = SearchMemoriesSchema.parse(request.body);
            const results = await memoryService.searchMemories(userId, body.query, body.limit);
            return reply.send({ success: true, data: results, count: results.length });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.status(400).send({ success: false, error: error.errors });
            }
            fastify.log.error(error, 'Failed to search memories');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /api/memories/:userId/:memoryId - Delete a specific memory
     */
    fastify.delete('/memories/:userId/:memoryId', async (request: FastifyRequest<{ Params: { userId: string; memoryId: string } }>, reply: FastifyReply) => {
        const { memoryId } = request.params;

        try {
            await memoryService.deleteMemory(memoryId);
            return reply.send({ success: true });
        } catch (error: any) {
            fastify.log.error(error, 'Failed to delete memory');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /api/memories/:userId - Clear all memories for a user
     */
    fastify.delete('/memories/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
        const { userId } = request.params;

        try {
            const deleted = await memoryService.clearUserMemories(userId);
            return reply.send({ success: true, deleted });
        } catch (error: any) {
            fastify.log.error(error, 'Failed to clear memories');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
