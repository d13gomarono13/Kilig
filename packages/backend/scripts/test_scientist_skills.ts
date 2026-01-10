import 'dotenv/config';
import { scientistAgent } from '../src/agents/scientist/index.js';
import { InMemoryRunner } from '@google/adk';

async function main() {
  console.log('--- Testing Scientist Agent Skills Loading (Filtered) ---');

  const runner = new InMemoryRunner({
    agent: scientistAgent,
    appName: 'kilig-scientist-test'
  });

  const sessionId = 'test-session-scientist-' + Date.now();
  await runner.sessionService.createSession({
    appName: 'kilig-scientist-test',
    userId: 'test-user',
    sessionId: sessionId
  });

  const prompt = "Critically analyze the 'Attention' mechanism.";
  
  try {
      const resultGenerator = runner.runAsync({
        userId: 'test-user',
        sessionId: sessionId,
        newMessage: {
          role: 'user',
          parts: [{ text: prompt }]
        } as any
      });

      for await (const event of resultGenerator) {
        if ((event as any).errorCode) {
             console.error(`[ERROR] ${event.errorCode}: ${event.errorMessage}`);
        }
      }
  } catch (error) {}
}

main();
