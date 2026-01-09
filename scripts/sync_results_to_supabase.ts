import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RESULTS_DIR = path.join(process.cwd(), 'tests', 'results');
const ARTIFACTS_DIR = path.join(process.cwd(), 'tests', 'artifacts', 'latest');

async function main() {
  console.log('--- Syncing Test Results to Supabase ---');

  // 1. Read Metadata
  const metadataPath = path.join(ARTIFACTS_DIR, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('Metadata not found at', metadataPath);
    process.exit(1);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  console.log(`Run for: ${metadata.paperUrl}`);

  // 2. Read Promptfoo Results
  const resultsPath = path.join(RESULTS_DIR, 'latest.json');
  if (!fs.existsSync(resultsPath)) {
    console.error('Promptfoo results not found at', resultsPath);
    process.exit(1);
  }
  const evalResults = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  
  // promptfoo output structure: { results: [ { prompt: { ... }, response: { ... }, gradingResult: { pass: bool, score: number, reason: string } } ] }
  // Since we run one test scenario usually, we look at the aggregation.
  const summary = evalResults.stats || {}; // { successes: n, failures: n, tokenUsage: ... }
  const firstResult = evalResults.results?.[0] || {};
  const passed = summary.failures === 0;
  const score = (summary.successes / (summary.successes + summary.failures)) * 100 || 0;

  // 3. Find or Create Research Cycle
  const researchArea = process.env.RESEARCH_AREA || metadata.domain || 'General';

  // For now, simple logic: Find 'active' cycle or use a default 'Uncategorized'
  let { data: cycle } = await supabase
    .from('research_cycles')
    .select('id')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!cycle) {
    // Check for "Uncategorized" cycle
    let { data: defaultCycle } = await supabase
      .from('research_cycles')
      .select('id')
      .eq('title', 'Uncategorized Dev Testing')
      .limit(1)
      .single();
      
    if (!defaultCycle) {
      console.log('Creating default "Uncategorized Dev Testing" cycle...');
      const { data: newCycle, error } = await supabase
        .from('research_cycles')
        .insert({
          title: 'Uncategorized Dev Testing',
          topic_domain: 'Development',
          status: 'active',
          start_date: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      cycle = newCycle;
    } else {
      cycle = defaultCycle;
    }
  }
  
  // 4. Create Pipeline Run
  console.log(`Creating Pipeline Run record for Domain: ${researchArea}...`);
  const { data: run, error: runError } = await supabase
    .from('pipeline_runs')
    .insert({
      cycle_id: cycle.id,
      domain: researchArea, // Explicitly categorize this run
      source_url: metadata.paperUrl,
      source_title: metadata.source_title || 'Unknown Title',
      status: passed ? 'completed' : 'failed',
      quality_score: Math.round(score),
      total_duration_ms: Date.now() - new Date(metadata.startedAt).getTime(), // Approx
      metadata: {
        promptfoo_stats: summary,
        original_prompt: metadata.prompt
      }
    })
    .select()
    .single();

  if (runError) {
    console.error('Error creating run:', runError);
    process.exit(1);
  }
  console.log(`Run created: ${run.id}`);

  // 5. Create Steps & Artifacts
  // We infer steps from the normalized files present in artifacts
  const normalizedFiles = [
    { name: 'scientist_analysis.txt', step: 'scientist', type: 'analysis_report' },
    { name: 'comic_manifest.json', step: 'narrative_architect', type: 'manifest_json' },
    { name: 'validator_report.txt', step: 'validator', type: 'validation_report' }
  ];

  let stepOrder = 1;
  for (const item of normalizedFiles) {
    const filePath = path.join(ARTIFACTS_DIR, item.name);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Create Step
      const { data: step, error: stepError } = await supabase
        .from('pipeline_steps')
        .insert({
          run_id: run.id,
          agent_name: item.step,
          step_order: stepOrder++,
          status: 'completed', // We assume completed if file exists for this sync script
          start_time: metadata.startedAt, // Rough approx
          end_time: new Date().toISOString(),
          output_result: { summary: 'File generated' }
        })
        .select()
        .single();

      if (stepError) {
        console.error(`Error creating step ${item.step}:`, stepError);
        continue;
      }

      // Create Artifact
      const { error: artifactError } = await supabase
        .from('pipeline_artifacts')
        .insert({
          run_id: run.id,
          step_id: step.id,
          artifact_type: item.type,
          name: item.name,
          content_preview: content.substring(0, 5000), // Store first 5KB as preview
          file_metadata: {
            size: content.length,
            path: filePath
          }
        });
        
       if (artifactError) {
        console.error(`Error creating artifact ${item.name}:`, artifactError);
      } else {
        console.log(`Logged step: ${item.step} & artifact: ${item.name}`);
      }
    }
  }

  // 6. Log specific Promptfoo Assertions as a "Test" step
  const { error: testStepError } = await supabase
    .from('pipeline_steps')
    .insert({
        run_id: run.id,
        agent_name: 'promptfoo_evaluator',
        step_order: 99,
        status: passed ? 'completed' : 'failed',
        output_result: { 
            assertions: firstResult.gradingResult?.componentResults || [], 
            full_report: evalResults.results 
        }, 
        error_log: passed ? null : (firstResult.gradingResult?.reason || 'Promptfoo assertions failed')
    });
    
  if (testStepError) console.error('Error logging eval step:', testStepError);

  console.log('✅ Sync Complete!');
}

main().catch(e => console.error(e));
