/**
 * Voiceover API client for Kokoro TTS integration
 * 
 * This module provides functions to synthesize speech from text
 * using the backend voiceover service (Kokoro via fal.ai).
 */

// API is served from the same origin (localhost:8080)
const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface VoiceoverRequest {
    text: string;
    voice?: string; // e.g., 'af_heart', 'am_michael', 'bm_george'
    speed?: number; // 0.5 - 2.0, default 1.0
}

export interface VoiceoverResponse {
    success: boolean;
    audioUrl?: string;
    audioBase64?: string;
    error?: string;
}

/**
 * Generate voiceover audio from text using Kokoro TTS
 */
export async function generateVoiceover(request: VoiceoverRequest): Promise<VoiceoverResponse> {
    try {
        const response = await fetch(`${API_BASE}/api/voiceover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `API error: ${response.status} - ${errorText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            audioUrl: data.audioUrl,
            audioBase64: data.audioBase64,
        };
    } catch (error) {
        return {
            success: false,
            error: `Network error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Available Kokoro voices
 */
export const KOKORO_VOICES = [
    { id: 'af_heart', name: 'Heart (Female)', description: 'Warm and expressive' },
    { id: 'af_bella', name: 'Bella (Female)', description: 'Professional narrator' },
    { id: 'am_michael', name: 'Michael (Male)', description: 'Clear and articulate' },
    { id: 'bm_george', name: 'George (Male)', description: 'Deep and authoritative' },
    { id: 'bf_emma', name: 'Emma (Female)', description: 'British accent' },
] as const;

export type KokoroVoiceId = typeof KOKORO_VOICES[number]['id'];
