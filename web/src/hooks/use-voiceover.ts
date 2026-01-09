import { useState, useCallback, useRef } from 'react';
import { generateVoiceover, VoiceoverRequest, VoiceoverResponse, KokoroVoiceId } from '../lib/voiceover';

export interface UseVoiceoverOptions {
    defaultVoice?: KokoroVoiceId;
    defaultSpeed?: number;
    autoPlay?: boolean;
}

export interface UseVoiceoverReturn {
    isLoading: boolean;
    isPlaying: boolean;
    error: string | null;
    audioUrl: string | null;
    speak: (text: string, options?: Partial<VoiceoverRequest>) => Promise<void>;
    stop: () => void;
    replay: () => void;
}

/**
 * React hook for generating and playing voiceover audio
 * 
 * @example
 * ```tsx
 * const { speak, isLoading, isPlaying, stop } = useVoiceover();
 * 
 * <button onClick={() => speak("Hello world!")}>
 *   {isLoading ? 'Generating...' : isPlaying ? 'Stop' : 'Speak'}
 * </button>
 * ```
 */
export function useVoiceover(options: UseVoiceoverOptions = {}): UseVoiceoverReturn {
    const { defaultVoice = 'af_heart', defaultSpeed = 1.0, autoPlay = true } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = useCallback(async (text: string, reqOptions?: Partial<VoiceoverRequest>) => {
        setIsLoading(true);
        setError(null);

        try {
            const response: VoiceoverResponse = await generateVoiceover({
                text,
                voice: reqOptions?.voice || defaultVoice,
                speed: reqOptions?.speed || defaultSpeed,
            });

            if (!response.success) {
                setError(response.error || 'Failed to generate voiceover');
                return;
            }

            // Create audio URL from base64 or use provided URL
            let url = response.audioUrl;
            if (!url && response.audioBase64) {
                const blob = new Blob(
                    [Uint8Array.from(atob(response.audioBase64), c => c.charCodeAt(0))],
                    { type: 'audio/mpeg' }
                );
                url = URL.createObjectURL(blob);
            }

            if (!url) {
                setError('No audio data received');
                return;
            }

            setAudioUrl(url);

            if (autoPlay) {
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onplay = () => setIsPlaying(true);
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => {
                    setError('Audio playback failed');
                    setIsPlaying(false);
                };

                await audio.play();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    }, [defaultVoice, defaultSpeed, autoPlay]);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, []);

    const replay = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else if (audioUrl) {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
            audio.play();
        }
    }, [audioUrl]);

    return {
        isLoading,
        isPlaying,
        error,
        audioUrl,
        speak,
        stop,
        replay,
    };
}
