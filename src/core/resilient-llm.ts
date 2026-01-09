import { BaseLlm, LlmRequest, LlmResponse, BaseLlmConnection } from '@google/adk';

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

    async *generateContentAsync(
        llmRequest: LlmRequest,
        stream?: boolean
    ): AsyncGenerator<LlmResponse, void, unknown> {

        // Try each model in the stack
        for (let i = 0; i < this.modelStack.length; i++) {
            const modelId = this.modelStack[this.currentModelIndex];
            console.log(`[ResilientLlm] Trying model: ${modelId}`);

            try {
                let successfulResponse = false;

                for await (const chunk of this.callOpenRouter(modelId, llmRequest, stream)) {
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

        if (stream) {
            yield* this.handleStream(response);
        } else {
            yield* this.handleNonStream(response);
        }
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

    private async *handleNonStream(response: Response): AsyncGenerator<LlmResponse, void, unknown> {
        const data = await response.json();
        const choice = data.choices?.[0];

        if (!choice) {
            yield { errorCode: 'EMPTY_RESPONSE', errorMessage: 'No choices in response' };
            return;
        }

        yield {
            content: {
                role: 'model',
                parts: this.buildResponseParts(choice.message)
            },
            finishReason: (choice.finish_reason?.toUpperCase() || 'STOP') as any,
            usageMetadata: data.usage ? {
                promptTokenCount: data.usage.prompt_tokens,
                candidatesTokenCount: data.usage.completion_tokens,
                totalTokenCount: data.usage.total_tokens
            } : undefined
        } as LlmResponse;
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

        // Conversation history
        for (const content of req.contents) {
            const role = content.role === 'model' ? 'assistant' : 'user';
            const parts = content.parts || [];

            // Text content
            const textParts = parts.filter(p => p.text).map(p => p.text);

            // Tool calls (from assistant)
            const toolCalls = parts.filter(p => p.functionCall).map(p => ({
                id: `call_${(p.functionCall!.name as string).slice(0, 10)}_${Date.now()}`,
                type: 'function',
                function: {
                    name: p.functionCall!.name,
                    arguments: JSON.stringify(p.functionCall!.args)
                }
            }));

            // Tool responses
            const toolResponses = parts.filter(p => p.functionResponse).map(p => ({
                role: 'tool',
                tool_call_id: `call_${(p.functionResponse!.name as string).slice(0, 10)}_fixed`,
                name: p.functionResponse!.name,
                content: JSON.stringify(p.functionResponse!.response)
            }));

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
                            args: JSON.parse(tc.function.arguments || '{}')
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
