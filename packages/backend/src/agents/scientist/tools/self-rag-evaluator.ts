/**
 * Self-RAG Evaluator Tools
 * 
 * Implements the Self-RAG pattern with dynamic evaluation at each step:
 * 1. Retrieval Decision - Should we retrieve documents?
 * 2. Relevance Evaluation - Is each document relevant?
 * 3. Support Assessment - Is the response grounded?
 * 4. Utility Evaluation - How useful is the response?
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini for evaluations
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

type RetrievalDecision = 'retrieve' | 'no_retrieval';
type RelevanceLabel = 'relevant' | 'irrelevant';
type SupportLevel = 'fully_supported' | 'partially_supported' | 'not_supported';

/**
 * Decide if retrieval is necessary for a query
 */
export async function shouldRetrieve(query: string): Promise<{ decision: RetrievalDecision; reasoning: string }> {
    const prompt = `You are a retrieval decision system. Determine if external document retrieval is necessary to answer this query.

QUERY: "${query}"

DECISION CRITERIA:
- "retrieve": Query requires factual information, research papers, specific data, or technical details
- "no_retrieval": Query is simple math, common knowledge, or conversational (e.g., "hello", "2+2", "what time is it")

Respond in JSON: {"decision": "retrieve" | "no_retrieval", "reasoning": "<brief explanation>"}`;

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });
        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            return { decision: parsed.decision || 'retrieve', reasoning: parsed.reasoning || '' };
        }
    } catch (err: any) {
        console.error('[SelfRAG] Retrieval decision error:', err.message);
    }
    return { decision: 'retrieve', reasoning: 'Default to retrieval' };
}

/**
 * Evaluate if a document is relevant to a query
 */
export async function evaluateDocRelevance(
    document: string,
    query: string
): Promise<{ label: RelevanceLabel; confidence: number }> {
    const prompt = `Evaluate if this document is relevant to the query.

QUERY: "${query}"

DOCUMENT:
${document.slice(0, 1500)}

Is this document RELEVANT to answering the query?
- "relevant": Document contains information useful for answering the query
- "irrelevant": Document is off-topic or not useful

Respond in JSON: {"label": "relevant" | "irrelevant", "confidence": <0.0-1.0>}`;

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });
        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            return { label: parsed.label || 'relevant', confidence: parsed.confidence || 0.5 };
        }
    } catch (err: any) {
        console.error('[SelfRAG] Relevance evaluation error:', err.message);
    }
    return { label: 'relevant', confidence: 0.5 };
}

/**
 * Evaluate if a response is supported by the context
 */
export async function evaluateSupportLevel(
    response: string,
    context: string
): Promise<{ level: SupportLevel; reasoning: string }> {
    const prompt = `Evaluate if this response is supported by the given context.

CONTEXT:
${context.slice(0, 3000)}

RESPONSE:
${response.slice(0, 1000)}

SUPPORT LEVELS:
- "fully_supported": Every claim in the response is directly supported by the context
- "partially_supported": Some claims are supported, others are inferred or not in context
- "not_supported": The response contains claims that contradict or aren't in the context

Respond in JSON: {"level": "fully_supported" | "partially_supported" | "not_supported", "reasoning": "<brief explanation>"}`;

    try {
        const response_llm = await genai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });
        const text = response_llm.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            return { level: parsed.level || 'partially_supported', reasoning: parsed.reasoning || '' };
        }
    } catch (err: any) {
        console.error('[SelfRAG] Support assessment error:', err.message);
    }
    return { level: 'partially_supported', reasoning: 'Could not evaluate' };
}

/**
 * Evaluate the utility/usefulness of a response
 */
export async function evaluateUtility(
    response: string,
    query: string
): Promise<{ score: number; feedback: string }> {
    const prompt = `Rate the utility of this response for the given query.

QUERY: "${query}"

RESPONSE:
${response.slice(0, 1000)}

UTILITY SCORE (1-5):
1 = Completely unhelpful, wrong, or off-topic
2 = Mostly unhelpful, missing key information
3 = Somewhat helpful, covers basics
4 = Helpful, addresses the query well
5 = Excellent, comprehensive and accurate

Respond in JSON: {"score": <1-5>, "feedback": "<brief explanation>"}`;

    try {
        const response_llm = await genai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });
        const text = response_llm.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]);
            return { score: parsed.score || 3, feedback: parsed.feedback || '' };
        }
    } catch (err: any) {
        console.error('[SelfRAG] Utility evaluation error:', err.message);
    }
    return { score: 3, feedback: 'Could not evaluate' };
}

// ============================================================================
// ADK Tools for Agent Integration
// ============================================================================

/**
 * Tool: Decide if retrieval is needed
 */
export const retrievalDecisionTool = new FunctionTool({
    name: 'decide_retrieval',
    description: 'Decide if document retrieval is necessary for the query. Call this BEFORE search_papers to potentially skip retrieval for simple queries.',
    parameters: z.object({
        query: z.string().describe('The user query to analyze')
    }),
    execute: async ({ query }: { query: string }) => {
        console.log(`[SelfRAG] Evaluating retrieval decision for: "${query.slice(0, 50)}..."`);
        const result = await shouldRetrieve(query);
        console.log(`[SelfRAG] Decision: ${result.decision} - ${result.reasoning}`);
        return JSON.stringify(result);
    }
});

/**
 * Tool: Filter documents by relevance
 */
export const filterRelevantDocsTool = new FunctionTool({
    name: 'filter_relevant_documents',
    description: 'Filter retrieved documents to keep only those relevant to the query. Use after search_papers to improve response quality.',
    parameters: z.object({
        query: z.string().describe('The original query'),
        documents: z.array(z.string()).describe('Array of document contents to filter')
    }),
    execute: async ({ query, documents }: { query: string; documents: string[] }) => {
        console.log(`[SelfRAG] Filtering ${documents.length} documents for relevance...`);

        const results = await Promise.all(
            documents.map(async (doc, i) => {
                const result = await evaluateDocRelevance(doc, query);
                return { index: i, ...result, doc: doc.slice(0, 200) };
            })
        );

        const relevant = results.filter(r => r.label === 'relevant');
        console.log(`[SelfRAG] Kept ${relevant.length}/${documents.length} relevant documents`);

        return JSON.stringify({
            total: documents.length,
            relevant: relevant.length,
            filtered: results
        });
    }
});

/**
 * Tool: Assess if response is grounded in context
 */
export const assessSupportTool = new FunctionTool({
    name: 'assess_response_support',
    description: 'Check if a generated response is properly grounded in the retrieved context. Use to validate before final answer.',
    parameters: z.object({
        response: z.string().describe('The generated response to evaluate'),
        context: z.string().describe('The retrieved context the response should be based on')
    }),
    execute: async ({ response, context }: { response: string; context: string }) => {
        console.log('[SelfRAG] Assessing response support...');
        const result = await evaluateSupportLevel(response, context);
        console.log(`[SelfRAG] Support level: ${result.level}`);
        return JSON.stringify(result);
    }
});

/**
 * Tool: Rate response utility
 */
export const rateUtilityTool = new FunctionTool({
    name: 'rate_response_utility',
    description: 'Rate the overall utility/helpfulness of a response. Use to compare multiple candidate responses.',
    parameters: z.object({
        response: z.string().describe('The response to rate'),
        query: z.string().describe('The original user query')
    }),
    execute: async ({ response, query }: { response: string; query: string }) => {
        console.log('[SelfRAG] Rating response utility...');
        const result = await evaluateUtility(response, query);
        console.log(`[SelfRAG] Utility score: ${result.score}/5`);
        return JSON.stringify(result);
    }
});
