import 'dotenv/config';
import { scientistAgent } from '../src/agents/scientist/index.js';
import { InMemoryRunner } from '@google/adk';
import { createOpenSearchClient } from '../src/services/opensearch/index.js';
import { Langfuse } from '../src/services/monitoring/langfuse.js';

async function main() {
    const query = process.argv[2] || 'transformer architecture';
    console.log(`\n\x1b[1m🚀 Kilig Automated Paper Workflow\x1b[0m`);
    console.log(`Targeting topic: "${query}"\n`);

    const traceId = `workflow_${Date.now()}`;
    await Langfuse.createTrace({
        id: traceId,
        name: 'Paper Ingestion Workflow',
        metadata: { query }
    });

    const runner = new InMemoryRunner({
        agent: scientistAgent,
        appName: 'kilig-workflow-test'
    });

    try {
        await runner.sessionService.createSession({
            appName: 'kilig-workflow-test',
            userId: 'workflow-user',
            sessionId: 'workflow-session'
        });

        // Prompt the scientist to find and ingest a paper
        const prompt = `Research the latest papers on "${query}". 
1. Use ArXiv search to find a landmark paper.
2. Read the paper's full content.
3. Ingest the paper into our knowledge base using 'ingest_paper_to_knowledge_base'.
4. Verify the ingestion by performing a 'search_papers' query.`;

        console.log(`[Workflow] Starting agentic routine...`);

        const resultGenerator = runner.runAsync({
            userId: 'workflow-user',
            sessionId: 'workflow-session',
            newMessage: {
                role: 'user',
                parts: [{ text: prompt }]
            } as any,
            config: { traceId } as any
        });

        for await (const event of resultGenerator) {
            if (event.author === 'system' && !event.content) continue;

            if (event.author) {
                const color = event.author === 'scientist' ? '\x1b[36m' : '\x1b[33m';
                const content = event.content?.parts?.[0]?.text || '';
                if (content) console.log(`${color}[${event.author}]\x1b[0m ${content.slice(0, 100)}...`);

                // Log tool calls
                const toolCalls = event.content?.parts?.filter(p => p.functionCall);
                if (toolCalls && toolCalls.length > 0) {
                    for (const tc of toolCalls) {
                        console.log(`\x1b[32m  [Tool Call]\x1b[0m ${tc.functionCall?.name}`);
                    }
                }
            }

            if (event.errorCode) {
                console.error(`\x1b[31m[ERROR]\x1b[0m ${event.errorCode}: ${event.errorMessage}`);
                if (event.errorCode === '429') {
                    console.log('Rate limited. Please wait 65s before retrying.');
                    break;
                }
            }
        }

        console.log(`\n\x1b[32m\x1b[1m✅ Workflow complete!\x1b[0m`);
        console.log(`Review traces in Langfuse with Trace ID: ${traceId}`);

    } catch (error) {
        console.error('\n\x1b[31m[FATAL ERROR]\x1b[0m Workflow failed:', error);
    }
}

main();
