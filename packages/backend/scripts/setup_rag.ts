#!/usr/bin/env npx tsx
/**
 * RAG Infrastructure Setup Script
 * 
 * Automatically starts Docker services and initializes OpenSearch indices.
 * Run: npx tsx scripts/setup_rag.ts
 */

import { execSync, spawn } from 'child_process';

const OPENSEARCH_URL = 'http://localhost:9200';
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

function log(msg: string) {
    console.log(`\x1b[36m[RAG Setup]\x1b[0m ${msg}`);
}

function success(msg: string) {
    console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function error(msg: string) {
    console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkDockerRunning(): Promise<boolean> {
    try {
        execSync('docker info', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

async function startDockerServices(): Promise<void> {
    log('Starting Docker services (OpenSearch + Redis)...');

    try {
        execSync('docker compose up -d', {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        success('Docker services started');
    } catch (e) {
        throw new Error('Failed to start Docker services. Is Docker running?');
    }
}

async function waitForOpenSearch(): Promise<boolean> {
    log(`Waiting for OpenSearch to be ready (max ${MAX_RETRIES * RETRY_DELAY_MS / 1000}s)...`);

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(`${OPENSEARCH_URL}/_cluster/health`);
            if (response.ok) {
                const health = await response.json();
                if (health.status === 'green' || health.status === 'yellow') {
                    success(`OpenSearch is ready (status: ${health.status})`);
                    return true;
                }
            }
        } catch {
            // Not ready yet
        }

        process.stdout.write(`\r  Attempt ${i + 1}/${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS);
    }

    console.log('');
    return false;
}

async function waitForRedis(): Promise<boolean> {
    log('Checking Redis connection...');

    try {
        execSync('docker exec kilig-redis redis-cli ping', { stdio: 'pipe' });
        success('Redis is ready');
        return true;
    } catch {
        error('Redis is not responding');
        return false;
    }
}

async function setupOpenSearchIndices(): Promise<void> {
    log('Setting up OpenSearch indices...');

    // Dynamic import to avoid loading config before env is ready
    const { createOpenSearchClient } = await import('../src/services/opensearch/index.js');

    const client = createOpenSearchClient();

    try {
        // Check health
        const healthy = await client.healthCheck();
        if (!healthy) {
            throw new Error('OpenSearch health check failed');
        }

        // Get current stats
        const stats = await client.getIndexStats();
        if (stats.exists) {
            log(`Index '${stats.indexName}' already exists with ${stats.documentCount} documents`);
            log('Skipping index creation (use --force to recreate)');
        } else {
            // Create indices
            const result = await client.setupIndices(false);
            success(`Created hybrid index: ${result.hybridIndex}`);
            success(`Created RRF pipeline: ${result.rrfPipeline}`);
        }

        await client.close();
    } catch (e) {
        await client.close();
        throw e;
    }
}

async function main() {
    console.log('\n\x1b[1m🚀 Kilig RAG Infrastructure Setup\x1b[0m\n');

    const forceRecreate = process.argv.includes('--force');

    // Step 1: Check Docker
    log('Checking Docker...');
    if (!await checkDockerRunning()) {
        error('Docker is not running. Please start Docker Desktop first.');
        process.exit(1);
    }
    success('Docker is running');

    // Step 2: Start services
    await startDockerServices();

    // Step 3: Wait for OpenSearch
    if (!await waitForOpenSearch()) {
        error('OpenSearch failed to start within timeout');
        error('Check logs with: docker compose logs opensearch');
        process.exit(1);
    }

    // Step 4: Wait for Redis
    await waitForRedis();

    // Step 5: Setup indices
    try {
        if (forceRecreate) {
            log('Force recreating indices...');
            const { createOpenSearchClient } = await import('../src/services/opensearch/index.js');
            const client = createOpenSearchClient();
            await client.setupIndices(true);
            await client.close();
            success('Indices recreated');
        } else {
            await setupOpenSearchIndices();
        }
    } catch (e) {
        error(`Index setup failed: ${e}`);
        process.exit(1);
    }

    // Done!
    console.log('\n\x1b[32m\x1b[1m✅ RAG infrastructure is ready!\x1b[0m\n');
    console.log('Next steps:');
    console.log('  1. Ingest papers: Use the scientist agent\'s ingest_paper tool');
    console.log('  2. Test search:  npx tsx -e "import {hybridSearch} from \'./src/agents/scientist/tools/hybrid-search.js\'; hybridSearch(\'transformer\').then(console.log)"');
    console.log('  3. Run pipeline: npx tsx scripts/test_pipeline.ts');
    console.log('');
}

main().catch(e => {
    error(`Setup failed: ${e.message}`);
    process.exit(1);
});
