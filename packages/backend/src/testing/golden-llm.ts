/**
 * Golden LLM Provider
 * 
 * A provider that replays pre-recorded LLM responses for deterministic testing.
 * Used in `golden` testing mode for regression testing.
 * 
 * Note: This is NOT a full BaseLlm implementation. It's a simplified provider
 * designed to be used with a wrapper that integrates with ADK.
 * 
 * Usage:
 *   import { GoldenLlm } from './golden-llm.js';
 *   const provider = new GoldenLlm('./tests/golden/llm/<paper-hash>');
 *   const response = await provider.getResponse(prompt);
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface GoldenEntry {
    promptHash: string;
    prompt: string;
    response: string;
    model: string;
    timestamp: string;
    agentName: string;
}

export class GoldenLlm {
    private entries: Map<string, GoldenEntry> = new Map();
    private goldenDir: string;
    private fallbackToLive: boolean;

    constructor(goldenDir: string, options?: { fallbackToLive?: boolean }) {
        this.goldenDir = goldenDir;
        this.fallbackToLive = options?.fallbackToLive ?? false;

        this.loadGoldenEntries();
    }

    private loadGoldenEntries(): void {
        const responsesDir = path.join(this.goldenDir, 'responses');

        if (!fs.existsSync(responsesDir)) {
            console.warn(`[GoldenLlm] No responses directory found at ${responsesDir}`);
            return;
        }

        const files = fs.readdirSync(responsesDir).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const entry: GoldenEntry = JSON.parse(
                fs.readFileSync(path.join(responsesDir, file), 'utf-8')
            );
            this.entries.set(entry.promptHash, entry);
        }

        console.log(`[GoldenLlm] Loaded ${this.entries.size} golden entries from ${this.goldenDir}`);
    }

    private hashPrompt(prompt: string): string {
        return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
    }

    /**
     * Get a pre-recorded response for a given prompt.
     * Returns null if no matching entry is found.
     */
    getResponse(prompt: string): string | null {
        const promptHash = this.hashPrompt(prompt);
        console.log(`[GoldenLlm] Looking up prompt hash: ${promptHash}`);

        const entry = this.entries.get(promptHash);

        if (entry) {
            console.log(`[GoldenLlm] ✅ Found golden response for hash ${promptHash}`);
            return entry.response;
        }

        console.warn(`[GoldenLlm] ❌ No golden entry for hash ${promptHash}`);
        return null;
    }

    /**
     * Check if a response exists for the given prompt.
     */
    hasResponse(prompt: string): boolean {
        const promptHash = this.hashPrompt(prompt);
        return this.entries.has(promptHash);
    }

    /**
     * Get all available prompt hashes.
     */
    getAvailableHashes(): string[] {
        return Array.from(this.entries.keys());
    }

    /**
     * Get the fallback setting.
     */
    shouldFallback(): boolean {
        return this.fallbackToLive;
    }
}

export default GoldenLlm;
