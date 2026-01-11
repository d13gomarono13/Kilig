import 'dotenv/config.js';
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from '../packages/backend/src/agents/root/index.js';

async function testIssueFix() {
    console.log('🧪 Testing Multi-Agent Framework with ArXiv Paper 2503.13964\n');

    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-fix-test'
    });

    await runner.sessionService.createSession({
        appName: 'kilig-fix-test',
        userId: 'test-user-fix',
        sessionId: 'test-session-fix'
    });

    const prompt = `Create a scientific comic explaining the paper with arXiv ID 2503.13964.
    
    Process:
    1. Research the paper using the Scientist Agent.
    2. Create a Comic Manifest using the Narrative Agent.
    `;

    console.log('📝 Processing request...\n');

    try {
        const results = runner.runAsync({
            userId: 'test-user-fix',
            sessionId: 'test-session-fix',
            newMessage: { role: 'user', parts: [{ text: prompt }] } as any
        });

        for await (const event of results) {
            const author = (event as any).author || 'system';

            if ((event as any).content?.parts) {
                console.log(`\n[${author}]:`);
                for (const part of (event as any).content.parts) {
                    if (part.text) console.log(part.text);
                    if (part.functionCall) {
                        console.log(`🔧 Tool Call: ${part.functionCall.name}`);
                        console.log(`   Args: ${JSON.stringify(part.functionCall.args)}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Test failed:', error);
    }

    console.log('\n✅ Test complete');
    process.exit(0);
}

testIssueFix();
