import fs from 'fs';
import path from 'path';
import { supabase } from '../src/utils/supabase.js';

// --- Configuration ---
const ARTIFACTS_SRC = path.join(process.cwd(), 'tests', 'artifacts', 'latest');
const RESULTS_SRC = path.join(process.cwd(), 'tests', 'results');

// Helper to get score from promptfoo json
function getRunStats(jsonPath: string): { pass: number, fail: number, score: number, data: any } {
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const results = data.results?.results || []; 
        let pass = 0;
        let fail = 0;
        
        results.forEach((r: any) => {
            if (r.success) pass++;
            else fail++;
        });
        
        const total = pass + fail;
        const score = total > 0 ? Math.round((pass / total) * 100) : 0;
        return { pass, fail, score, data };
    } catch (e) {
        console.error('Error parsing stats:', e);
        return { pass: 0, fail: 0, score: 0, data: null };
    }
}

// Helper to read artifacts into an object
function getArtifacts() {
    const artifacts: Record<string, string> = {};
    if (fs.existsSync(ARTIFACTS_SRC)) {
        const files = fs.readdirSync(ARTIFACTS_SRC);
        for (const f of files) {
            // Only keeping text/json files for DB storage to avoid bloat
            if (f.endsWith('.json') || f.endsWith('.txt')) {
                try {
                    artifacts[f] = fs.readFileSync(path.join(ARTIFACTS_SRC, f), 'utf-8');
                } catch (e) {
                    console.warn(`Could not read artifact ${f}`);
                }
            }
        }
    }
    return artifacts;
}

async function main() {
    const domain = process.env.TEST_DOMAIN || 'uncategorized'; 
    const latestJson = path.join(RESULTS_SRC, 'latest.json');

    if (!fs.existsSync(latestJson)) {
        console.error('❌ No latest.json found. Run tests first.');
        return;
    }

    console.log(`🚀 Uploading Test Run to Supabase (Domain: ${domain})...`);

    const stats = getRunStats(latestJson);
    const artifacts = getArtifacts();

    const { error } = await supabase
        .from('test_runs')
        .insert({
            domain,
            score: stats.score,
            passed: stats.pass,
            failed: stats.fail,
            report_json: stats.data,
            artifacts: artifacts
        });

    if (error) {
        console.error('❌ Failed to upload to Supabase:', error.message);
        process.exit(1);
    } else {
        console.log('✅ Successfully archived run to Supabase.');
    }
}

main();