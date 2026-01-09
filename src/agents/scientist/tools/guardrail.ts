/**
 * Guardrail Tool for Agentic RAG
 * 
 * Validates if a query is within scope (CS/AI/ML research papers).
 * Uses structured LLM output for consistent scoring.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const GUARDRAIL_PROMPT = `You are a query classifier for an academic paper search system focused on Computer Science, AI, and Machine Learning research.

Evaluate whether the following query is within scope for searching academic papers.

SCORING CRITERIA:
- 100: Clearly about CS/AI/ML research, papers, methods, or algorithms
- 75-99: Related to tech/science but may be peripheral to core CS/AI/ML
- 50-74: Ambiguous or could have academic relevance
- 25-49: Mostly off-topic but has some tangential relevance
- 0-24: Completely off-topic (personal questions, entertainment, etc.)

USER QUERY: {question}

Respond in JSON format:
{
  "score": <0-100>,
  "reason": "<brief explanation>"
}`;

export interface GuardrailResult {
    score: number;
    reason: string;
    isInScope: boolean;
}

/**
 * Evaluate a query for scope relevance
 */
export async function evaluateGuardrail(
    query: string,
    llm: any,
    threshold: number = 50
): Promise<GuardrailResult> {
    console.log(`[Guardrail] Evaluating query: "${query.slice(0, 50)}..."`);

    try {
        const prompt = GUARDRAIL_PROMPT.replace('{question}', query);

        // Get response from LLM
        const response = await llm.invoke(prompt);
        const content = typeof response === 'string' ? response : response.content;

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            console.warn('[Guardrail] Failed to parse LLM response, using default');
            return { score: 50, reason: 'Failed to parse response', isInScope: true };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const score = Math.max(0, Math.min(100, Number(parsed.score) || 50));
        const reason = parsed.reason || 'No reason provided';

        console.log(`[Guardrail] Score: ${score}, Reason: ${reason}`);

        return {
            score,
            reason,
            isInScope: score >= threshold,
        };
    } catch (error) {
        console.error('[Guardrail] Evaluation failed:', error);
        // Default to allowing the query
        return { score: 50, reason: `Evaluation failed: ${error}`, isInScope: true };
    }
}

/**
 * Guardrail Tool for ADK Agent
 */
export const guardrailTool = new FunctionTool({
    name: 'validate_query_scope',
    description: 'Validates if a user query is within scope for academic paper search (CS/AI/ML). Returns a score 0-100 and determines if the query should proceed.',
    parameters: z.object({
        query: z.string().describe('The user query to validate'),
        threshold: z.number().optional().describe('Minimum score to be considered in-scope (default: 50)'),
    }),
    execute: async ({ query, threshold = 50 }) => {
        // For ADK tools, we need to use a simple approach
        // The actual LLM call will be handled by the agent
        console.log(`[GuardrailTool] Validating: "${query.slice(0, 50)}..."`);

        // Simple heuristic fallback for the tool
        // In practice, the agent's own reasoning replaces this
        const keywords = ['paper', 'research', 'algorithm', 'model', 'neural', 'learning',
            'ai', 'ml', 'nlp', 'computer', 'vision', 'transformer', 'llm',
            'training', 'dataset', 'benchmark', 'method', 'approach'];

        const queryLower = query.toLowerCase();
        const matchCount = keywords.filter(kw => queryLower.includes(kw)).length;

        let score: number;
        let reason: string;

        if (matchCount >= 3) {
            score = 90;
            reason = 'Query strongly indicates academic/research intent';
        } else if (matchCount >= 1) {
            score = 70;
            reason = 'Query has some academic relevance';
        } else if (queryLower.includes('?') || queryLower.includes('how') || queryLower.includes('what')) {
            score = 50;
            reason = 'Query is a question, may have research relevance';
        } else {
            score = 30;
            reason = 'Query lacks clear academic intent';
        }

        return JSON.stringify({
            score,
            reason,
            isInScope: score >= threshold,
            shouldProceed: score >= threshold,
        });
    },
});
