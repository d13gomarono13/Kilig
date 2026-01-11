/**
 * API Route Validation Schemas
 * 
 * Centralized Zod schemas for all API routes.
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Agent Routes
// ─────────────────────────────────────────────────────────────

export const TriggerBodySchema = z.object({
    query: z.string().min(1, 'Query is required').max(5000, 'Query too long'),
});

export type TriggerBody = z.infer<typeof TriggerBodySchema>;

// ─────────────────────────────────────────────────────────────
// Voiceover Routes
// ─────────────────────────────────────────────────────────────

export const VoiceoverBodySchema = z.object({
    text: z.string().min(1, 'Text is required').max(10000, 'Text too long'),
    voice: z.enum([
        'af_heart',
        'af_bella',
        'am_michael',
        'bm_george',
        'bf_emma',
    ]).optional(),
    speed: z.number().min(0.5).max(2.0).optional(),
});

export type VoiceoverBody = z.infer<typeof VoiceoverBodySchema>;

// ─────────────────────────────────────────────────────────────
// Paper/Search Routes (for future use)
// ─────────────────────────────────────────────────────────────

export const ArxivIdSchema = z.string().regex(
    /^\d{4}\.\d{4,5}$/,
    'ArXiv ID must match format XXXX.XXXXX (e.g., 2103.00020)'
);

export const SearchQuerySchema = z.object({
    query: z.string().min(1, 'Query is required'),
    size: z.number().int().min(1).max(100).optional().default(10),
    categories: z.array(z.string()).optional(),
    useHybrid: z.boolean().optional().default(true),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const IngestPaperSchema = z.object({
    arxivId: ArxivIdSchema,
    forceRefresh: z.boolean().optional().default(false),
});

export type IngestPaperBody = z.infer<typeof IngestPaperSchema>;

// ─────────────────────────────────────────────────────────────
// Helper for Fastify validation
// ─────────────────────────────────────────────────────────────

import { AppError } from '../utils/app-error.js';

/**
 * Validate request body with Zod and throw AppError on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
    const result = schema.safeParse(body);

    if (!result.success) {
        const message = result.error.errors.map(e => e.message).join(', ');
        throw AppError.badRequest('VALIDATION_FAILED', message);
    }

    return result.data;
}
