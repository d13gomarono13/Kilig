/**
 * Paper Indexing CLI Commands
 * 
 * Commands for indexing, re-indexing, and deleting papers via CLI.
 * Used by Airflow DAGs to bypass HTTP API dependency.
 */

import { createHybridIndexer, PaperInput } from '../services/indexing/hybrid-indexer.js';
import { createOpenSearchClient, ChunkHit } from '../services/opensearch/index.js';
import { getLogger } from '../utils/logger.js';
import fs from 'fs/promises';

const log = getLogger('CLI:IndexPaper');

interface IndexPaperOptions {
    arxivId: string;
    title: string;
    abstract: string;
    fullText: string;
    sections?: string;
    categories?: string;
    publishedDate?: string;
}

interface ReindexPaperOptions {
    arxivId: string;
    forceEmbed?: boolean;
}

interface DeletePaperOptions {
    arxivId: string;
}

/**
 * Index a paper from CLI arguments
 */
export async function indexPaperCLI(options: IndexPaperOptions) {
    try {
        log.info('CLI: Indexing paper', { arxivId: options.arxivId });

        // Handle file input for full-text (if starts with @)
        let fullText = options.fullText;
        if (fullText.startsWith('@')) {
            const filePath = fullText.substring(1);
            fullText = await fs.readFile(filePath, 'utf-8');
            log.info('Loaded full text from file', { filePath, length: fullText.length });
        }

        const indexer = createHybridIndexer();

        const paper: PaperInput = {
            arxivId: options.arxivId,
            paperId: options.arxivId, // Use ArXiv ID as paper ID
            title: options.title,
            abstract: options.abstract,
            fullText,
            sections: options.sections ? JSON.parse(options.sections) : undefined,
            categories: options.categories?.split(',').map(c => c.trim()),
            publishedDate: options.publishedDate,
        };

        const result = await indexer.indexPaper(paper);

        // Output JSON for Airflow to parse
        const output = {
            success: result.success,
            arxiv_id: options.arxivId,
            chunks_created: result.chunksCreated,
            chunks_indexed: result.chunksIndexed,
            errors: result.errors,
        };

        console.log(JSON.stringify(output));
        log.info('CLI: Indexing complete', output);

        process.exit(result.success ? 0 : 1);
    } catch (error) {
        const errorOutput = {
            success: false,
            arxiv_id: options.arxivId,
            error: error instanceof Error ? error.message : String(error),
        };

        console.error(JSON.stringify(errorOutput));
        log.error('CLI: Indexing failed', error as Error);
        process.exit(1);
    }
}

/**
 * Re-index a paper (fetch from OpenSearch, delete, re-embed, re-index)
 */
export async function reindexPaperCLI(options: ReindexPaperOptions) {
    try {
        log.info('CLI: Re-indexing paper', { arxivId: options.arxivId });

        const searchClient = createOpenSearchClient();

        // Fetch existing chunks to reconstruct paper
        const existingChunks = await searchClient.getChunksByPaper(options.arxivId);

        if (existingChunks.length === 0) {
            const errorOutput = {
                success: false,
                arxiv_id: options.arxivId,
                error: `Paper ${options.arxivId} not found in index`,
            };
            console.error(JSON.stringify(errorOutput));
            process.exit(1);
        }

        // Reconstruct paper from chunks
        const firstChunk = existingChunks[0];
        const allText = existingChunks
            .sort((a: ChunkHit, b: ChunkHit) => (a.chunkIndex || 0) - (b.chunkIndex || 0))
            .map((c: ChunkHit) => c.chunkText)
            .join('\n\n');

        const paper: PaperInput = {
            arxivId: options.arxivId,
            paperId: options.arxivId,
            title: firstChunk.title,
            abstract: firstChunk.abstract,
            fullText: allText,
            categories: firstChunk.metadata?.categories,
            publishedDate: firstChunk.metadata?.publishedDate,
        };

        const indexer = createHybridIndexer();
        const result = await indexer.reindexPaper(paper);

        const output = {
            success: result.success,
            arxiv_id: options.arxivId,
            chunks_created: result.chunksCreated,
            chunks_indexed: result.chunksIndexed,
            force_embed: options.forceEmbed || false,
        };

        console.log(JSON.stringify(output));
        log.info('CLI: Re-indexing complete', output);

        process.exit(result.success ? 0 : 1);
    } catch (error) {
        const errorOutput = {
            success: false,
            arxiv_id: options.arxivId,
            error: error instanceof Error ? error.message : String(error),
        };

        console.error(JSON.stringify(errorOutput));
        log.error('CLI: Re-indexing failed', error as Error);
        process.exit(1);
    }
}

/**
 * Delete a paper's chunks from the index
 */
export async function deletePaperCLI(options: DeletePaperOptions) {
    try {
        log.info('CLI: Deleting paper', { arxivId: options.arxivId });

        const indexer = createHybridIndexer();
        const success = await indexer.deletePaper(options.arxivId);

        const output = {
            success,
            arxiv_id: options.arxivId,
            deleted: success,
        };

        console.log(JSON.stringify(output));
        log.info('CLI: Deletion complete', output);

        process.exit(success ? 0 : 1);
    } catch (error) {
        const errorOutput = {
            success: false,
            arxiv_id: options.arxivId,
            error: error instanceof Error ? error.message : String(error),
        };

        console.error(JSON.stringify(errorOutput));
        log.error('CLI: Deletion failed', error as Error);
        process.exit(1);
    }
}
