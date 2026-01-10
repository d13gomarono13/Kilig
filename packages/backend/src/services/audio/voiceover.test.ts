/**
 * Unit tests for VoiceoverService
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
vi.mock('fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        writeFile: vi.fn()
    }
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { VoiceoverService } from './voiceover.js';

describe('VoiceoverService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('constructor', () => {
        it('should default to Google when no keys', () => {
            // Clear keys
            delete process.env.FAL_KEY;
            delete process.env.ELEVENLABS_API_KEY;
            delete process.env.GOOGLE_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const consoleSpy = vi.spyOn(console, 'warn');
            new VoiceoverService();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No TTS API key configured'));
        });

        it('should enable Kokoro if FAL_KEY present', () => {
            process.env.FAL_KEY = 'fal_key';
            const logSpy = vi.spyOn(console, 'log');
            new VoiceoverService();
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Kokoro'));
        });

        it('should enable ElevenLabs if ELEVENLABS_API_KEY present (and no FAL_KEY)', () => {
            delete process.env.FAL_KEY;
            process.env.ELEVENLABS_API_KEY = 'el_key';
            const logSpy = vi.spyOn(console, 'log');
            new VoiceoverService();
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ElevenLabs'));
        });

        it('should enable Google if GOOGLE_API_KEY present (and no others)', () => {
            delete process.env.FAL_KEY;
            delete process.env.ELEVENLABS_API_KEY;
            process.env.GOOGLE_API_KEY = 'gcp_key';
            const logSpy = vi.spyOn(console, 'log');
            new VoiceoverService();
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Google Cloud TTS'));
        });
    });

    describe('generateVoiceover using Google', () => {
        beforeEach(() => {
            delete process.env.FAL_KEY;
            delete process.env.ELEVENLABS_API_KEY;
            process.env.GOOGLE_API_KEY = 'gcp_key';
        });

        it('should generate audio content', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ audioContent: 'base64audio' })
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello world');

            expect(result).toBe('base64audio');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('google'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('en-US-Neural2-D')
                })
            );
        });

        it('should save to file if outputPath provided', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ audioContent: 'base64audio' })
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello', '/tmp/out.mp3');

            expect(result).toBe('/tmp/out.mp3');
            expect(fs.mkdir).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
        });

        it('should handle API error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                text: async () => 'Error message',
                status: 400
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBeNull();
        });
    });

    describe('generateVoiceover using ElevenLabs', () => {
        beforeEach(() => {
            delete process.env.FAL_KEY;
            process.env.ELEVENLABS_API_KEY = 'el_key';
        });

        it('should generate audio', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                arrayBuffer: async () => Buffer.from('audiobuffer')
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBe(Buffer.from('audiobuffer').toString('base64'));
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('elevenlabs'),
                expect.objectContaining({
                    headers: expect.objectContaining({ 'xi-api-key': 'el_key' })
                })
            );
        });

        it('should fail gracefully on error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBeNull();
        });
    });

    describe('generateVoiceover using Kokoro', () => {
        beforeEach(() => {
            process.env.FAL_KEY = 'fal_key';
        });

        it('should generate audio via queue', async () => {
            // Mock queue response
            mockFetch.mockImplementationOnce(() => Promise.resolve({
                ok: true,
                json: async () => ({ audio: { url: 'http://audio.url' } })
            }));

            // Mock audio download
            mockFetch.mockImplementationOnce(() => Promise.resolve({
                ok: true,
                arrayBuffer: async () => Buffer.from('kokoro_audio')
            }));

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBe(Buffer.from('kokoro_audio').toString('base64'));
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('fal.run'),
                expect.anything()
            );
        });

        it('should handle queue error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                text: async () => 'Queue error',
                status: 500
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBeNull();
        });

        it('should handle missing audio URL', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ audio: null }) // Invalid response
            });

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBeNull();
        });
    });

    describe('Missing API Key', () => {
        it('should return null if no key configured', async () => {
            delete process.env.FAL_KEY;
            delete process.env.ELEVENLABS_API_KEY;
            delete process.env.GOOGLE_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const service = new VoiceoverService();
            const result = await service.generateVoiceover('Hello');

            expect(result).toBeNull();
        });
    });
});
