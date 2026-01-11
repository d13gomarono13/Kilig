import 'dotenv/config.js';
import { InMemoryRunner } from '@google/adk';
import { routerAgent } from '../packages/backend/src/agents/router/index.js';
import { langfuse, withTrace } from '../packages/backend/src/services/monitoring/langfuse.js';

async function testArxivPaper() {
    console.log('🧪 Testing Multi-Agent Workflow with ArXiv 2503.13964\n');

    const runner = new InMemoryRunner({
        agent: routerAgent,
        appName: 'kilig-arxiv-2503'
    });

    await runner.sessionService.createSession({
        appName: 'kilig-arxiv-2503',
        userId: 'test-user-arxiv',
        sessionId: 'session-arxiv-2503'
    });

    const prompt = `Analyze the paper arXiv:2503.13964.
    
    1. Extract key findings using the Scientist Agent.
    2. Create a narrative summary for a video script.
    
    Ensure the Scientist Agent is used for the retrieval and analysis.`;

    console.log('📝 Processing request...\n');

    // Wrap in trace
    const trace = langfuse.trace({
        name: 'ArXiv_2503_Test',
        userId: 'test-user-arxiv',
        metadata: { script: 'test_arxiv_2503.ts' }
    });

    try {
        await withTrace(trace.id, async () => {
            const results = runner.runAsync({
                userId: 'test-user-arxiv',
                sessionId: 'session-arxiv-2503',
                newMessage: { role: 'user', parts: [{ text: prompt }] } as any
            });

            for await (const event of results) {
                const author = (event as any).author || 'system';

                if ((event as any).content?.parts) {
                    // console.log(`\n[${author}]:`);
                    for (const part of (event as any).content.parts) {
                        if (part.text) {
                            console.log(`[${author}] ${part.text.substring(0, 100)}...`);
                        }
                        if (part.functionCall) {
                            console.log(`🔧 [${author}] Tool Call: ${part.functionCall.name}`);
                            console.log(`   Args: ${JSON.stringify(part.functionCall.args)}`);
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Test failed:', error);
    }

    console.log('\n✅ Test complete');
    process.exit(0);
}

testArxivPaper();
