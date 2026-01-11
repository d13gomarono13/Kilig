/**
 * Loop Guard Processor (Response Processor)
 * 
 * Prevents an agent from transferring execution to itself.
 * Intercepts LlmResponse and checks for 'transfer_to_agent' tool calls.
 */
export const createLoopGuard = (currentAgentName: string) => {
    return {
        async *runAsync(response: any, context: any) {
            // response is LlmResponse (or similar structure in ADK)
            // It might be a stream chunk or full response.

            // Check if we have candidates/content
            const candidate = response?.candidates?.[0];
            if (!candidate?.content?.parts) {
                yield response;
                return;
            }

            const parts = candidate.content.parts;
            let loopDetected = false;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part.functionCall && part.functionCall.name === 'transfer_to_agent') {
                    const args = part.functionCall.args;
                    const targetInfo = args['agentName'] || args['agent_name'];

                    if (typeof targetInfo === 'string' && targetInfo.toLowerCase() === currentAgentName.toLowerCase()) {
                        console.warn(`[LoopGuard] Prevented self-transfer loop in agent '${currentAgentName}'`);
                        loopDetected = true;

                        // Replace the tool call with a text message to the model
                        // effectively "hallucinating" a correction for it.
                        parts[i] = {
                            text: `[SYSTEM ERROR] You attempted to transfer to '${targetInfo}', which is yourself. You are already the active agent. Please proceed with the task locally.`
                        };
                    }
                }
            }

            // If we modified parts, we yield the modified response
            // ADK processors usually yield the modified object.
            yield response;
        }
    } as any;
};
