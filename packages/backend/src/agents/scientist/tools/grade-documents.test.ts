/**
 * Unit tests for the Document Grader Tool
 */
import { describe, it, expect, vi } from 'vitest';
import { gradeDocuments, gradeDocumentsTool } from './grade-documents.js';

describe('Document Grader Tool', () => {
    describe('FunctionTool (heuristic mode)', () => {
        it('should return high score when context contains question keywords', async () => {
            const result = await gradeDocumentsTool.execute({
                context: 'The transformer architecture revolutionized natural language processing by introducing self-attention mechanisms.',
                question: 'What is the transformer architecture in NLP?'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.isRelevant).toBe(true);
            expect(parsed.score).toBeGreaterThanOrEqual(0.5);
            expect(parsed.routingDecision).toBe('generate_answer');
        });

        it('should return low score when context has no keyword overlap', async () => {
            const result = await gradeDocumentsTool.execute({
                context: 'This paper discusses advancements in semiconductor manufacturing processes for chip fabrication.',
                question: 'How do neural networks learn patterns?'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.isRelevant).toBe(false);
            expect(parsed.routingDecision).toBe('rewrite_query');
        });

        it('should handle empty context', async () => {
            const result = await gradeDocumentsTool.execute({
                context: '',
                question: 'What is deep learning?'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.isRelevant).toBe(false);
            expect(parsed.score).toBe(0);
            expect(parsed.reasoning).toContain('too short');
            expect(parsed.routingDecision).toBe('rewrite_query');
        });

        it('should handle partial keyword matches', async () => {
            const result = await gradeDocumentsTool.execute({
                context: 'Machine learning models can be trained on large datasets to recognize patterns in images.',
                question: 'How does machine learning work with datasets?'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.isRelevant).toBe(true);
            expect(parsed.keywordsFound).toBeGreaterThan(0);
        });
    });

    describe('gradeDocuments (LLM mode)', () => {
        it('should parse valid JSON response and mark as relevant', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue({
                    content: '{"binary_score": "yes", "reasoning": "Context directly answers the question"}'
                })
            };

            const result = await gradeDocuments(
                'Transformers use self-attention to process sequences.',
                'What are transformers?',
                mockLlm
            );

            expect(result.isRelevant).toBe(true);
            expect(result.score).toBe(1.0);
            expect(result.reasoning).toBe('Context directly answers the question');
        });

        it('should parse valid JSON response and mark as not relevant', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"binary_score": "no", "reasoning": "Context is about a different topic"}')
            };

            const result = await gradeDocuments(
                'The economics of supply chains...',
                'What is deep learning?',
                mockLlm
            );

            expect(result.isRelevant).toBe(false);
            expect(result.score).toBe(0.0);
        });

        it('should return not relevant for empty context', async () => {
            const mockLlm = { invoke: vi.fn() };

            const result = await gradeDocuments('', 'Test question', mockLlm);

            expect(result.isRelevant).toBe(false);
            expect(result.score).toBe(0);
            expect(result.reasoning).toBe('No context provided');
            expect(mockLlm.invoke).not.toHaveBeenCalled();
        });

        it('should fallback to heuristic on invalid JSON', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('This is not valid JSON')
            };

            const result = await gradeDocuments(
                'This is a long enough context with over 50 characters to pass the heuristic check.',
                'Test question',
                mockLlm
            );

            expect(result.isRelevant).toBe(true);
            expect(result.score).toBe(0.6);
            expect(result.reasoning).toContain('Fallback heuristic');
        });

        it('should handle LLM errors gracefully', async () => {
            const mockLlm = {
                invoke: vi.fn().mockRejectedValue(new Error('API timeout'))
            };

            const result = await gradeDocuments(
                'A valid context that should work even if the LLM fails.',
                'Test question',
                mockLlm
            );

            expect(result.isRelevant).toBe(true);
            expect(result.score).toBe(0.5);
            expect(result.reasoning).toContain('Fallback');
        });
    });
});
