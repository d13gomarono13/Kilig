/**
 * DeepEval-style RAG Evaluation Service
 * 
 * Implements RAG quality metrics using LLM-as-judge pattern:
 * - Correctness: Is the answer factually correct?
 * - Faithfulness: Is the answer grounded in the retrieved context?
 * - Contextual Relevancy: Are the retrieved documents relevant?
 */

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini for evaluation
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

export interface RAGTestCase {
    id: string;
    question: string;
    expected_answer: string;
    golden_documents?: string[];
}

export interface RAGEvaluationResult {
    testCaseId: string;
    question: string;
    actualAnswer: string;
    retrievedDocs: string[];
    metrics: {
        correctness: { score: number; reasoning: string };
        faithfulness: { score: number; reasoning: string };
        contextualRelevancy: { score: number; reasoning: string };
    };
    overallScore: number;
    passed: boolean;
}

export interface RAGEvaluationReport {
    timestamp: string;
    totalCases: number;
    avgCorrectness: number;
    avgFaithfulness: number;
    avgContextualRelevancy: number;
    avgOverallScore: number;
    passRate: number;
    results: RAGEvaluationResult[];
}

export class DeepEvalService {

    /**
     * Evaluate correctness: Does the answer match the expected answer?
     */
    async evaluateCorrectness(
        question: string,
        expectedAnswer: string,
        actualAnswer: string
    ): Promise<{ score: number; reasoning: string }> {
        const prompt = `You are evaluating the correctness of an AI-generated answer.

QUESTION: ${question}

EXPECTED ANSWER (Ground Truth):
${expectedAnswer}

ACTUAL ANSWER (To Evaluate):
${actualAnswer}

EVALUATION CRITERIA:
- Does the actual answer contain the key facts from the expected answer?
- Is the information in the actual answer factually consistent with the expected answer?
- Minor wording differences are acceptable if the meaning is preserved.

Score from 0.0 to 1.0 where:
- 1.0 = Perfect match, all key facts present and correct
- 0.8 = Most key facts present, minor omissions
- 0.6 = Some key facts present, some missing
- 0.4 = Few key facts present, major gaps
- 0.0 = Completely wrong or contradictory

Respond in JSON: {"score": <0.0-1.0>, "reasoning": "<brief explanation>"}`;

        return this.callLLMJudge(prompt);
    }

    /**
     * Evaluate faithfulness: Is the answer grounded in the retrieved context?
     */
    async evaluateFaithfulness(
        question: string,
        actualAnswer: string,
        retrievedContext: string
    ): Promise<{ score: number; reasoning: string }> {
        const prompt = `You are evaluating the faithfulness of an AI-generated answer.

QUESTION: ${question}

RETRIEVED CONTEXT (Source Documents):
${retrievedContext}

ACTUAL ANSWER:
${actualAnswer}

EVALUATION CRITERIA:
- Is every claim in the answer supported by the retrieved context?
- Does the answer avoid hallucinating information not in the context?
- Is the answer truthful to the retrieved documents?

Score from 0.0 to 1.0 where:
- 1.0 = Fully grounded, every claim supported by context
- 0.8 = Mostly grounded, minor unsupported details
- 0.6 = Partially grounded, some hallucinations
- 0.4 = Largely ungrounded, significant hallucinations
- 0.0 = Completely hallucinated, no connection to context

Respond in JSON: {"score": <0.0-1.0>, "reasoning": "<brief explanation>"}`;

        return this.callLLMJudge(prompt);
    }

    /**
     * Evaluate contextual relevancy: Are the retrieved documents relevant?
     */
    async evaluateContextualRelevancy(
        question: string,
        retrievedContext: string
    ): Promise<{ score: number; reasoning: string }> {
        const prompt = `You are evaluating the relevancy of retrieved documents.

QUESTION: ${question}

RETRIEVED CONTEXT (Documents):
${retrievedContext}

EVALUATION CRITERIA:
- Are the retrieved documents relevant to answering the question?
- Do they contain information that helps answer the question?
- Is there unnecessary or off-topic content?

Score from 0.0 to 1.0 where:
- 1.0 = Highly relevant, all documents directly address the question
- 0.8 = Mostly relevant, minor tangential content
- 0.6 = Partially relevant, some useful content mixed with noise
- 0.4 = Marginally relevant, mostly tangential
- 0.0 = Completely irrelevant, no connection to question

Respond in JSON: {"score": <0.0-1.0>, "reasoning": "<brief explanation>"}`;

        return this.callLLMJudge(prompt);
    }

    /**
     * Run full evaluation on a test case
     */
    async evaluateTestCase(
        testCase: RAGTestCase,
        actualAnswer: string,
        retrievedDocs: string[]
    ): Promise<RAGEvaluationResult> {
        const retrievedContext = retrievedDocs.join('\n\n---\n\n');

        // Run all three metrics
        const [correctness, faithfulness, contextualRelevancy] = await Promise.all([
            this.evaluateCorrectness(testCase.question, testCase.expected_answer, actualAnswer),
            this.evaluateFaithfulness(testCase.question, actualAnswer, retrievedContext),
            this.evaluateContextualRelevancy(testCase.question, retrievedContext)
        ]);

        // Calculate overall score (weighted average)
        const overallScore = (
            correctness.score * 0.4 +
            faithfulness.score * 0.35 +
            contextualRelevancy.score * 0.25
        );

        // Pass threshold: Overall >= 0.7 AND Faithfulness >= 0.6
        const passed = overallScore >= 0.7 && faithfulness.score >= 0.6;

        return {
            testCaseId: testCase.id,
            question: testCase.question,
            actualAnswer: actualAnswer.slice(0, 500),
            retrievedDocs: retrievedDocs.map(d => d.slice(0, 200)),
            metrics: { correctness, faithfulness, contextualRelevancy },
            overallScore,
            passed
        };
    }

    /**
     * Generate evaluation report from multiple results
     */
    generateReport(results: RAGEvaluationResult[]): RAGEvaluationReport {
        const avgCorrectness = results.reduce((sum, r) => sum + r.metrics.correctness.score, 0) / results.length;
        const avgFaithfulness = results.reduce((sum, r) => sum + r.metrics.faithfulness.score, 0) / results.length;
        const avgContextualRelevancy = results.reduce((sum, r) => sum + r.metrics.contextualRelevancy.score, 0) / results.length;
        const avgOverallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
        const passRate = results.filter(r => r.passed).length / results.length;

        return {
            timestamp: new Date().toISOString(),
            totalCases: results.length,
            avgCorrectness,
            avgFaithfulness,
            avgContextualRelevancy,
            avgOverallScore,
            passRate,
            results
        };
    }

    /**
     * Helper: Call LLM and parse JSON response
     */
    private async callLLMJudge(prompt: string): Promise<{ score: number; reasoning: string }> {
        try {
            const response = await genai.models.generateContent({
                model: 'gemini-2.0-flash-lite',
                contents: prompt
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    score: Math.max(0, Math.min(1, parsed.score || 0)),
                    reasoning: parsed.reasoning || 'No reasoning provided'
                };
            }
        } catch (err: any) {
            console.error('[DeepEval] LLM judge error:', err.message);
        }

        return { score: 0.5, reasoning: 'Evaluation failed' };
    }
}

// Singleton instance
export const deepEvalService = new DeepEvalService();
