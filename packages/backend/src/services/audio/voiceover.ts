import { getSettings } from '../../config/index.js';
import fs from 'fs/promises';
import path from 'path';

export interface VoiceoverOptions {
    voice?: string;
    speed?: number;
    pitch?: number;
}

/**
 * VoiceoverService: Generates audio narration from text scripts.
 * 
 * Supports multiple providers:
 * - Google Cloud TTS (default, via API key)
 * - ElevenLabs (if ELEVENLABS_API_KEY is set)
 */
export class VoiceoverService {
    private provider: 'google' | 'elevenlabs' | 'kokoro';
    private apiKey: string;

    constructor() {
        const falKey = process.env.FAL_KEY;
        const elKey = process.env.ELEVENLABS_API_KEY;
        const gcpKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (falKey) {
            this.provider = 'kokoro';
            this.apiKey = falKey;
            console.log('[VoiceoverService] Using Kokoro (fal.ai) TTS.');
        } else if (elKey) {
            this.provider = 'elevenlabs';
            this.apiKey = elKey;
            console.log('[VoiceoverService] Using ElevenLabs TTS.');
        } else if (gcpKey) {
            this.provider = 'google';
            this.apiKey = gcpKey;
            console.log('[VoiceoverService] Using Google Cloud TTS.');
        } else {
            this.provider = 'google';
            this.apiKey = '';
            console.warn('[VoiceoverService] No TTS API key configured.');
        }
    }

    /**
     * Generate voiceover audio from a text script.
     * @returns Base64-encoded audio or file path.
     */
    async generateVoiceover(text: string, outputPath?: string, options?: VoiceoverOptions): Promise<string | null> {
        if (!this.apiKey) {
            console.error('[VoiceoverService] API key not configured.');
            return null;
        }

        if (this.provider === 'kokoro') {
            return this.generateKokoro(text, outputPath, options);
        } else if (this.provider === 'elevenlabs') {
            return this.generateElevenLabs(text, outputPath, options);
        } else {
            return this.generateGoogleTTS(text, outputPath, options);
        }
    }

    private async generateGoogleTTS(text: string, outputPath?: string, options?: VoiceoverOptions): Promise<string | null> {
        const payload = {
            input: { text },
            voice: {
                languageCode: 'en-US',
                name: options?.voice || 'en-US-Neural2-D',
                ssmlGender: 'MALE'
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: options?.speed || 1.0,
                pitch: options?.pitch || 0
            }
        };

        try {
            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[VoiceoverService] Google TTS error: ${response.status} - ${errText}`);
                return null;
            }

            const data = await response.json();
            const audioContent = data.audioContent;

            if (outputPath) {
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, Buffer.from(audioContent, 'base64'));
                console.log(`[VoiceoverService] Audio saved to: ${outputPath}`);
                return outputPath;
            }

            return audioContent;
        } catch (error) {
            console.error('[VoiceoverService] Google TTS failed:', error);
            return null;
        }
    }

    private async generateElevenLabs(text: string, outputPath?: string, options?: VoiceoverOptions): Promise<string | null> {
        const voiceId = options?.voice || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey
                    },
                    body: JSON.stringify({
                        text,
                        model_id: 'eleven_monolingual_v1',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                }
            );

            if (!response.ok) {
                console.error(`[VoiceoverService] ElevenLabs error: ${response.status}`);
                return null;
            }

            const audioBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(audioBuffer).toString('base64');

            if (outputPath) {
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, Buffer.from(audioBuffer));
                console.log(`[VoiceoverService] Audio saved to: ${outputPath}`);
                return outputPath;
            }

            return base64;
        } catch (error) {
            console.error('[VoiceoverService] ElevenLabs failed:', error);
            return null;
        }
    }

    private async generateKokoro(text: string, outputPath?: string, options?: VoiceoverOptions): Promise<string | null> {
        try {
            const response = await fetch(
                `https://queue.fal.run/fal-ai/kokoro`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        input: text,
                        voice: options?.voice || 'af_heart',
                        speed: options?.speed || 1.0
                    })
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[VoiceoverService] Kokoro error: ${response.status} - ${errText}`);
                return null;
            }

            const data = await response.json();
            const audioUrl = data.audio?.url;

            if (!audioUrl) {
                console.error('[VoiceoverService] Kokoro failed: No audio URL in response');
                return null;
            }

            // Download the audio file from fal.ai CDN
            const audioRes = await fetch(audioUrl);
            const audioBuffer = await audioRes.arrayBuffer();
            const base64 = Buffer.from(audioBuffer).toString('base64');

            if (outputPath) {
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, Buffer.from(audioBuffer));
                console.log(`[VoiceoverService] Kokoro audio saved to: ${outputPath}`);
                return outputPath;
            }

            return base64;
        } catch (error) {
            console.error('[VoiceoverService] Kokoro failed:', error);
            return null;
        }
    }
}

export const voiceoverService = new VoiceoverService();
