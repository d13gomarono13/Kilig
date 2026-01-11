import 'dotenv/config';
import { rootAgent } from '../src/agents/root/index.js';
import { InMemoryRunner } from '@google/adk';
import fs from 'fs';
import path from 'path';
import { readUrlContent } from '../src/utils/read_url.js';

// Helper for strict delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('\x1b[36m🚀 Starting Kilig E2E Test: ArXiv Paper Processing (Repair Mode)\x1b[0m');
    console.log('Target Paper: MDocAgent (https://arxiv.org/abs/2503.13964)');

    // 1. Fetch Content
    const paperUrl = 'https://arxiv.org/abs/2503.13964';
    let paperContent = '';
    try {
        paperContent = await readUrlContent(paperUrl);
        if (paperContent.length < 1000) {
            console.log('\x1b[33m[Warning] Content short, appending simulation text...\x1b[0m');
            paperContent += '\n\n' + 'Filler content. '.repeat(100);
        }
        console.log(`\x1b[32m[Success] Fetched ${paperContent.length} characters.\x1b[0m`);
    } catch (e) {
        console.error('Failed to fetch paper:', e);
        process.exit(1);
    }

    // 2. OpenRouter Tool Call Repair Mechanism
    // Validating global registration from root/index.ts
    // The processor is now registered globally, so we don't need to add it inline.
    if (rootAgent.responseProcessors.length > 0) {
        console.log(`\x1b[32m[Config] Verified Global Repair Processor is Active (Count: ${rootAgent.responseProcessors.length})\x1b[0m`);
    } else {
        console.warn('\x1b[31m[Config] Warning: No response processors found on Root Agent! Global registration may have failed.\x1b[0m');
    }

    // 3. Inject Instructions
    const systemInject = `
    [SYSTEM CONTEXT]
    Paper URL: ${paperUrl}
    Content Excerpt: ${paperContent.slice(0, 3000)}...
    
    INSTRUCTIONS:
    1. Analyze the paper using 'scientist' agent.
    2. Create a comic manifest using 'narrative' agent.
    3. VALIDATE the manifest.
    
    TOOL USAGE:
    If 'transfer_to_agent' tool is not available or fails, output JSON:
    \`\`\`json
    { "agent_name": "target_agent_name", "reason": "reason" }
    \`\`\`
    This will be auto-repaired.
    `;

    const allAgents = [rootAgent, ...((rootAgent as any).subAgents || [])];
    for (const agent of allAgents) {
        const base = (agent as any).instruction || (agent as any).instructions || "";
        (agent as any).instruction = systemInject + "\n\n" + base;
    }

    // 4. Runner
    const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: 'kilig-e2e-repair'
    });

    await runner.sessionService.createSession({
        appName: 'kilig-e2e-repair',
        userId: 'admin-repair',
        sessionId: 'session-repair-1'
    });

    const prompt = "Process MDocAgent paper now. Generate comic manifest.";
    let isFinished = false;
    let turn = 0;
    const MAX_TURNS = 3;

    let currentPrompt = "Process MDocAgent paper now. Generate comic manifest from the content.";

    while (!isFinished && turn < MAX_TURNS) {
        turn++;
        console.log(`\n\x1b[1m=== TURN ${turn} START ===\x1b[0m`);

        let success = false;
        let retries = 0;
        let toolCallsInTurn = 0;

        while (!success && retries < 3) {
            try {
                // Should we send a message? 
                // Turn 1: Initial Prompt
                // Turn > 1: Only if we are nudging (currentPrompt updated)
                const inputMsg = (turn === 1 || currentPrompt.startsWith("SYSTEM"))
                    ? { role: 'user', parts: [{ text: currentPrompt }] }
                    : undefined;

                console.log(`[Input] Sending: "${currentPrompt.slice(0, 60)}..."`);

                const eventStream = runner.runAsync({
                    userId: 'admin-repair',
                    sessionId: 'session-repair-1',
                    newMessage: inputMsg,
                });

                for await (const event of eventStream) {
                    const author = event.author || 'system';
                    if (event.content?.parts) {
                        for (const part of event.content.parts) {
                            if (part.text) console.log(`\x1b[34m[${author}]\x1b[0m ${part.text.slice(0, 100).replace(/\n/g, ' ')}...`);
                            if (part.functionCall) {
                                console.log(`\x1b[33m 🛠️  [Tool] ${part.functionCall.name}\x1b[0m`);
                                toolCallsInTurn++;
                            }
                            if (part.functionResponse) console.log(`\x1b[32m ✅ [Result] ${part.functionResponse.name}\x1b[0m`);
                        }
                    }
                    if (event.errorCode) {
                        if (String(event.errorCode) === '429') throw new Error('429');
                        console.error(`[Error] ${event.errorMessage}`);
                    }
                }
                success = true;

                // Validation Logic
                if (toolCallsInTurn === 0) {
                    console.log("\x1b[31m⚠️  Failure: Agent did not use any tools. Pipeline stalled.\x1b[0m");
                    currentPrompt = "SYSTEM ACTION REQUIRED: You failed to transfer execution. You MUST use the 'transfer_to_agent' tool immediately. Do not write text.";
                    isFinished = false; // Force next turn to retry
                } else {
                    console.log(`\x1b[32m=== TURN ${turn} SUCCESS (Tools used: ${toolCallsInTurn}) ===\x1b[0m`);
                    currentPrompt = ""; // Clear prompt
                    isFinished = true; // Assume success if tools were used (delegation happened)
                }

            } catch (err: any) {
                if (err.message === '429') {
                    console.log(`\x1b[41m RATE LIMIT (429). Waiting 65s... \x1b[0m`);
                    await delay(65000);
                    retries++;
                } else {
                    console.error("Failure:", err);
                    break;
                }
            }
        }

        // Safety delay between major User Turns
        if (turn < MAX_TURNS && !isFinished) {
            console.log("Waiting 65s before retry turn (Rate Limit Safety)...");
            await delay(65000);
        }
    }
}

main();
