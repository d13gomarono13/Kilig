/**
 * Unit tests for the Guardrail Tool
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateGuardrail, guardrailTool, GuardrailResult } from './guardrail.js';

describe('Guardrail Tool', () => {
    describe('FunctionTool (heuristic mode)', () => {
        it('should return high score for queries with multiple academic keywords', async () => {
            const result = await guardrailTool.execute({
                query: 'transformer neural network research paper on NLP',
                threshold: 50
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.score).toBe(90);
            expect(parsed.isInScope).toBe(true);
            expect(parsed.shouldProceed).toBe(true);
        });

        it('should return medium score for queries with some academic relevance', async () => {
            const result = await guardrailTool.execute({
                query: 'latest AI developments',
                threshold: 50
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.score).toBe(70);
            expect(parsed.isInScope).toBe(true);
        });

        it('should return medium score for question queries without keywords', async () => {
            const result = await guardrailTool.execute({
                query: 'How does this work?',
                threshold: 50
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.score).toBe(50);
            expect(parsed.isInScope).toBe(true);
        });

        it('should return low score for off-topic queries', async () => {
            const result = await guardrailTool.execute({
                query: 'best pizza places near me',
                threshold: 50
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.score).toBe(30);
            expect(parsed.isInScope).toBe(false);
            expect(parsed.shouldProceed).toBe(false);
        });

        it('should respect custom threshold', async () => {
            const result = await guardrailTool.execute({
                query: 'machine learning',
                threshold: 80
            });
            const parsed = JSON.parse(result as string);

            // Score is 70 for single keyword, but threshold is 80
            expect(parsed.score).toBe(70);
            expect(parsed.isInScope).toBe(false);
        });
    });

    describe('evaluateGuardrail (LLM mode)', () => {
        it('should parse valid JSON response from LLM', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue({
                    content: '{"score": 85, "reason": "Query is about research"}'
                })
            };

            const result = await evaluateGuardrail('transformer paper', mockLlm, 50);

            expect(result.score).toBe(85);
            expect(result.reason).toBe('Query is about research');
            expect(result.isInScope).toBe(true);
            expect(mockLlm.invoke).toHaveBeenCalledTimes(1);
        });

        it('should handle string LLM response', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"score": 30, "reason": "Off-topic query"}')
            };

            const result = await evaluateGuardrail('pizza recipe', mockLlm, 50);

            expect(result.score).toBe(30);
            expect(result.isInScope).toBe(false);
        });

        it('should clamp score between 0 and 100', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"score": 150, "reason": "Invalid score"}')
            };

            const result = await evaluateGuardrail('test query', mockLlm);

            expect(result.score).toBe(100);
        });

        it('should return default on invalid JSON', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('This is not JSON')
            };

            const result = await evaluateGuardrail('test query', mockLlm);

            expect(result.score).toBe(50);
            expect(result.reason).toBe('Failed to parse response');
            expect(result.isInScope).toBe(true);
        });

        it('should handle LLM errors gracefully', async () => {
            const mockLlm = {
                invoke: vi.fn().mockRejectedValue(new Error('API Error'))
            };

            const result = await evaluateGuardrail('test query', mockLlm);

            expect(result.score).toBe(50);
            expect(result.reason).toContain('Evaluation failed');
            expect(result.isInScope).toBe(true);
        });
    });
});
