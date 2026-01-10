import { FastifyInstance } from 'fastify';
import { voiceoverService } from '../services/audio/voiceover.js';

interface VoiceoverBody {
    text: string;
    voice?: string;
    speed?: number;
}

/**
 * Voiceover API routes for Kokoro TTS synthesis
 */
export async function voiceoverRoutes(server: FastifyInstance) {

    /**
     * POST /api/voiceover
     * Generate audio from text using Kokoro TTS
     */
    server.post<{ Body: VoiceoverBody }>('/api/voiceover', async (request, reply) => {
        const { text, voice, speed } = request.body;

        if (!text || text.trim().length === 0) {
            return reply.status(400).send({
                success: false,
                error: 'Text is required',
            });
        }

        try {
            const audioBase64 = await voiceoverService.generateVoiceover(
                text,
                undefined, // No file output, return base64
                { voice, speed }
            );

            if (!audioBase64) {
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to generate voiceover. Check API key configuration.',
                });
            }

            return reply.send({
                success: true,
                audioBase64,
            });
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            });
        }
    });

    /**
     * GET /api/voiceover/voices
     * Get available Kokoro voices
     */
    server.get('/api/voiceover/voices', async (request, reply) => {
        return reply.send({
            voices: [
                { id: 'af_heart', name: 'Heart (Female)', description: 'Warm and expressive' },
                { id: 'af_bella', name: 'Bella (Female)', description: 'Professional narrator' },
                { id: 'am_michael', name: 'Michael (Male)', description: 'Clear and articulate' },
                { id: 'bm_george', name: 'George (Male)', description: 'Deep and authoritative' },
                { id: 'bf_emma', name: 'Emma (Female)', description: 'British accent' },
            ],
        });
    });
}
