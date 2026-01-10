/**
 * Unit tests for the Query Rewriter Tool
 */
import { describe, it, expect, vi } from 'vitest';
import { rewriteQuery, rewriteQueryTool, RewriteResult } from './rewrite-query.js';

describe('Query Rewriter Tool', () => {
    describe('FunctionTool (heuristic mode)', () => {
        it('should expand LLM abbreviation', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'how do llm work',
                attemptNumber: 1
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.rewrittenQuery).toContain('large language model');
            expect(parsed.expansionsApplied).toContain('llm → large language model');
        });

        it('should expand NLP abbreviation', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'nlp techniques for text'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.rewrittenQuery).toContain('natural language processing');
        });

        it('should expand multiple abbreviations', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'using cnn for cv tasks'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.rewrittenQuery).toContain('convolutional neural network');
            expect(parsed.rewrittenQuery).toContain('computer vision');
        });

        it('should add generic academic terms when no abbreviations found', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'how to improve image classification'
            });
            const parsed = JSON.parse(result as string);

            // Should add some academic context
            expect(parsed.rewrittenQuery.length).toBeGreaterThan('how to improve image classification'.length);
            expect(parsed.rewrittenQuery).toMatch(/research|paper|method|approach|arxiv/);
        });

        it('should add arxiv context when missing paper reference', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'transformer attention mechanism'
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.rewrittenQuery).toContain('arxiv paper');
        });

        it('should not duplicate arxiv if already present', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'transformer paper from arxiv'
            });
            const parsed = JSON.parse(result as string);

            // Should not add "arxiv paper" again
            const arxivCount = (parsed.rewrittenQuery.match(/arxiv/g) || []).length;
            expect(arxivCount).toBe(1);
        });

        it('should not expand if full term already in query', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'natural language processing with llm'
            });
            const parsed = JSON.parse(result as string);

            // NLP expansion already present, only llm should be expanded
            expect(parsed.rewrittenQuery).toContain('large language model');
            // Should not have duplicate "natural language processing"
            const nlpCount = (parsed.rewrittenQuery.match(/natural language processing/g) || []).length;
            expect(nlpCount).toBe(1);
        });

        it('should track attempt number', async () => {
            const result = await (rewriteQueryTool as any).execute({
                originalQuery: 'test query',
                attemptNumber: 3
            });
            const parsed = JSON.parse(result as string);

            expect(parsed.attemptNumber).toBe(3);
        });
    });

    describe('rewriteQuery (LLM mode)', () => {
        it('should parse valid JSON response', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue({
                    content: '{"rewritten_query": "deep learning for image classification research paper", "reasoning": "Added domain-specific terms"}'
                })
            };

            const result = await rewriteQuery('image classification', mockLlm);

            expect(result.originalQuery).toBe('image classification');
            expect(result.rewrittenQuery).toBe('deep learning for image classification research paper');
            expect(result.reasoning).toBe('Added domain-specific terms');
        });

        it('should handle string LLM response', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"rewritten_query": "transformer architecture attention mechanism", "reasoning": "Expanded terms"}')
            };

            const result = await rewriteQuery('transformers', mockLlm);

            expect(result.rewrittenQuery).toBe('transformer architecture attention mechanism');
        });

        it('should handle alternate JSON key (rewrittenQuery vs rewritten_query)', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"rewrittenQuery": "alternate key format", "reasoning": "Test"}')
            };

            const result = await rewriteQuery('test query', mockLlm);

            expect(result.rewrittenQuery).toBe('alternate key format');
        });

        it('should fallback to keyword expansion on invalid JSON', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('This is not JSON')
            };

            const result = await rewriteQuery('neural networks', mockLlm);

            expect(result.rewrittenQuery).toContain('neural networks');
            expect(result.rewrittenQuery).toContain('research paper arxiv machine learning');
            expect(result.reasoning).toContain('Fallback');
        });

        it('should fallback when rewritten_query is missing from response', async () => {
            const mockLlm = {
                invoke: vi.fn().mockResolvedValue('{"reasoning": "No query provided"}')
            };

            const result = await rewriteQuery('original query', mockLlm);

            expect(result.rewrittenQuery).toContain('original query');
            expect(result.reasoning).toContain('Fallback');
        });

        it('should handle LLM errors gracefully', async () => {
            const mockLlm = {
                invoke: vi.fn().mockRejectedValue(new Error('API rate limit'))
            };

            const result = await rewriteQuery('test query', mockLlm);

            expect(result.rewrittenQuery).toContain('test query');
            expect(result.rewrittenQuery).toContain('research paper');
            expect(result.reasoning).toContain('Fallback');
            expect(result.reasoning).toContain('API rate limit');
        });
    });
});
