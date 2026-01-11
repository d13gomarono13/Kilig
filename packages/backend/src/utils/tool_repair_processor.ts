
/**
 * Tool Call Repair Processor
 * 
 * Intercepts textual JSON tool calls from OpenRouter/Free models (e.g., Xiaomi Mimo, DeepSeek)
 * and converts them into native ADK FunctionCall objects.
 * 
 * Issue addressed: Some models output ```json { "agent_name": "..." } ``` instead of calling the tool.
 */
export const toolCallRepairProcessor = {
    async *runAsync(arg1: any, arg2: any) {
        // console.log('[ToolRepair] Processor INVOKED');
        try {
            // Heuristic to find response object (it has candidates)
            let response = arg1;
            if (!response?.candidates && arg2?.candidates) {
                response = arg2;
            }

            const candidate = response?.candidates?.[0];
            if (!candidate?.content?.parts) return;

            // Iterate all parts
            for (let i = 0; i < candidate.content.parts.length; i++) {
                const text = candidate.content.parts[i].text;

                // Debug to trace match logic
                if (text && text.includes('agent_name')) {
                    console.log(`[ToolRepair] Found agent_name in Part ${i}`);
                    // console.log(`[ToolRepair] Sample: ${text.slice(0, 50).replace(/\n/g, ' ')}...`);
                }

                // Check for explicit <tool_call> tag (XML-style)
                // Lenient regex: allows missing closing tag if model stops early
                const toolCallMatch = text.match(/<tool_call>([\s\S]*?)(<\/tool_call>|$)/);
                if (toolCallMatch) {
                    const jsonContent = toolCallMatch[1].trim();
                    console.log(`[ToolRepair] Found <tool_call> tag. Content: ${jsonContent}`);
                    try {
                        const json = JSON.parse(jsonContent);
                        if (json.agent_name) {
                            console.log(`[ToolRepair] Converting <tool_call> to ToolCall: transfer_to_agent("${json.agent_name}")`);
                            candidate.content.parts = [{
                                functionCall: {
                                    name: 'transfer_to_agent',
                                    args: { agentName: json.agent_name }
                                }
                            }];
                            return;
                        }

                        // Generic tool call repair
                        // Search for name/tool/function property
                        const toolName = json.name || json.tool || json.function || json.tool_name;
                        const toolArgs = json.args || json.arguments || json.parameters || json.input || json; // fallback to root object if no args key

                        // If fallback to root, remove the name key to avoid passing it as arg
                        if (toolArgs === json && toolName) {
                            // clean up known name keys
                            delete toolArgs.name;
                            delete toolArgs.tool;
                            delete toolArgs.function;
                            delete toolArgs.tool_name;
                        }

                        if (toolName) {
                            console.log(`[ToolRepair] Converting <tool_call> to Generic ToolCall: ${toolName}(${JSON.stringify(toolArgs)})`);
                            candidate.content.parts = [{
                                functionCall: {
                                    name: toolName,
                                    args: toolArgs
                                }
                            }];
                            return;
                        }
                    } catch (e) {
                        console.error('[ToolRepair] Failed to parse JSON in <tool_call>:', e);
                    }
                }

                // Check for loose JSON-like tool call patterns
                if (text && (text.includes('```json') || text.includes('{')) && text.includes('agent_name')) {

                    // Regex to find the JSON object containing agent_name
                    const jsonMatch = text.match(/\{[\s\S]*"agent_name"[\s\S]*\}/);

                    if (jsonMatch) {
                        try {
                            const json = JSON.parse(jsonMatch[0]);

                            if (json.agent_name) {
                                console.log(`[ToolRepair] Converting text intent to ToolCall: transfer_to_agent("${json.agent_name}")`);

                                // Mutate the *entire* parts array to be just the function call
                                candidate.content.parts = [{
                                    functionCall: {
                                        name: 'transfer_to_agent',
                                        args: { agentName: json.agent_name }
                                    }
                                }];
                                return; // Stop processing after first fix
                            }
                        } catch (parseError) {
                            console.warn('[ToolRepair] JSON parse failed for loose match:', parseError);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[ToolRepair] Unexpected error in processor:', e);
        }
        // Yield nothing as we modified in-place
    }
};
