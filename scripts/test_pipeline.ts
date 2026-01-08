import 'dotenv/config';
import { rootAgent } from '../src/agents/root/index.js';
import { InMemoryRunner } from '@google/adk';

// Helper to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('--- Testing Kilig Pipeline (End-to-End) ---');
  
  try {
    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-pipeline-test'
    });
    console.log('Runner initialized with Root Agent.');

    // Create session explicitly
    await runner.sessionService.createSession({
        appName: 'kilig-pipeline-test',
        userId: 'test-user-01',
        sessionId: 'test-session-01'
    });
    console.log('Session created.');

    const paperUrl = 'https://arxiv.org/abs/1706.03762'; // Attention Is All You Need
    const prompt = `Create a video explaining the paper ${paperUrl}. Focus on the core concept of "Attention".`;
    console.log(`Sending prompt: "${prompt}"`);

    console.log('\n--- Pipeline Execution Started ---');
    console.log('Monitoring events...');

    let eventCount = 0;
    let lastAuthor = 'user';
    let success = false;
    let retries = 0;
    const maxRetries = 5;

    while (!success && retries < maxRetries) {
      try {
        const resultGenerator = runner.runAsync({
            userId: 'test-user-01',
            sessionId: 'test-session-01',
            newMessage: retries === 0 ? {
                role: 'user',
                parts: [{ text: prompt }]
            } : undefined // Continue session on retry
        });

        for await (const event of resultGenerator) {
            eventCount++;
            
            const author = event.author || 'system';
            if (author !== lastAuthor) {
                console.log(`\n[Agent Switch] Now Active: ${author}`);
                lastAuthor = author;
            }

            if (event.content) {
              const parts = event.content.parts || [];
              parts.forEach((part: any, i: number) => {
                if (part.text) {
                  console.log(`[${author}] Text: ${part.text.substring(0, 100)}...`);
                } else if (part.functionCall) {
                  console.log(`[${author}] Tool Call: ${part.functionCall.name}`);
                } else if (part.functionResponse) {
                  console.log(`[${author}] Tool Result: ${part.functionResponse.name}`);
                }
              });
            }
            
            if (event.errorCode) {
                console.error(`[ERROR] ${event.errorCode}: ${event.errorMessage}`);
                if (event.errorCode === 429 || event.errorMessage?.includes('Quota exceeded')) {
                    console.log('Rate Limit hit. Waiting 75s before retry...');
                    await delay(75000);
                    throw new Error('429');
                }
            }
        }
        success = true;
      } catch (err: any) {
        if (err.message === '429') {
          retries++;
          console.log(`Retry attempt ${retries}/${maxRetries}...`);
        } else {
          throw err;
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
