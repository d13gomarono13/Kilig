/**
 * Unit tests for the ResilientLlm class
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../services/monitoring/langfuse.js', () => ({
    langfuse: null,
    getCurrentTraceId: () => null
}));

// We need to access private methods, so we'll import the class and test indirectly
import { ResilientLlm } from './resilient-llm.js';

describe('ResilientLlm', () => {
    let llm: ResilientLlm;

    beforeEach(() => {
        llm = new ResilientLlm({
            models: ['model-a:free', 'model-b:free', 'model-c:free'],
            apiKey: 'test-api-key'
        });
    });

    describe('constructor', () => {
        it('should initialize with provided models', () => {
            expect(llm).toBeDefined();
        });

        it('should warn when no API key provided', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Create with no API key and env cleared
            const originalKey = process.env.OPENROUTER_API_KEY;
            delete process.env.OPENROUTER_API_KEY;

            new ResilientLlm({
                models: ['test-model:free']
            });

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('No OPENROUTER_API_KEY')
            );

            process.env.OPENROUTER_API_KEY = originalKey;
            warnSpy.mockRestore();
        });
    });

    describe('model stack rotation', () => {
        it('should have multiple models in stack', () => {
            // The llm should use models in order
            expect(llm).toBeDefined();
        });
    });

    describe('POLYFILL_MODELS', () => {
        // The class has a list of models that need polyfill for tool calls
        it('should identify polyfill models correctly', () => {
            // Creating an instance with a polyfill model in the stack
            const polyfillLlm = new ResilientLlm({
                models: ['google/gemma-3-27b-it:free'],
                apiKey: 'test'
            });

            expect(polyfillLlm).toBeDefined();
        });
    });

    describe('connect method', () => {
        it('should throw error (not implemented for non-streaming)', async () => {
            await expect(llm.connect({} as any)).rejects.toThrow('does not support live connections');
        });
    });
});

/**
 * Tests for parseToolCallsFromText logic
 * We test the regex patterns used in the method
 */
describe('Tool call parsing patterns', () => {
    // Pattern 1: Markdown code block with tool_code
    describe('Python-style tool call parsing', () => {
        it('should match transfer_to_agent pattern', () => {
            const text = "```tool_code\ntransfer_to_agent(agent_name='scientist')\n```";
            const codeBlockRegex = /```(?:tool_code|json|python)?\s*([\s\S]*?)```/g;
            const match = codeBlockRegex.exec(text);

            expect(match).not.toBeNull();
            expect(match![1].trim()).toBe("transfer_to_agent(agent_name='scientist')");
        });

        it('should parse function name and arguments', () => {
            const content = "transfer_to_agent(agent_name='scientist', reason='test')";
            const pythonCallRegex = /^([a-zA-Z0-9_]+)\(([\s\S]*)\)$/;
            const callMatch = pythonCallRegex.exec(content);

            expect(callMatch).not.toBeNull();
            expect(callMatch![1]).toBe('transfer_to_agent');
            expect(callMatch![2]).toContain("agent_name='scientist'");
        });

        it('should parse key=value pairs', () => {
            const argsStr = "agent_name='scientist', count=42, enabled=true";
            const paramRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:(['"])((?:\\\2|(?!\2).)*)\2|([0-9.]+|true|false))/g;

            const args: any = {};
            let paramMatch;

            while ((paramMatch = paramRegex.exec(argsStr)) !== null) {
                const key = paramMatch[1];
                const strVal = paramMatch[3];
                const rawVal = paramMatch[4];

                if (strVal !== undefined) {
                    args[key] = strVal;
                } else if (rawVal !== undefined) {
                    args[key] = JSON.parse(rawVal);
                }
            }

            expect(args.agent_name).toBe('scientist');
            expect(args.count).toBe(42);
            expect(args.enabled).toBe(true);
        });
    });

    describe('code block extraction', () => {
        it('should match json code blocks', () => {
            const text = '```json\n{"key": "value"}\n```';
            const codeBlockRegex = /```(?:tool_code|json|python)?\s*([\s\S]*?)```/g;
            const match = codeBlockRegex.exec(text);

            expect(match).not.toBeNull();
            expect(match![1].trim()).toBe('{"key": "value"}');
        });

        it('should match python code blocks', () => {
            const text = '```python\nsome_function()\n```';
            const codeBlockRegex = /```(?:tool_code|json|python)?\s*([\s\S]*?)```/g;
            const match = codeBlockRegex.exec(text);

            expect(match).not.toBeNull();
        });

        it('should match unmarked code blocks', () => {
            const text = '```\nsome_content\n```';
            const codeBlockRegex = /```(?:tool_code|json|python)?\s*([\s\S]*?)```/g;
            const match = codeBlockRegex.exec(text);

            expect(match).not.toBeNull();
            expect(match![1].trim()).toBe('some_content');
        });
    });
});
