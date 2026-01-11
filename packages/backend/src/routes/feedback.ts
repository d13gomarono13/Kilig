/**
 * Feedback API Routes
 * 
 * Provides REST endpoints for collecting user feedback on search results.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { feedbackService, FeedbackRating } from '../services/feedback/feedback-service.js';
import { z } from 'zod';

// Schemas
const CollectFeedbackSchema = z.object({
    query: z.string().min(1),
    documentId: z.string().min(1),
    rating: z.enum(['positive', 'negative']),
    sessionId: z.string().optional()
});

const GetFeedbackStatsSchema = z.object({
    query: z.string().min(1)
});

export async function feedbackRoutes(fastify: FastifyInstance) {

    /**
     * POST /api/feedback - Submit feedback on a search result
     */
    fastify.post('/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = CollectFeedbackSchema.parse(request.body);

            // Extract userId from auth if available
            const userId = (request as any).user?.id;

            const feedbackId = await feedbackService.collectFeedback(
                body.query,
                body.documentId,
                body.rating as FeedbackRating,
                userId,
                body.sessionId
            );

            return reply.status(201).send({
                success: true,
                id: feedbackId,
                message: `Feedback recorded: ${body.rating} for document ${body.documentId}`
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.status(400).send({ success: false, error: error.errors });
            }
            fastify.log.error(error, 'Failed to collect feedback');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/feedback/stats - Get feedback statistics for a query
     */
    fastify.get('/feedback/stats', async (request: FastifyRequest<{ Querystring: { query: string } }>, reply: FastifyReply) => {
        try {
            const { query } = request.query;

            if (!query) {
                return reply.status(400).send({ success: false, error: 'Query parameter required' });
            }

            const stats = await feedbackService.loadFeedback(query);
            return reply.send({ success: true, data: stats, count: stats.length });
        } catch (error: any) {
            fastify.log.error(error, 'Failed to get feedback stats');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * GET /api/feedback/aggregate - Get aggregate feedback analytics
     */
    fastify.get('/feedback/aggregate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = await feedbackService.getAggregateStats();
            return reply.send({ success: true, data: stats });
        } catch (error: any) {
            fastify.log.error(error, 'Failed to get aggregate stats');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    /**
     * POST /api/feedback/batch - Submit multiple feedback items at once
     */
    fastify.post('/feedback/batch', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = z.object({
                feedbacks: z.array(CollectFeedbackSchema)
            }).parse(request.body);

            const userId = (request as any).user?.id;
            const results = [];

            for (const fb of body.feedbacks) {
                try {
                    const id = await feedbackService.collectFeedback(
                        fb.query,
                        fb.documentId,
                        fb.rating as FeedbackRating,
                        userId,
                        fb.sessionId
                    );
                    results.push({ documentId: fb.documentId, success: true, id });
                } catch (err: any) {
                    results.push({ documentId: fb.documentId, success: false, error: err.message });
                }
            }

            return reply.status(201).send({
                success: true,
                results,
                successCount: results.filter(r => r.success).length,
                failCount: results.filter(r => !r.success).length
            });
        } catch (error: any) {
            if (error.name === 'ZodError') {
                return reply.status(400).send({ success: false, error: error.errors });
            }
            fastify.log.error(error, 'Failed to collect batch feedback');
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
