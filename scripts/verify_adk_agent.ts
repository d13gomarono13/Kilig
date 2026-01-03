import 'dotenv/config';
import { scientistAgent } from '../src/agents/scientist/index.js';
import { InMemoryRunner } from '@google/adk';

async function main() {
  console.log('--- Verifying Scientist Agent ---');
  
  try {
    const runner = new InMemoryRunner({
        agent: scientistAgent,
        appName: 'test-app'
    });
    console.log('Runner initialized.');

    // Create session explicitly
    await runner.sessionService.createSession({
        appName: 'test-app',
        userId: 'test-user',
        sessionId: 'test-session'
    });
    console.log('Session created.');

    const prompt = "Find recent papers on Multi-Agent Reinforcement Learning.";
    console.log(`Sending prompt: "${prompt}"`);

    const resultGenerator = runner.runAsync({
        userId: 'test-user',
        sessionId: 'test-session',
        newMessage: {
            role: 'user',
            parts: [{ text: prompt }]
        }
    });

    console.log('\n--- Streaming Events ---');
    for await (const event of resultGenerator) {
        // Log the event type/content structure for debugging
        if (event.content) {
          const role = event.content.role;
          const parts = event.content.parts || [];
          
          console.log(`[Event] Role: ${role}`);
          parts.forEach((part: any, i: number) => {
            if (part.text) {
              console.log(`  Part ${i} (Text): ${part.text}`);
            } else if (part.functionCall) {
              console.log(`  Part ${i} (Tool Call): ${part.functionCall.name}`);
              console.log(`    Args: ${JSON.stringify(part.functionCall.args)}`);
            } else if (part.functionResponse) {
              console.log(`  Part ${i} (Tool Result): ${part.functionResponse.name}`);
              console.log(`    Result: ${JSON.stringify(part.functionResponse.response)}`);
            } else {
              console.log(`  Part ${i} (Other): ${JSON.stringify(part)}`);
            }
          });
        } else {
          console.log(`[Event] (No Content): ${JSON.stringify(event)}`);
        }
    }
    console.log('\n--- Verification Complete ---');
    process.exit(0); // Force exit to prevent hanging

  } catch (error) {
    console.error('Error running agent:', error);
    process.exit(1);
  }
}

main();
