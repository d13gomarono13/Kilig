import 'dotenv/config';
import { Runner, InMemorySessionService, isFinalResponse, getFunctionCalls } from '@google/adk';
import { rootAgent } from '../agents/root/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const sessionService = new InMemorySessionService();
  const userId = 'dev-user';
  const sessionId = 'test-session';

  // Create a runner for the root agent
  const runner = new Runner({
    agent: rootAgent,
    sessionService,
    appName: 'kilig-test-runner'
  });

  console.log('--- Kilig Agent System Starting ---');
  const query = 'Analyze the latest breakthroughs in Transformer models for NLP';
  console.log(`Query: "${query}"`);

  const content = {
    role: 'user',
    parts: [{ text: query }],
  };

  let finalAnalysis = '';

  try {
    // Run the agent system
    for await (const event of runner.runAsync({
      userId,
      sessionId,
      newMessage: content,
    })) {
      // Log interesting events
      const author = event.author || 'unknown';
      if (['scientist', 'root', 'narrative_architect', 'designer'].includes(author)) {
        if (isFinalResponse(event)) {
          const text = event.content?.parts?.[0]?.text || '';
          console.log(`
[${author.toUpperCase()}] Response:`);
          console.log(text);
          
          if (author === 'scientist') {
            finalAnalysis = text;
          } else if (author === 'designer') {
            // In a real run, we'd capture the tool output, but capturing text explanation is also useful
            const outputPath = path.join(process.cwd(), 'tests', 'scenegraph.json');
            // Assuming the agent might output JSON text or we grab it from tool actions
          }
        }
      }
      
      // Log tool calls to see MCP in action
      const toolCalls = getFunctionCalls(event);
      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          console.log(`[TOOL CALL] ${call.name} with args:`, call.args);
        }
      }
    }

    // Save output to tests folder
    if (finalAnalysis) {
      const outputPath = path.join(process.cwd(), 'tests', 'output.json');
      await fs.writeFile(outputPath, JSON.stringify({
        query,
        timestamp: new Date().toISOString(),
        analysis: finalAnalysis
      }, null, 2));
      console.log(`
Results saved to ${outputPath}`);
    }

  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    console.log('\n--- Test Complete ---');
  }
}

main().catch(console.error);
