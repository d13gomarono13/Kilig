/**
 * Query Rewriter Tool for Agentic RAG
 * 
 * Rewrites queries to improve document retrieval when initial results are poor.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const REWRITE_PROMPT = `You are a query rewriter for an academic paper search system.

The original query did not return sufficiently relevant results. Your task is to rewrite the query to improve retrieval while preserving the user's intent.

STRATEGIES:
1. Add domain-specific terminology (e.g., "machine learning", "neural network")
2. Expand abbreviations (e.g., "NLP" → "natural language processing")
3. Include related concepts that might appear in academic papers
4. Make the query more specific if it's too vague
5. Add temporal context if relevant (e.g., "recent", "state-of-the-art")

ORIGINAL QUERY: {question}

Respond in JSON format:
{
  "rewritten_query": "<improved query for document retrieval>",
  "reasoning": "<brief explanation of how you improved the query>"
}`;

export interface RewriteResult {
    originalQuery: string;
    rewrittenQuery: string;
    reasoning: string;
}

/**
 * Rewrite a query using LLM
 */
export async function rewriteQuery(
    originalQuery: string,
    llm: any
): Promise<RewriteResult> {
    console.log(`[QueryRewriter] Rewriting: "${originalQuery.slice(0, 50)}..."`);

    try {
        const prompt = REWRITE_PROMPT.replace('{question}', originalQuery);

        const response = await llm.invoke(prompt);
        const content = typeof response === 'string' ? response : response.content;

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            console.warn('[QueryRewriter] Failed to parse LLM response');
            // Fallback: simple keyword expansion
            const rewrittenQuery = `${originalQuery} research paper arxiv machine learning`;
            return {
                originalQuery,
                rewrittenQuery,
                reasoning: 'Fallback: Simple keyword expansion',
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const rewrittenQuery = parsed.rewritten_query?.trim() || parsed.rewrittenQuery?.trim();

        if (!rewrittenQuery) {
            throw new Error('No rewritten query in response');
        }

        console.log(`[QueryRewriter] Rewritten: "${rewrittenQuery.slice(0, 50)}..."`);

        return {
            originalQuery,
            rewrittenQuery,
            reasoning: parsed.reasoning || 'Query improved for better retrieval',
        };
    } catch (error) {
        console.error('[QueryRewriter] Rewrite failed:', error);
        // Fallback expansion
        const rewrittenQuery = `${originalQuery} research paper arxiv machine learning`;
        return {
            originalQuery,
            rewrittenQuery,
            reasoning: `Fallback expansion (error): ${error}`,
        };
    }
}

/**
 * Query Rewriter Tool for ADK Agent
 */
export const rewriteQueryTool = new FunctionTool({
    name: 'rewrite_search_query',
    description: 'Rewrites a search query to improve document retrieval when initial results are poor. Adds domain-specific terminology and makes the query more specific.',
    parameters: z.object({
        originalQuery: z.string().describe('The original query that returned poor results'),
        attemptNumber: z.number().optional().describe('Which rewrite attempt this is (for tracking)'),
    }),
    execute: async ({ originalQuery, attemptNumber = 1 }) => {
        console.log(`[RewriteQueryTool] Attempt ${attemptNumber}: "${originalQuery.slice(0, 50)}..."`);

        // Domain-specific expansions
        const expansions: Record<string, string[]> = {
            'llm': ['large language model', 'transformer', 'GPT'],
            'nlp': ['natural language processing', 'text analysis'],
            'cv': ['computer vision', 'image recognition', 'deep learning'],
            'rl': ['reinforcement learning', 'policy gradient', 'Q-learning'],
            'gan': ['generative adversarial network', 'image generation'],
            'cnn': ['convolutional neural network', 'deep learning'],
            'rnn': ['recurrent neural network', 'sequence modeling'],
            'bert': ['BERT', 'transformer', 'pre-training'],
            'attention': ['attention mechanism', 'transformer', 'self-attention'],
        };

        let rewrittenQuery = originalQuery;
        let expansionsApplied: string[] = [];

        // Apply expansions
        const queryLower = originalQuery.toLowerCase();
        for (const [abbrev, terms] of Object.entries(expansions)) {
            if (queryLower.includes(abbrev) && !queryLower.includes(terms[0].toLowerCase())) {
                // Add the first expansion if not already present
                rewrittenQuery += ` ${terms[0]}`;
                expansionsApplied.push(`${abbrev} → ${terms[0]}`);
            }
        }

        // Add generic academic terms if no expansions applied
        if (expansionsApplied.length === 0) {
            const academicTerms = ['research', 'paper', 'method', 'approach'];
            const missingTerms = academicTerms.filter(t => !queryLower.includes(t));
            if (missingTerms.length > 0) {
                rewrittenQuery += ` ${missingTerms.slice(0, 2).join(' ')}`;
                expansionsApplied.push(`Added: ${missingTerms.slice(0, 2).join(', ')}`);
            }
        }

        // Add "arxiv" for academic context if not present
        if (!queryLower.includes('arxiv') && !queryLower.includes('paper')) {
            rewrittenQuery += ' arxiv paper';
            expansionsApplied.push('Added: arxiv paper');
        }

        const reasoning = expansionsApplied.length > 0
            ? `Applied expansions: ${expansionsApplied.join('; ')}`
            : 'Query already well-formed, minor refinements applied';

        return JSON.stringify({
            originalQuery,
            rewrittenQuery: rewrittenQuery.trim(),
            reasoning,
            attemptNumber,
            expansionsApplied,
        });
    },
});
