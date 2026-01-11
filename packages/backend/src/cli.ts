#!/usr/bin/env node
/**
 * Kilig CLI for Airflow Integration
 * 
 * Direct database/OpenSearch access without HTTP API dependency.
 * This allows Airflow DAGs to interact with the indexing pipeline
 * without depending on the Backend API server uptime.
 */

import { Command } from 'commander';
import { indexPaperCLI, reindexPaperCLI, deletePaperCLI } from './commands/index-paper.js';
import { checkExistingPapers } from './commands/check-existing.js';
import { setupIndicesCLI } from './commands/setup-indices.js';

const program = new Command();

program
    .name('kilig-cli')
    .description('Kilig Backend CLI for Airflow DAG integration')
    .version('1.0.0');

// Index paper command
program
    .command('index-paper')
    .description('Index a paper directly to OpenSearch')
    .requiredOption('--arxiv-id <id>', 'ArXiv ID')
    .requiredOption('--title <title>', 'Paper title')
    .requiredOption('--abstract <abstract>', 'Paper abstract')
    .requiredOption('--full-text <text>', 'Full paper text (can be file path with @)')
    .option('--sections <json>', 'Sections as JSON string')
    .option('--categories <cats>', 'Comma-separated categories')
    .option('--published-date <date>', 'Published date ISO string')
    .action(indexPaperCLI);

// Re-index paper command
program
    .command('reindex-paper')
    .description('Re-index a paper (delete old chunks + re-embed)')
    .requiredOption('--arxiv-id <id>', 'ArXiv ID')
    .option('--force-embed', 'Force re-embedding even if cached')
    .action(reindexPaperCLI);

// Check existing papers
program
    .command('check-existing')
    .description('Check which papers already exist in index')
    .requiredOption('--arxiv-ids <ids>', 'Comma-separated ArXiv IDs')
    .action(checkExistingPapers);

// Setup indices
program
    .command('setup-indices')
    .description('Setup OpenSearch indices (run once on deployment)')
    .option('--force', 'Force recreation of indices')
    .action(setupIndicesCLI);

// Delete paper
program
    .command('delete-paper')
    .description('Delete paper chunks from index')
    .requiredOption('--arxiv-id <id>', 'ArXiv ID')
    .action(deletePaperCLI);

program.parse(process.argv);
