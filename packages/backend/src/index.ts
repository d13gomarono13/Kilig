import 'dotenv/config';
import { env } from './config/env.js'; // Validates env vars on startup
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from './agents/root/index.js';
import { langfuse, withTrace } from './services/monitoring/langfuse.js';

/**
 * Kilig Entry Point
 * 
 * Uses Google ADK InMemoryRunner for multi-agent orchestration.
 * The rootAgent coordinates all sub-agents (scientist, narrative, designer, validator).
 */
async function main() {
  console.log('🚀 Kilig Multi-Agent Pipeline Starting...\n');

  try {
    // Initialize the ADK runner with root agent
    const runner = new InMemoryRunner({
      agent: rootAgent,
      appName: 'kilig-pipeline'
    });

    // Create a session
    await runner.sessionService.createSession({
      appName: 'kilig-pipeline',
      userId: 'user-01',
      sessionId: 'session-01'
    });

    // Example: Start a conversation to create a video about a topic
    const topic = process.argv[2] || 'Transformers in NLP';
    const prompt = `Create an educational animated video explaining "${topic}". 
    
1. First, search for relevant papers and analyze the science.
2. Then, create a narrative script suitable for animation.
3. Design the visual scene graph.
4. Validate the final output.`;

    console.log(`📝 Processing topic: "${topic}"\n`);
    console.log('-'.repeat(60));

    // Create a trace for this execution
    const trace = langfuse.trace({
      name: `Kilig Pipeline: ${topic}`,
      metadata: { topic, userId: 'user-01', sessionId: 'session-01' },
      input: { prompt }
    });
    const traceId = trace.id;

    console.log(`📡 Trace ID: ${traceId}`);

    // Run the multi-agent pipeline within the trace context
    await withTrace(traceId, async () => {
      const resultGenerator = runner.runAsync({
        userId: 'user-01',
        sessionId: 'session-01',
        newMessage: {
          role: 'user',
          parts: [{ text: prompt }]
        } as any
      });

      // Process results
      let lastAuthor = 'user';
      for await (const event of resultGenerator) {
        const author = (event as any).author || 'system';

        if (author !== lastAuthor) {
          console.log(`\n[${author}]:`);
          lastAuthor = author;
        }

        // Log content
        if ((event as any).content?.parts) {
          for (const part of (event as any).content.parts) {
            if (part.text) {
              console.log(part.text);
            }
            if (part.functionCall) {
              console.log(`🔧 Tool: ${part.functionCall.name}`);
            }
          }
        }

        // Log errors
        if ((event as any).errorCode) {
          console.error(`❌ Error: ${(event as any).errorMessage}`);
        }
      }
    });

    console.log('\n' + '-'.repeat(60));
    console.log('✅ Pipeline complete');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}


main();
