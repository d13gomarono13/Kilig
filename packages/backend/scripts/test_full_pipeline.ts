import 'dotenv/config';
import { rootAgent } from '../src/agents/root/index.js';
import { InMemoryRunner } from '@google/adk';
import { Langfuse } from '../src/services/monitoring/langfuse.js';
import { voiceoverService } from '../src/services/audio/voiceover.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * End-to-End Multimodal Pipeline Test with Voiceover
 * 
 * This script runs the full Kilig pipeline:
 * 1. Root -> Scientist (ArXiv Search + Ingestion) -> Narrative (Comic Script + Real Data)
 * 2. Captures the narrative output as JSON
 * 3. Synthesizes audio narration using Kokoro (fal.ai)
 */

interface PipelineOutput {
    topic: string;
    traceId: string;
    narrativeScript: string;
    audioPath?: string;
    manifestPath?: string;
    timestamp: string;
}

async function main() {
    const topic = process.argv[2] || 'Direct Preference Optimization';
    console.log(`\n\x1b[1m🚀 Kilig E2E Multimodal Pipeline Test\x1b[0m`);
    console.log(`Topic: "${topic}"\n`);

    const traceId = `e2e_${Date.now()}`;
    const outputDir = './data/e2e_outputs';
    await fs.mkdir(outputDir, { recursive: true });

    await Langfuse.createTrace({
        id: traceId,
        name: 'E2E Full Pipeline Test',
        metadata: { topic }
    });

    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-e2e-test'
    });

    // Collect narrative output for voiceover
    let narrativeScript = '';
    let comicManifest: any = null;

    try {
        await runner.sessionService.createSession({
            appName: 'kilig-e2e-test',
            userId: 'e2e-tester',
            sessionId: 'e2e-session'
        });

        const prompt = `I want to create a Scientific Comic about "${topic}".
1. Find the core landmark paper on ArXiv.
2. Ingest it into your knowledge base.
3. Once research is done, generate a formatted Comic Manifest.
4. Make sure to use 'extract_chart_data' to get at least one real data point from the paper for a chart panel.
5. Transfer the final results back to me.`;

        console.log(`[E2E] Orchestrating agents...`);

        const resultGenerator = runner.runAsync({
            userId: 'e2e-tester',
            sessionId: 'e2e-session',
            newMessage: {
                role: 'user',
                parts: [{ text: prompt }]
            } as any,
            runConfig: { traceId } as any
        });

        for await (const event of resultGenerator) {
            if (event.author && event.author !== 'system') {
                const colors: any = {
                    root: '\x1b[35m',
                    scientist: '\x1b[36m',
                    narrative: '\x1b[33m',
                    validator: '\x1b[32m'
                };
                const color = colors[event.author] || '\x1b[37m';
                const content = event.content?.parts?.[0]?.text || '';

                if (content.length > 5) {
                    console.log(`${color}[${event.author.toUpperCase()}]\x1b[0m ${content.slice(0, 150)}...`);
                }

                // Capture narrative agent output for voiceover script
                if (event.author === 'narrative' && content.length > 50) {
                    narrativeScript = content;
                }

                // Capture tool results (comic manifest)
                const toolResults = event.content?.parts?.filter((p: any) => p.functionResponse);
                if (toolResults && toolResults.length > 0) {
                    for (const tr of toolResults) {
                        if (tr.functionResponse?.name === 'save_comic_manifest') {
                            try {
                                comicManifest = JSON.parse(tr.functionResponse.response?.result || '{}');
                            } catch { /* ignore parse errors */ }
                        }
                    }
                }

                const toolCalls = event.content?.parts?.filter((p: any) => p.functionCall);
                if (toolCalls && toolCalls.length > 0) {
                    for (const tc of toolCalls) {
                        console.log(`  \x1b[90m⚙️  Tool:\x1b[0m ${tc.functionCall?.name}`);
                    }
                }
            }

            if (event.errorCode) {
                console.error(`\n\x1b[31m[ERROR]\x1b[0m ${event.errorCode}: ${event.errorMessage}`);
                if (event.errorCode === '429') {
                    console.log('Gemini rate limit hit. Waiting for quota reset...');
                    break;
                }
            }
        }

        console.log(`\n\x1b[32m\x1b[1m✅ Agent Pipeline Completed!\x1b[0m`);

        // ============================================
        // VOICEOVER SYNTHESIS
        // ============================================
        console.log(`\n\x1b[1m🎙️ Synthesizing Voiceover with Kokoro...\x1b[0m`);

        // Create voiceover script from narrative output or manifest
        let voiceoverText = '';
        if (comicManifest?.panels) {
            // Extract text from all panels for a cohesive narration
            voiceoverText = comicManifest.panels
                .map((p: any) => p.narrative || p.caption || '')
                .filter((t: string) => t.length > 0)
                .join('. ');
        } else if (narrativeScript) {
            // Fallback to raw narrative output (extract first 2000 chars)
            voiceoverText = narrativeScript.slice(0, 2000);
        }

        if (voiceoverText.length < 20) {
            console.log('\x1b[33m[VOICEOVER]\x1b[0m Insufficient text for narration, skipping.');
        } else {
            const audioPath = path.join(outputDir, `${traceId}_voiceover.mp3`);
            const result = await voiceoverService.generateVoiceover(voiceoverText, audioPath);

            if (result) {
                console.log(`\x1b[32m[VOICEOVER]\x1b[0m Audio saved to: ${audioPath}`);
            } else {
                console.log('\x1b[31m[VOICEOVER]\x1b[0m Failed to generate audio.');
            }
        }

        // ============================================
        // SAVE PIPELINE OUTPUT AS JSON
        // ============================================
        const pipelineOutput: PipelineOutput = {
            topic,
            traceId,
            narrativeScript: voiceoverText,
            audioPath: path.join(outputDir, `${traceId}_voiceover.mp3`),
            manifestPath: comicManifest ? path.join(outputDir, `${traceId}_manifest.json`) : undefined,
            timestamp: new Date().toISOString()
        };

        // Save manifest
        if (comicManifest) {
            await fs.writeFile(
                path.join(outputDir, `${traceId}_manifest.json`),
                JSON.stringify(comicManifest, null, 2)
            );
        }

        // Save pipeline summary
        await fs.writeFile(
            path.join(outputDir, `${traceId}_summary.json`),
            JSON.stringify(pipelineOutput, null, 2)
        );

        console.log(`\n\x1b[32m\x1b[1m📦 Full E2E Pipeline Completed!\x1b[0m`);
        console.log(`Output directory: ${outputDir}`);
        console.log(`Trace ID: ${traceId}`);

    } catch (error) {
        console.error('\n\x1b[31m[FATAL ERROR]\x1b[0m E2E Run failed:', error);
    }
}

process.on('SIGINT', () => process.exit(0));

main();
