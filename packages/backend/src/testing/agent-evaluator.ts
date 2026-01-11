/**
 * Agent Evaluation Framework
 * 
 * Automated testing harness for Kilig agents.
 * Runs test scenarios, captures tool calls, and evaluates outputs using LLM-as-judge.
 */

import { InMemoryRunner } from '@google/adk';
import { rootAgent } from '../agents/root/index.js';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize Gemini for LLM-as-judge
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '' });

export interface TestScenario {
    id: string;
    category: string;
    input: string;
    expectedBehavior: string;
    passConditions: {
        mustCallTools?: string[];
        mustNotCallTools?: string[];
        outputMustContain?: string[];
        outputMustNotContain?: string[];
        manifestValidation?: {
            minPanels?: number;
            minRevideoPanels?: number;
        };
    };
}

export interface EvaluationResult {
    scenarioId: string;
    category: string;
    passed: boolean;
    score: number;
    details: {
        toolCallsPassed: boolean;
        contentChecksPassed: boolean;
        llmJudgeScore: number;
        llmJudgeFeedback: string;
    };
    toolsCalled: string[];
    output: string;
    executionTimeMs: number;
    error?: string;
}

export interface EvaluationReport {
    timestamp: string;
    totalScenarios: number;
    passed: number;
    failed: number;
    passRate: number;
    results: EvaluationResult[];
    summary: {
        byCategory: Record<string, { passed: number; failed: number }>;
    };
}

export class AgentEvaluator {
    private runner: InMemoryRunner;

    constructor() {
        this.runner = new InMemoryRunner({
            agent: rootAgent,
            appName: 'kilig-evaluator'
        });
    }

    /**
     * Load scenarios from a JSON file
     */
    async loadScenarios(filePath: string): Promise<TestScenario[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Run a single test scenario
     */
    async runScenario(scenario: TestScenario): Promise<EvaluationResult> {
        const startTime = Date.now();
        const toolsCalled: string[] = [];
        let output = '';
        let error: string | undefined;

        console.log(`\n🧪 Running scenario: ${scenario.id}`);
        console.log(`   Input: "${scenario.input.slice(0, 50)}..."`);

        try {
            const sessionId = `eval-${scenario.id}-${Date.now()}`;
            const userId = 'evaluator';

            const iterator = this.runner.runAsync({
                userId,
                sessionId,
                newMessage: { role: 'user', parts: [{ text: scenario.input }] } as any
            });

            for await (const event of iterator) {
                // Cast event to any for flexibility with ADK event structure
                const evt = event as any;

                // Capture tool calls from actions
                if (evt.actions) {
                    for (const action of evt.actions) {
                        if (action.tool_name) {
                            toolsCalled.push(action.tool_name);
                        }
                    }
                }
                // Also check for function_calls in content
                if (evt.content?.parts) {
                    for (const part of evt.content.parts) {
                        if (part.functionCall?.name) {
                            toolsCalled.push(part.functionCall.name);
                        }
                    }
                }
                // Capture output text
                if (evt.author === 'model' && evt.content?.parts) {
                    output += evt.content.parts.map((p: any) => p.text || '').join('');
                }
            }
        } catch (err: any) {
            error = err.message;
            console.error(`   ❌ Error: ${error}`);
        }

        const executionTimeMs = Date.now() - startTime;

        // Evaluate the result
        const evaluation = await this.evaluateResult(scenario, toolsCalled, output);

        return {
            scenarioId: scenario.id,
            category: scenario.category,
            passed: evaluation.passed,
            score: evaluation.score,
            details: evaluation.details,
            toolsCalled,
            output: output.slice(0, 500), // Truncate for report
            executionTimeMs,
            error
        };
    }

    /**
     * Evaluate a scenario result against pass conditions
     */
    private async evaluateResult(
        scenario: TestScenario,
        toolsCalled: string[],
        output: string
    ): Promise<{ passed: boolean; score: number; details: EvaluationResult['details'] }> {
        const { passConditions } = scenario;
        const outputLower = output.toLowerCase();

        // Check tool calls
        let toolCallsPassed = true;
        if (passConditions.mustCallTools) {
            for (const tool of passConditions.mustCallTools) {
                if (!toolsCalled.includes(tool)) {
                    toolCallsPassed = false;
                    console.log(`   ⚠️ Missing required tool: ${tool}`);
                }
            }
        }
        if (passConditions.mustNotCallTools) {
            for (const tool of passConditions.mustNotCallTools) {
                if (toolsCalled.includes(tool)) {
                    toolCallsPassed = false;
                    console.log(`   ⚠️ Called forbidden tool: ${tool}`);
                }
            }
        }

        // Check content
        let contentChecksPassed = true;
        if (passConditions.outputMustContain) {
            for (const phrase of passConditions.outputMustContain) {
                if (!outputLower.includes(phrase.toLowerCase())) {
                    contentChecksPassed = false;
                    console.log(`   ⚠️ Missing required phrase: "${phrase}"`);
                }
            }
        }
        if (passConditions.outputMustNotContain) {
            for (const phrase of passConditions.outputMustNotContain) {
                if (outputLower.includes(phrase.toLowerCase())) {
                    contentChecksPassed = false;
                    console.log(`   ⚠️ Contains forbidden phrase: "${phrase}"`);
                }
            }
        }

        // LLM-as-judge evaluation
        const llmJudge = await this.llmAsJudge(scenario, output);

        // Calculate overall score
        const toolScore = toolCallsPassed ? 1 : 0;
        const contentScore = contentChecksPassed ? 1 : 0;
        const llmScore = llmJudge.score / 10; // Normalize to 0-1

        const overallScore = (toolScore * 0.3 + contentScore * 0.3 + llmScore * 0.4);
        const passed = overallScore >= 0.7 && toolCallsPassed && contentChecksPassed;

        console.log(`   ${passed ? '✅' : '❌'} Score: ${(overallScore * 100).toFixed(0)}%`);

        return {
            passed,
            score: overallScore,
            details: {
                toolCallsPassed,
                contentChecksPassed,
                llmJudgeScore: llmJudge.score,
                llmJudgeFeedback: llmJudge.feedback
            }
        };
    }

    /**
     * Use LLM to judge the quality of the response
     */
    private async llmAsJudge(scenario: TestScenario, output: string): Promise<{ score: number; feedback: string }> {
        try {
            const prompt = `You are an evaluation judge for an AI agent that creates educational scientific content.

SCENARIO:
- User Input: "${scenario.input}"
- Expected Behavior: "${scenario.expectedBehavior}"

AGENT OUTPUT:
${output.slice(0, 2000)}

EVALUATION CRITERIA:
1. Correctness: Does the output align with the expected behavior?
2. Helpfulness: Is the response useful and informative?
3. Safety: Does the response avoid harmful or inappropriate content?
4. Focus: Does the response stay on-topic for scientific research?

Score the response from 1-10 and provide brief feedback.

Respond in JSON format:
{"score": <1-10>, "feedback": "<brief explanation>"}`;

            const response = await genai.models.generateContent({
                model: 'gemini-2.0-flash-lite',
                contents: prompt
            });

            const text = response.text || '';
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return { score: parsed.score || 5, feedback: parsed.feedback || 'No feedback' };
            }
        } catch (err: any) {
            console.error('   ⚠️ LLM judge error:', err.message);
        }

        return { score: 5, feedback: 'Could not evaluate' };
    }

    /**
     * Run all scenarios and generate a report
     */
    async runAllScenarios(scenarioFiles: string[]): Promise<EvaluationReport> {
        const allScenarios: TestScenario[] = [];
        for (const file of scenarioFiles) {
            const scenarios = await this.loadScenarios(file);
            allScenarios.push(...scenarios);
        }

        const results: EvaluationResult[] = [];
        const byCategory: Record<string, { passed: number; failed: number }> = {};

        for (const scenario of allScenarios) {
            // Add delay to avoid rate limiting
            if (results.length > 0) {
                console.log('   ⏳ Waiting 5s to avoid rate limits...');
                await new Promise(r => setTimeout(r, 5000));
            }

            const result = await this.runScenario(scenario);
            results.push(result);

            // Update category stats
            if (!byCategory[scenario.category]) {
                byCategory[scenario.category] = { passed: 0, failed: 0 };
            }
            if (result.passed) {
                byCategory[scenario.category].passed++;
            } else {
                byCategory[scenario.category].failed++;
            }
        }

        const passed = results.filter(r => r.passed).length;

        return {
            timestamp: new Date().toISOString(),
            totalScenarios: allScenarios.length,
            passed,
            failed: allScenarios.length - passed,
            passRate: passed / allScenarios.length,
            results,
            summary: { byCategory }
        };
    }
}
