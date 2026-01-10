/**
 * Golden Dataset Generator
 * 
 * This script runs the full Kilig pipeline with live models and records all
 * LLM responses to enable deterministic, zero-API regression testing.
 * 
 * Usage:
 *   PAPER_URL="https://arxiv.org/abs/1706.03762" npx tsx scripts/generate_golden_dataset.ts
 * 
 * Output:
 *   tests/golden/llm/<paper-hash>/
 *     ├── metadata.json       # Paper info, timestamp, model used
 *     ├── prompts/            # All prompts sent to LLM
 *     └── responses/          # All LLM responses (keyed by prompt hash)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from '../src/agents/root/index.js';

const GOLDEN_DIR = path.join(process.cwd(), 'tests', 'golden', 'llm');

interface GoldenEntry {
    promptHash: string;
    prompt: string;
    response: string;
    model: string;
    timestamp: string;
    agentName: string;
}

function hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

async function generateGoldenDataset() {
    const paperUrl = process.env.PAPER_URL;
    if (!paperUrl) {
        console.error('❌ PAPER_URL environment variable is required');
        process.exit(1);
    }

    const paperHash = hashPrompt(paperUrl);
    const outputDir = path.join(GOLDEN_DIR, paperHash);

    console.log('🏆 Golden Dataset Generator');
    console.log(`📄 Paper: ${paperUrl}`);
    console.log(`📁 Output: ${outputDir}`);
    console.log('-'.repeat(60));

    // Create output directories
    fs.mkdirSync(path.join(outputDir, 'prompts'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'responses'), { recursive: true });

    const goldenEntries: GoldenEntry[] = [];

    // Initialize ADK runner
    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-golden-generator'
    });

    await runner.sessionService.createSession({
        appName: 'kilig-golden-generator',
        userId: 'golden-user',
        sessionId: 'golden-session'
    });

    const prompt = `Create a video explaining the paper ${paperUrl}. Focus on the core scientific contribution.`;

    console.log(`\n📝 Running pipeline with prompt: "${prompt.substring(0, 50)}..."\n`);

    // Run the pipeline and capture all events
    const resultGenerator = runner.runAsync({
        userId: 'golden-user',
        sessionId: 'golden-session',
        newMessage: {
            role: 'user',
            parts: [{ text: prompt }]
        } as any
    });

    for await (const event of resultGenerator) {
        // Capture LLM interactions
        if ((event as any).content?.parts) {
            for (const part of (event as any).content.parts) {
                if (part.text) {
                    const entry: GoldenEntry = {
                        promptHash: hashPrompt(prompt),
                        prompt: prompt,
                        response: part.text,
                        model: 'captured',
                        timestamp: new Date().toISOString(),
                        agentName: (event as any).author || 'unknown'
                    };
                    goldenEntries.push(entry);
                    console.log(`✅ Captured response from ${entry.agentName}`);
                }
            }
        }
    }

    // Save metadata
    const metadata = {
        paperUrl,
        paperHash,
        generatedAt: new Date().toISOString(),
        entryCount: goldenEntries.length,
        agents: [...new Set(goldenEntries.map(e => e.agentName))]
    };
    fs.writeFileSync(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    // Save entries
    for (const entry of goldenEntries) {
        const entryPath = path.join(outputDir, 'responses', `${entry.promptHash}_${entry.agentName}.json`);
        fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2));
    }

    console.log('\n' + '-'.repeat(60));
    console.log(`🏆 Golden dataset generated successfully!`);
    console.log(`📊 ${goldenEntries.length} responses captured from ${metadata.agents.length} agents`);
    console.log(`📁 Saved to: ${outputDir}`);
}

generateGoldenDataset().catch(console.error);
