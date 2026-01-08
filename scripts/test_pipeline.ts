import 'dotenv/config';
import { rootAgent } from '../src/agents/root/index.js';
import { InMemoryRunner, isFinalResponse } from '@google/adk';
import fs from 'fs';
import path from 'path';
import { readUrlContent } from '../src/utils/read_url.js';

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('--- Testing Kilig Pipeline (End-to-End) ---');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const artifactsDir = path.join(process.cwd(), 'tests', 'artifacts', timestamp);

  try {
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    console.log(`Logging artifacts to: ${artifactsDir}`);

    // 1. Get Paper URL and Fetch Content
    const paperUrl = process.env.PAPER_URL || process.argv[2] || 'https://arxiv.org/abs/1706.03762';
    console.log(`[Caching] Fetching content for: ${paperUrl}`);
    let fullText = await readUrlContent(paperUrl);

    // Supplement with dummy text if too small (to ensure caching kicks in for the test)
    if (fullText.length < 5000) {
      console.log('[Caching] Content small, augmenting with simulated paper data to reach caching threshold...');
      const dummy = "This is a simulated large-scale scientific document. ".repeat(60);
      fullText = fullText + "\n\n" + dummy;
    }
    console.log(`[Caching] Using ${fullText.length} characters of paper text.`);

    const prompt = `Create a video explaining the paper ${paperUrl}. Focus on the core concept of "Attention".`;
    console.log(`Sending prompt: "${prompt}"`);

    // 2. Dynamically update ALL agent instructions for Prompt Caching (Prefix)
    const paperPrefix = `REFERENCE DOCUMENT (FULL PAPER):\n${fullText}\n\n`;

    const allAgents = [rootAgent, ...((rootAgent as any).subAgents || [])];
    for (const agent of allAgents) {
      const baseInst = (agent as any).instruction || (agent as any).instructions || "";
      (agent as any).instruction = paperPrefix + baseInst;
    }
    console.log(`[Caching] Injected static prefix into ${allAgents.length} agents.`);

    // 3. Initialize Runner
    const runner = new InMemoryRunner({
      agent: rootAgent,
      appName: 'kilig-pipeline-test'
    });

    // Create session explicitly
    await runner.sessionService.createSession({
      appName: 'kilig-pipeline-test',
      userId: 'test-user-01',
      sessionId: 'test-session-01'
    });
    console.log('Session created.');

    // Save run metadata
    fs.writeFileSync(path.join(artifactsDir, 'metadata.json'), JSON.stringify({
      paperUrl,
      prompt,
      timestamp,
      startedAt: new Date().toISOString()
    }, null, 2));

    console.log('\n--- Pipeline Execution Started ---');
    console.log('Monitoring events...');

    let lastAuthor = 'user';
    let isFinished = false;
    let turnCount = 0;
    const maxTurns = 5;

    while (!isFinished && turnCount < maxTurns) {
      turnCount++;
      console.log(`\n--- Starting Turn ${turnCount} ---`);

      let success = false;
      let retries = 0;
      const maxRetries = 2;

      while (!success && retries < maxRetries) {
        try {
          const resultGenerator = runner.runAsync({
            userId: 'test-user-01',
            sessionId: 'test-session-01',
            newMessage: turnCount === 1 ? {
              role: 'user',
              parts: [{ text: prompt }]
            } as any : undefined as any
          });

          for await (const event of resultGenerator) {
            const author = event.author || 'system';
            if (author !== lastAuthor) {
              console.log(`\n[Agent Switch] Now Active: ${author}`);
              lastAuthor = author;
            }

            // Usage Metadata logging
            if ((event as any).usageMetadata) {
              const usage = (event as any).usageMetadata;
              console.log(`[Usage] Prompt: ${usage.promptTokenCount}, Completion: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
            }

            if (event.errorCode) {
              console.error(`[ERROR] ${event.errorCode}: ${event.errorMessage}`);
              if (String(event.errorCode) === '429') {
                console.log('Rate Limit hit. Waiting 65s...');
                await delay(65000);
                throw new Error('429');
              }
            }
          }
          success = true;
          console.log('Turn complete. Waiting 10s...');
          await delay(10000);
        } catch (err: any) {
          if (err.message === '429') {
            retries++;
          } else {
            console.error('Turn failed:', err);
            break;
          }
        }
      }
    }

    console.log('\n--- Pipeline Execution Complete ---');
    process.exit(0);

  } catch (error) {
    console.error('Error running pipeline:', error);
    process.exit(1);
  }
}

main();
