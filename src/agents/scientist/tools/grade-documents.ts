/**
 * Document Grader Tool for Agentic RAG
 * 
 * Evaluates retrieved documents for relevance to the query.
 * Routes to query rewrite if documents are not relevant.
 */

import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const GRADE_DOCUMENTS_PROMPT = `You are a document relevance grader for an academic paper search system.

Given the following retrieved context and user question, determine if the context contains information that would help answer the question.

CONTEXT:
{context}

USER QUESTION:
{question}

Respond in JSON format:
{
  "binary_score": "yes" or "no",
  "reasoning": "<brief explanation of why the context is or isn't relevant>"
}`;

export interface GradingResult {
    documentId: string;
    isRelevant: boolean;
    score: number;
    reasoning: string;
}

/**
 * Grade documents for relevance using LLM
 */
export async function gradeDocuments(
    context: string,
    question: string,
    llm: any
): Promise<GradingResult> {
    console.log(`[DocumentGrader] Grading context (${context.length} chars) for question: "${question.slice(0, 50)}..."`);

    if (!context || context.trim().length === 0) {
        console.warn('[DocumentGrader] No context provided');
        return {
            documentId: 'retrieved_docs',
            isRelevant: false,
            score: 0,
            reasoning: 'No context provided',
        };
    }

    try {
        const prompt = GRADE_DOCUMENTS_PROMPT
            .replace('{context}', context.slice(0, 2000)) // Limit context size
            .replace('{question}', question);

        const response = await llm.invoke(prompt);
        const content = typeof response === 'string' ? response : response.content;

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            console.warn('[DocumentGrader] Failed to parse LLM response');
            // Fallback: check if context has reasonable length
            const isRelevant = context.trim().length > 50;
            return {
                documentId: 'retrieved_docs',
                isRelevant,
                score: isRelevant ? 0.6 : 0.2,
                reasoning: 'Fallback heuristic: checking content presence',
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const isRelevant = parsed.binary_score?.toLowerCase() === 'yes';

        console.log(`[DocumentGrader] Result: ${isRelevant ? 'RELEVANT' : 'NOT RELEVANT'} - ${parsed.reasoning}`);

        return {
            documentId: 'retrieved_docs',
            isRelevant,
            score: isRelevant ? 1.0 : 0.0,
            reasoning: parsed.reasoning || 'No reasoning provided',
        };
    } catch (error) {
        console.error('[DocumentGrader] Grading failed:', error);
        // Fallback to heuristic
        const isRelevant = context.trim().length > 50;
        return {
            documentId: 'retrieved_docs',
            isRelevant,
            score: isRelevant ? 0.5 : 0.0,
            reasoning: `Fallback (error): ${error}`,
        };
    }
}

/**
 * Document Grader Tool for ADK Agent
 */
export const gradeDocumentsTool = new FunctionTool({
    name: 'grade_document_relevance',
    description: 'Evaluates if retrieved document chunks are relevant to the user query. Returns relevance score and recommendation on whether to proceed or rewrite query.',
    parameters: z.object({
        context: z.string().describe('The retrieved document context to evaluate'),
        question: z.string().describe('The original user question'),
    }),
    execute: async ({ context, question }) => {
        console.log(`[GradeDocumentsTool] Grading ${context.length} chars of context`);

        // Simple relevance heuristics for the tool
        // Agent's reasoning will supplement this
        const contextLower = context.toLowerCase();
        const questionLower = question.toLowerCase();

        // Extract keywords from question
        const questionWords = questionLower
            .split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !['what', 'how', 'when', 'where', 'which', 'that', 'this', 'with', 'from', 'about'].includes(w));

        // Count keyword matches
        const matchCount = questionWords.filter(word => contextLower.includes(word)).length;
        const matchRatio = questionWords.length > 0 ? matchCount / questionWords.length : 0;

        let isRelevant: boolean;
        let score: number;
        let reasoning: string;
        let routingDecision: 'generate_answer' | 'rewrite_query';

        if (context.trim().length < 50) {
            isRelevant = false;
            score = 0;
            reasoning = 'Context too short or empty';
            routingDecision = 'rewrite_query';
        } else if (matchRatio >= 0.5) {
            isRelevant = true;
            score = Math.min(1, 0.5 + matchRatio);
            reasoning = `Found ${matchCount}/${questionWords.length} question keywords in context`;
            routingDecision = 'generate_answer';
        } else if (matchRatio >= 0.2) {
            isRelevant = true;
            score = 0.5 + matchRatio;
            reasoning = `Partial keyword match (${matchCount}/${questionWords.length})`;
            routingDecision = 'generate_answer';
        } else {
            isRelevant = false;
            score = matchRatio;
            reasoning = `Low keyword overlap (${matchCount}/${questionWords.length})`;
            routingDecision = 'rewrite_query';
        }

        return JSON.stringify({
            isRelevant,
            score,
            reasoning,
            routingDecision,
            keywordsChecked: questionWords.length,
            keywordsFound: matchCount,
        });
    },
});
