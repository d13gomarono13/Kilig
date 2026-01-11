#!/usr/bin/env npx tsx
/**
 * RAG Evaluation CLI
 * 
 * Run with: cd packages/backend && pnpm exec tsx scripts/evaluate_rag.ts
 * 
 * Options:
 *   --test-set <path>   Path to test cases JSON
 *   --output <path>     Output path for report JSON
 */

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { deepEvalService, RAGTestCase, RAGEvaluationResult } from '../src/services/evaluation/deepeval-service.js';
import { hybridSearch } from '../src/agents/scientist/tools/hybrid-search.js';

async function main() {
    console.log('📊 Kilig RAG Evaluation');
    console.log('=======================\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const testSetArg = args.find(a => a.startsWith('--test-set='))?.split('=')[1];
    const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1];

    const testSetPath = testSetArg
        ? path.resolve(testSetArg)
        : path.join(__dirname, '../data/rag_test_cases.json');

    const outputPath = outputArg
        ? path.resolve(outputArg)
        : path.join(__dirname, '../results/rag_eval_report.json');

    console.log(`📁 Test set: ${testSetPath}`);
    console.log(`📁 Output: ${outputPath}\n`);

    // Load test cases
    const testCasesRaw = await fs.readFile(testSetPath, 'utf-8');
    const testCases: RAGTestCase[] = JSON.parse(testCasesRaw);
    console.log(`📝 Loaded ${testCases.length} test cases\n`);

    const results: RAGEvaluationResult[] = [];

    for (const testCase of testCases) {
        console.log(`\n🧪 Evaluating: ${testCase.id}`);
        console.log(`   Q: "${testCase.question.slice(0, 50)}..."`);

        // Rate limit delay between test cases
        if (results.length > 0) {
            console.log('   ⏳ Waiting 3s to avoid rate limits...');
            await new Promise(r => setTimeout(r, 3000));
        }

        try {
            // Step 1: Run RAG retrieval
            console.log('   📥 Running retrieval...');
            const searchResult = await hybridSearch(testCase.question, { limit: 5, useHybrid: true });
            const retrievedDocs = searchResult.hits.map(h => h.content);
            console.log(`   📄 Retrieved ${retrievedDocs.length} documents`);

            // Step 2: Generate answer using retrieved context
            // For evaluation purposes, we'll use a simple prompt
            const actualAnswer = await generateAnswer(testCase.question, retrievedDocs);
            console.log(`   💬 Generated answer (${actualAnswer.length} chars)`);

            // Step 3: Run DeepEval metrics
            console.log('   📏 Running evaluation metrics...');
            const result = await deepEvalService.evaluateTestCase(testCase, actualAnswer, retrievedDocs);
            results.push(result);

            console.log(`   ✅ Correctness: ${(result.metrics.correctness.score * 100).toFixed(0)}%`);
            console.log(`   ✅ Faithfulness: ${(result.metrics.faithfulness.score * 100).toFixed(0)}%`);
            console.log(`   ✅ Relevancy: ${(result.metrics.contextualRelevancy.score * 100).toFixed(0)}%`);
            console.log(`   ${result.passed ? '✅' : '❌'} Overall: ${(result.overallScore * 100).toFixed(0)}%`);

        } catch (err: any) {
            console.error(`   ❌ Error: ${err.message}`);
            // Add a failed result
            results.push({
                testCaseId: testCase.id,
                question: testCase.question,
                actualAnswer: '',
                retrievedDocs: [],
                metrics: {
                    correctness: { score: 0, reasoning: 'Evaluation failed' },
                    faithfulness: { score: 0, reasoning: 'Evaluation failed' },
                    contextualRelevancy: { score: 0, reasoning: 'Evaluation failed' }
                },
                overallScore: 0,
                passed: false
            });
        }
    }

    // Generate report
    const report = deepEvalService.generateReport(results);

    // Print summary
    console.log('\n=======================');
    console.log('📊 EVALUATION SUMMARY');
    console.log('=======================');
    console.log(`Total Cases: ${report.totalCases}`);
    console.log(`Avg Correctness: ${(report.avgCorrectness * 100).toFixed(1)}%`);
    console.log(`Avg Faithfulness: ${(report.avgFaithfulness * 100).toFixed(1)}%`);
    console.log(`Avg Contextual Relevancy: ${(report.avgContextualRelevancy * 100).toFixed(1)}%`);
    console.log(`Avg Overall: ${(report.avgOverallScore * 100).toFixed(1)}%`);
    console.log(`Pass Rate: ${(report.passRate * 100).toFixed(1)}%`);

    // Save report
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${outputPath}`);

    // Exit with error code if pass rate < 70%
    if (report.passRate < 0.7) {
        console.log('\n⚠️ Pass rate below 70% threshold!');
        process.exit(1);
    }
}

/**
 * Generate an answer using the retrieved context
 * (Simplified version - in production this would use the full Scientist agent)
 */
async function generateAnswer(question: string, retrievedDocs: string[]): Promise<string> {
    const { GoogleGenAI } = await import('@google/genai');
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

    const context = retrievedDocs.join('\n\n---\n\n');
    const prompt = `Answer the following question based on the provided context.

CONTEXT:
${context.slice(0, 8000)}

QUESTION: ${question}

Provide a clear, accurate answer based only on the context above.`;

    const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt
    });

    return response.text || 'No answer generated';
}

main().catch(console.error);
