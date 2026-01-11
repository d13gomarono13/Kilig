/**
 * Check Existing Papers CLI Command
 * 
 * Checks which papers already exist in OpenSearch index.
 * Used by Airflow to filter out already-indexed papers.
 */

import { createOpenSearchClient } from '../services/opensearch/index.js';
import { getLogger } from '../utils/logger.js';

const log = getLogger('CLI:CheckExisting');

interface CheckExistingOptions {
    arxivIds: string;
}

/**
 * Check which papers already exist in the index
 */
export async function checkExistingPapers(options: CheckExistingOptions) {
    try {
        const arxivIds = options.arxivIds.split(',').map(id => id.trim());

        log.info('CLI: Checking existing papers', { count: arxivIds.length });

        const client = createOpenSearchClient();
        const existingIds: string[] = [];

        // Check each paper (use getChunksByPaper for efficiency)
        for (const arxivId of arxivIds) {
            const chunks = await client.getChunksByPaper(arxivId);
            if (chunks.length > 0) {
                existingIds.push(arxivId);
            }
        }

        const output = {
            total: arxivIds.length,
            existing: existingIds.length,
            new: arxivIds.length - existingIds.length,
            existing_ids: existingIds,
        };

        console.log(JSON.stringify(output));
        log.info('CLI: Check complete', output);

        process.exit(0);
    } catch (error) {
        const errorOutput = {
            error: error instanceof Error ? error.message : String(error),
        };

        console.error(JSON.stringify(errorOutput));
        log.error('CLI: Check failed', error as Error);
        process.exit(1);
    }
}
