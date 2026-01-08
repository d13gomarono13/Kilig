import { BaseLlm, LlmRequest, LlmResponse, BaseLlmConnection } from '@google/adk';
import { Content, Part } from '@google/genai';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class GroqLlm extends BaseLlm {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  static readonly supportedModels = [
    /^groq\//,
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768'
  ];

  constructor(params: { model: string; apiKey?: string }) {
    super(params);
    this.apiKey = params.apiKey || process.env.GROQ_API_KEY || '';
  }

  async *generateContentAsync(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown> {
    console.log(`[GroqLlm] Generating content for model: ${this.model} (stream: ${!!stream})`);
    const messages: GroqMessage[] = [];

    // 1. System Instruction
    const systemInstruction = (llmRequest.config as any)?.systemInstruction;
    if (systemInstruction) {
      let text = '';
      if (typeof systemInstruction === 'string') {
        text = systemInstruction;
      } else if (systemInstruction.parts) {
        text = systemInstruction.parts.map((p: any) => p.text).join('\n');
      }
      if (text) {
        messages.push({ role: 'system', content: text });
      }
    }

    // 2. Map History
    let pendingToolCalls: Map<string, string> = new Map(); // name -> id

    for (const content of llmRequest.contents) {
      const role = content.role === 'model' ? 'assistant' : 'user';
      const parts = content.parts || [];

      const assistantTextParts: string[] = [];
      const assistantToolCalls: any[] = [];
      const toolResponseMessages: GroqMessage[] = [];

      for (const part of parts) {
        if (part.text) {
          if (role === 'assistant') assistantTextParts.push(part.text);
          else messages.push({ role: 'user', content: part.text });
        }

        if (part.functionCall) {
          const id = `call_${part.functionCall.name}_${Math.random().toString(36).substring(2, 7)}`;
          assistantToolCalls.push({
            id,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args)
            }
          });
          pendingToolCalls.set(part.functionCall.name, id);
        }

        if (part.functionResponse) {
          const id = pendingToolCalls.get(part.functionResponse.name as any) || `call_${part.functionResponse.name}_fixed`;
          toolResponseMessages.push({
            role: 'tool',
            tool_call_id: id,
            name: part.functionResponse.name as any,
            content: JSON.stringify(part.functionResponse.response)
          });
        }
      }

      if (role === 'assistant') {
        if (assistantTextParts.length > 0 || assistantToolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: assistantTextParts.join('\n') || null,
            tool_calls: assistantToolCalls.length > 0 ? assistantToolCalls : undefined
          });
        }
      }

      if (toolResponseMessages.length > 0) {
        messages.push(...toolResponseMessages);
      }
    }

    // 3. Prepare Tools
    const tools: any[] = [];
    if (llmRequest.toolsDict) {
      for (const [name, tool] of Object.entries(llmRequest.toolsDict)) {
        const declaration = (tool as any).declaration;
        if (declaration) {
          tools.push({
            type: 'function',
            function: {
              name: declaration.name,
              description: declaration.description,
              parameters: declaration.parameters
            }
          });
        }
      }
    }

    const payload: any = {
      model: this.model.replace('groq/', ''),
      messages,
      stream: !!stream
    };

    if (tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    console.log(`[GroqLlm] Sending Payload (truncated): ${JSON.stringify(payload).substring(0, 500)}...`);
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API ${response.status}: ${errText}`);
      }

      if (stream) {
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
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0]?.delta;
              if (!delta) continue;

              const responseParts: Part[] = [];
              if (delta.content) responseParts.push({ text: delta.content });

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.function?.name) {
                    responseParts.push({
                      functionCall: {
                        name: tc.function.name,
                        args: tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
                      }
                    });
                  }
                }
              }

              yield {
                content: { role: 'model', parts: responseParts },
                partial: true
              };
            }
          }
        }
      } else {
        const data = await response.json();
        if (data.usage) {
          console.log(`[GroqLlm] Usage RAW: ${JSON.stringify(data.usage)}`);
        }
        const choice = data.choices[0];
        const msg = choice.message;

        const responseParts: Part[] = [];
        let heuristicFound = false;

        if (msg.content) {
          console.log(`[GroqLlm] Raw Content: ${msg.content.substring(0, 100)}...`);
          // Dynamic Heuristic: Check for any available tool usage in text
          if (llmRequest.toolsDict) {
            console.log(`[GroqLlm] Available Tools: ${Object.keys(llmRequest.toolsDict).join(', ')}`);
            for (const toolName of Object.keys(llmRequest.toolsDict)) {
              // Regex to catch: tool_name(args)
              // We need to double escape backslashes for string constructor
              // Strict pattern: tool_name \s* ( \s* (?:param=)? ... )
              const toolRegex = new RegExp(`${toolName}\\s*\\(\\s*(?:[\\w]+\\s*=\\s*)?['"]?([^)]*)`, 'g');

              let match;
              while ((match = toolRegex.exec(msg.content)) !== null) {
                heuristicFound = true;
                let argsString = match[1] || '';

                let args: any = {};
                if (toolName === 'transfer_to_agent') {
                  // Robust inner match for transfer
                  // 1. Function style: transfer_to_agent(...)
                  let tMatch = msg.content.match(/transfer_to_agent\s*\(\s*(?:agent_name\s*=\s*)?['"]?([\w-]+)['"]?([^)]*)?\)/);

                  // 2. Command style: transfer_to_agent validator ...
                  if (!tMatch) {
                    tMatch = msg.content.match(/transfer_to_agent\s+['"]?([\w-]+)['"]?\s*(.*)/);
                  }

                  if (tMatch) {
                    const aName = tMatch[1].trim();
                    let tMsg = tMatch[2] ? tMatch[2].trim() : '';
                    tMsg = tMsg.replace(/^,\s*/, '').replace(/^(?:message|json_data|task)\s*=\s*/, '').replace(/^['"]/, '').replace(/['"]$/, '');
                    if (!tMsg) tMsg = `Transferring to ${aName}`;
                    // ADK expects camelCase 'agentName'
                    args = { agentName: aName, message: tMsg };
                  } else {
                    // If strict match fails, use the generic capture
                    // argsString has the content inside parens
                    const parts = argsString.split(',').map(s => s.trim());
                    const aName = parts[0].replace(/^(?:agent_name\s*=\s*)?['"]?([\w-]+)['"]?$/, '$1');
                    const tMsg = parts.slice(1).join(', ').replace(/^(?:message|json_data|task)\s*=\s*/, '').replace(/^['"]/, '').replace(/['"]$/, '');
                    args = { agentName: aName, message: tMsg || `Transferring to ${aName}` };
                  }
                } else {
                  // Generic Fallback
                  argsString = argsString.replace(/['"]?\s*\)?$/, '');

                  try {
                    args = JSON.parse(argsString);
                  } catch {
                    if (toolName.includes('validate')) args = { json_content: argsString };
                    else if (toolName.includes('save')) args = { manifest: argsString };
                    else args = { input: argsString };
                  }
                }

                console.log(`[GroqLlm] Heuristic: Detected text-based tool call to ${toolName}`);
                responseParts.push({
                  functionCall: {
                    name: toolName,
                    args: args
                  }
                });
              }
            }
          }

          if (!heuristicFound) {
            responseParts.push({ text: msg.content });
          }
        }

        if (msg.tool_calls) {
          for (const tc of msg.tool_calls) {
            responseParts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
              }
            });
          }
        }

        yield {
          content: { role: 'model', parts: responseParts },
          finishReason: choice.finish_reason === 'stop' ? 'STOP' : (choice.finish_reason === 'tool_calls' ? 'STOP' : 'OTHER') as any,
          usageMetadata: data.usage ? {
            promptTokenCount: data.usage.prompt_tokens,
            candidatesTokenCount: data.usage.completion_tokens,
            totalTokenCount: data.usage.total_tokens
          } : undefined
        };
      }
    } catch (e: any) {
      yield { errorCode: 'GROQ_ERROR', errorMessage: e.message };
    }
  }

  async connect(llmRequest: LlmRequest): Promise<BaseLlmConnection> {
    throw new Error('GroqLlm does not support live connection.');
  }
}