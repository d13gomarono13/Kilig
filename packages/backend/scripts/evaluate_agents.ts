#!/usr/bin/env npx tsx
/**
 * Agent Evaluation CLI
 * 
 * Run with: cd packages/backend && pnpm exec tsx scripts/evaluate_agents.ts
 * 
 * Options:
 *   --scenarios <path>  Path to scenario JSON files (comma-separated)
 *   --output <path>     Output path for report JSON
 *   --category <name>   Filter by category (optional)
 */

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentEvaluator, EvaluationReport } from '../src/testing/agent-evaluator.js';

async function main() {
    console.log('🧪 Kilig Agent Evaluation Framework');
    console.log('====================================\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const scenarioArg = args.find(a => a.startsWith('--scenarios='))?.split('=')[1];
    const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1];
    const categoryArg = args.find(a => a.startsWith('--category='))?.split('=')[1];

    // Default scenario files
    const defaultScenarios = [
        path.join(__dirname, '../data/agent_test_scenarios.json'),
        path.join(__dirname, '../data/red_team_scenarios.json')
    ];

    const scenarioFiles = scenarioArg
        ? scenarioArg.split(',').map(f => path.resolve(f))
        : defaultScenarios;

    const outputPath = outputArg
        ? path.resolve(outputArg)
        : path.join(__dirname, '../results/eval_report.json');

    console.log('📁 Scenario files:');
    for (const file of scenarioFiles) {
        console.log(`   - ${file}`);
    }
    console.log();

    // Create evaluator and run
    const evaluator = new AgentEvaluator();

    try {
        const report = await evaluator.runAllScenarios(scenarioFiles);

        // Print summary
        console.log('\n====================================');
        console.log('📊 EVALUATION SUMMARY');
        console.log('====================================');
        console.log(`Total Scenarios: ${report.totalScenarios}`);
        console.log(`Passed: ${report.passed} ✅`);
        console.log(`Failed: ${report.failed} ❌`);
        console.log(`Pass Rate: ${(report.passRate * 100).toFixed(1)}%`);
        console.log();

        console.log('By Category:');
        for (const [category, stats] of Object.entries(report.summary.byCategory)) {
            const rate = stats.passed / (stats.passed + stats.failed) * 100;
            console.log(`  ${category}: ${stats.passed}/${stats.passed + stats.failed} (${rate.toFixed(0)}%)`);
        }
        console.log();

        // Save report
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
        console.log(`📄 Report saved to: ${outputPath}`);

        // Exit with error code if pass rate < 80%
        if (report.passRate < 0.8) {
            console.log('\n⚠️ Pass rate below 80% threshold!');
            process.exit(1);
        }

    } catch (error: any) {
        console.error('❌ Evaluation failed:', error.message);
        process.exit(1);
    }
}

main();
