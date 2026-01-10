import { BaseLlm, LlmRequest, LlmResponse, BaseLlmConnection } from '@google/adk';
import { langfuse, getCurrentTraceId } from '../services/monitoring/langfuse.js';

/**
 * ResilientLlm: OpenRouter multi-model wrapper with automatic failover.
 * 
 * Features:
 * - Prioritized model stack (tries primary first, then fallbacks)
 * - Automatic retry on 429 rate limit errors
 * - Full ADK BaseLlm compatibility
 * - Tool calling support
 * 
 * Free Tier Limits (per model):
 * - 20 requests/minute
 * - 50 requests/day
 * 
 * With multi-model rotation, effective limit = 250+ requests/day
 */
export class ResilientLlm extends BaseLlm {
    private apiKey: string;
    private modelStack: string[];
    private currentModelIndex: number = 0;
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(params: { models: string[]; apiKey?: string }) {
        super({ model: params.models[0] });
        this.modelStack = params.models;
        this.apiKey = params.apiKey || process.env.OPENROUTER_API_KEY || '';

        if (!this.apiKey) {
            console.warn('[ResilientLlm] No OPENROUTER_API_KEY found. Add it to .env');
        }
    }

    // Models that are known to return text instead of native tool calls
    private POLYFILL_MODELS = [
        'google/gemma-3-27b-it:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen-2.5-coder-32b-instruct:free'
    ];

    async *generateContentAsync(
        llmRequest: LlmRequest,
        stream?: boolean
    ): AsyncGenerator<LlmResponse, void, unknown> {

        // Try each model in the stack
        for (let i = 0; i < this.modelStack.length; i++) {
            const modelId = this.modelStack[this.currentModelIndex];
            console.log(`[ResilientLlm] Trying model: ${modelId}`);

            // Disable streaming for polyfill models to allow parsing
            // We use includes() to match fuzzy versions if needed, but strict string match is safer for now.
            // Using fuzzy check since model IDs might have extra tags.
            const forceNoStream = this.POLYFILL_MODELS.some(m => modelId.includes(m.split(':')[0]));
            const shouldUseStream = stream && !forceNoStream;

            if (forceNoStream && stream) {
                console.log(`[ResilientLlm] Disabling streaming for ${modelId} to polyfill tool calls.`);
            }

            try {
                let successfulResponse = false;

                for await (const chunk of this.callOpenRouter(modelId, llmRequest, shouldUseStream)) {
                    // Check for rate limit
                    if (chunk.errorCode === '429') {
                        console.warn(`[ResilientLlm] Rate limit on ${modelId}, switching to next model...`);
                        this.currentModelIndex = (this.currentModelIndex + 1) % this.modelStack.length;
                        break;
                    }

                    // Check for other errors on first chunk
                    if (chunk.errorCode && !successfulResponse) {
                        console.error(`[ResilientLlm] Error from ${modelId}: ${chunk.errorMessage}`);
                        this.currentModelIndex = (this.currentModelIndex + 1) % this.modelStack.length;
                        break;
                    }

                    successfulResponse = true;
                    yield chunk;
                }

                if (successfulResponse) return; // Success, exit loop

            } catch (e: any) {
                console.error(`[ResilientLlm] Exception with ${modelId}:`, e.message);
                this.currentModelIndex = (this.currentModelIndex + 1) % this.modelStack.length;
            }
        }

        // All models failed
        yield {
            errorCode: 'ALL_MODELS_FAILED',
            errorMessage: `All ${this.modelStack.length} models failed or rate limited`
        };
    }

    private async *callOpenRouter(
        modelId: string,
        llmRequest: LlmRequest,
        stream?: boolean
    ): AsyncGenerator<LlmResponse, void, unknown> {

        const messages = this.buildMessages(llmRequest);
        const tools = this.buildTools(llmRequest);

        const payload: any = {
            model: modelId,
            messages,
            stream: !!stream
        };

        if (tools.length > 0) {
            payload.tools = tools;
            payload.tool_choice = 'auto';
        }

        const startTime = Date.now();
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://kilig.ai',
                'X-Title': 'Kilig Pipeline'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429) {
                yield { errorCode: '429', errorMessage: 'Rate Limit' };
                return;
            }
            const errText = await response.text();
            yield { errorCode: 'API_ERROR', errorMessage: `${response.status}: ${errText}` };
            return;
        }



        // ... (previous imports)

        // ...

        // Langfuse trace ID from request metadata or generated
        const traceId = (llmRequest.config as any)?.traceId || getCurrentTraceId() || `trace_llm_${Date.now()}`;

        if (stream) {
            // For now, only non-streaming provides easy usage metadata
            yield* this.handleStream(response);
        } else {
            const data = await response.json();
            const choice = data.choices?.[0];

            if (choice) {
                // Log to Langfuse
                try {
                    await langfuse.generation({
                        traceId,
                        name: `LLM Call: ${modelId}`,
                        startTime: new Date(startTime),
                        endTime: new Date(),
                        model: modelId,
                        modelParameters: {
                            temperature: 0.7
                        },
                        input: messages,
                        output: choice.message,
                        usage: data.usage ? {
                            promptTokens: data.usage.prompt_tokens,
                            completionTokens: data.usage.completion_tokens,
                            totalTokens: data.usage.total_tokens
                        } : undefined
                    });
                } catch (e) {
                    console.warn('[ResilientLlm] Failed to log generation to Langfuse:', e);
                }
            }

            yield* this.handleNonStreamResult(data);
        }
    }

    private async *handleNonStreamResult(data: any): AsyncGenerator<LlmResponse, void, unknown> {
        const choice = data.choices?.[0];

        if (!choice) {
            yield { errorCode: 'EMPTY_RESPONSE', errorMessage: 'No choices in response' };
            return;
        }

        const parts = this.buildResponseParts(choice.message);

        // POLYFILL: If no native tool calls, check text content for tool-like patterns
        const hasNativeTools = parts.some(p => p.functionCall);
        if (!hasNativeTools && parts.length > 0 && parts[0].text) {
            const polyfilled = this.parseToolCallsFromText(parts[0].text);
            if (polyfilled.length > 0) {
                console.log(`[ResilientLlm] Polyfilled ${polyfilled.length} tool calls from text.`);
                // Append tool calls to parts
                for (const tc of polyfilled) {
                    parts.push({
                        functionCall: {
                            name: tc.name,
                            args: tc.args,
                            // Use a polyfill marker ID
                            id: `call_poly_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
                        }
                    });
                }
            }
        }

        yield {
            content: {
                role: 'model',
                parts: parts
            },
            finishReason: (choice.finish_reason?.toUpperCase() || 'STOP') as any,
            usageMetadata: data.usage ? {
                promptTokenCount: data.usage.prompt_tokens,
                candidatesTokenCount: data.usage.completion_tokens,
                totalTokenCount: data.usage.total_tokens
            } : undefined
        } as LlmResponse;
    }

    private parseToolCallsFromText(text: string): { name: string, args: any }[] {
        const toolCalls: { name: string, args: any }[] = [];

        // Pattern 1: Markdown code block with tool_code or json
        // Matches ```tool_code ... ```
        const codeBlockRegex = /```(?:tool_code|json|python)?\s*([\s\S]*?)```/g;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            const content = match[1].trim();

            // Try 1: Direct Python-style call: name(args)
            // e.g. transfer_to_agent(agent_name='scientist', ...)
            const pythonCallRegex = /^([a-zA-Z0-9_]+)\(([\s\S]*)\)$/;
            const callMatch = pythonCallRegex.exec(content);

            if (callMatch) {
                const name = callMatch[1];
                const argsStr = callMatch[2];
                try {
                    // Quick-and-dirty parser for key='value' or key="value"
                    const args: any = {};
                    // Match key=value where value is quoted string (handling escaped quotes poorly but often sufficiently)
                    // or numbers/booleans
                    const paramRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:(['"])((?:\\\2|(?!\2).)*)\2|([0-9.]+|true|false))/g;
                    let paramMatch;
                    let foundArgs = false;
                    while ((paramMatch = paramRegex.exec(argsStr)) !== null) {
                        let key = paramMatch[1];
                        const strVal = paramMatch[3]; // The string content
                        const rawVal = paramMatch[4]; // The number/bool

                        // Normalization for common failures (Gemma prefers snake_case)
                        if (key === 'agent_name') key = 'agentName';

                        if (strVal !== undefined) {
                            args[key] = strVal; // Unescape if needed?
                        } else if (rawVal !== undefined) {
                            args[key] = JSON.parse(rawVal);
                        }
                        foundArgs = true;
                    }

                    if (foundArgs) {
                        toolCalls.push({ name, args });
                        continue;
                    }
                } catch (e) {
                    // ignore
                }
            }

            // Try 2: Raw JSON?
            try {
                // If the block is just JSON object
                if (content.startsWith('{') && content.endsWith('}')) {
                    // Wait, we need the tool name. 
                    // Usually JSON tool calls are { "tool": "name", "args": ... } or similar if strictly prompted.
                    // But Gemma output Python.
                }
            } catch (e) { }
        }

        return toolCalls;
    }

    private async *handleStream(response: Response): AsyncGenerator<LlmResponse, void, unknown> {
        const reader = (response.body as any).getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === 'data: [DONE]') continue;
                if (!line.startsWith('data: ')) continue;

                try {
                    const data = JSON.parse(line.slice(6));
                    const delta = data.choices?.[0]?.delta;
                    if (!delta) continue;

                    yield {
                        content: {
                            role: 'model',
                            parts: this.buildResponseParts(delta)
                        },
                        partial: true
                    } as LlmResponse;
                } catch (e) {
                    // Skip malformed chunks
                }
            }
        }
    }


    private buildMessages(req: LlmRequest): any[] {
        const msgs: any[] = [];

        // System instruction
        const sys = (req.config as any)?.systemInstruction;
        if (sys) {
            const text = typeof sys === 'string'
                ? sys
                : sys.parts?.map((p: any) => p.text).join('\n');
            if (text) msgs.push({ role: 'system', content: text });
        }

        // Track tool calls to match responses
        // Maps tool name to list of IDs (fifo for multiple calls to same tool)
        let pendingToolCalls: Record<string, string[]> = {};

        // Conversation history
        for (const content of req.contents) {
            const role = content.role === 'model' ? 'assistant' : 'user';
            const parts = content.parts || [];

            // Text content
            const textParts = parts.filter(p => p.text).map(p => p.text);

            // Tool calls (from assistant)
            const toolCalls = parts.filter(p => p.functionCall).map(p => {
                // Use preserved ID or generate a stable one based on content if possible, 
                // but random is safer than collision if we don't have the original.
                // Crucially, we store this ID in pendingToolCalls for the response to use.
                const existingId = (p.functionCall as any).id;
                const callId = existingId || `call_${(p.functionCall!.name as string).slice(0, 10)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

                return {
                    id: callId,
                    type: 'function',
                    function: {
                        name: p.functionCall!.name,
                        arguments: JSON.stringify(p.functionCall!.args)
                    }
                };
            });

            if (toolCalls.length > 0) {
                // Reset pending for this new turn of calls? 
                // Usually tool calls happen in one turn, then responses in next.
                // We append to allow for accumulation if needed, but usually we clear on new assistant turn?
                // Actually, OpenAI expects responses to match the immediately preceding assistant message.
                pendingToolCalls = {};
                for (const tc of toolCalls) {
                    const funcName = tc.function.name;
                    if (funcName) {
                        if (!pendingToolCalls[funcName]) pendingToolCalls[funcName] = [];
                        pendingToolCalls[funcName].push(tc.id);
                    }
                }
            }

            // Tool responses
            const toolResponses = parts.filter(p => p.functionResponse).map(p => {
                const name = p.functionResponse!.name || 'unknown';
                // Get the ID for this tool call
                const callId = (name !== 'unknown' && pendingToolCalls[name])
                    ? pendingToolCalls[name].shift()
                    : `call_${name.slice(0, 10)}_${Date.now()}`;

                return {
                    role: 'tool',
                    tool_call_id: callId || `call_${name.slice(0, 10)}_fallback`,
                    name: name,
                    content: JSON.stringify(p.functionResponse!.response)
                };
            });

            if (textParts.length > 0 || toolCalls.length > 0) {
                msgs.push({
                    role,
                    content: textParts.join('\n') || null,
                    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {})
                });
            }

            msgs.push(...toolResponses);
        }

        return msgs;
    }

    private buildTools(req: LlmRequest): any[] {
        if (!req.toolsDict) return [];

        return Object.entries(req.toolsDict).map(([_, tool]) => {
            const dec = (tool as any).declaration;
            if (!dec) return null;
            return {
                type: 'function',
                function: {
                    name: dec.name,
                    description: dec.description,
                    parameters: dec.parameters
                }
            };
        }).filter(Boolean);
    }

    private buildResponseParts(msg: any): any[] {
        const parts: any[] = [];

        if (msg?.content) {
            parts.push({ text: msg.content });
        }

        if (msg?.tool_calls) {
            for (const tc of msg.tool_calls) {
                try {
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments || '{}'),
                            id: tc.id // Preserve the original ID from the provider
                        }
                    });
                } catch (e) {
                    // Skip malformed tool calls
                }
            }
        }

        return parts;
    }

    async connect(llmRequest: LlmRequest): Promise<BaseLlmConnection> {
        throw new Error('ResilientLlm does not support live connections.');
    }
}
