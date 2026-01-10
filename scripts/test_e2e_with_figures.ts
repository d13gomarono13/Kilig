import 'dotenv/config';
import { env } from '../packages/backend/src/config/env.js';
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from '../packages/backend/src/agents/root/index.js';
import { langfuse, withTrace } from '../packages/backend/src/services/monitoring/langfuse.js';

async function testFigureExtraction() {
    console.log('🧪 Testing End-to-End with Figure Extraction\n');

    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-e2e-test'
    });

    await runner.sessionService.createSession({
        appName: 'kilig-e2e-test',
        userId: 'test-user',
        sessionId: 'test-session-e2e'
    });

    // Test with a paper that has rich visual data
    // "Attention Is All You Need" is a classic example
    const prompt = `Create a scientific video explaining "Attention Is All You Need" (arXiv:1706.03762).
  
  IMPORTANT:
  1. Extract and analyze all figures and tables from the paper using the scientist agent.
  2. Use the figure data to create visual scenes in the narrative.
  3. Highlight key metrics from tables in the narrative.
  4. Create a video that shows the architecture diagram (Figure 1).`;

    console.log('📝 Processing request...\n');

    // Wrap in trace
    const trace = langfuse.trace({
        name: 'E2E_Figure_Extraction_Test',
        userId: 'test-user',
        metadata: { script: 'test_e2e_with_figures.ts' }
    });

    try {
        await withTrace(trace.id, async () => {
            const results = runner.runAsync({
                userId: 'test-user',
                sessionId: 'test-session-e2e',
                newMessage: { role: 'user', parts: [{ text: prompt }] } as any
            });

            for await (const event of results) {
                const author = (event as any).author || 'system';

                if ((event as any).content?.parts) {
                    console.log(`\n[${author}]:`);
                    for (const part of (event as any).content.parts) {
                        if (part.text) console.log(part.text);
                        if (part.functionCall) {
                            console.log(`🔧 Tool: ${part.functionCall.name}`);
                            if (part.functionCall.name === 'analyze_paper_figures') {
                                console.log('   ✅ Figure Analysis Tool Triggered!');
                                console.log('   Args:', JSON.stringify(part.functionCall.args));
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Test failed:', error);
    }

    console.log('\n✅ E2E test complete');
    // Clean exit
    process.exit(0);
}

testFigureExtraction();
