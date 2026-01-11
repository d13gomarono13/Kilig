/**
 * Setup Indices CLI Command
 * 
 * Sets up OpenSearch indices with proper mappings.
 * Run once on deployment or when index schema changes.
 */

import { createHybridIndexer } from '../services/indexing/hybrid-indexer.js';
import { getLogger } from '../utils/logger.js';

const log = getLogger('CLI:SetupIndices');

interface SetupIndicesOptions {
    force?: boolean;
}

/**
 * Setup OpenSearch indices
 */
export async function setupIndicesCLI(options: SetupIndicesOptions) {
    try {
        log.info('CLI: Setting up indices', { force: options.force || false });

        const indexer = createHybridIndexer();
        await indexer.setupIndex(options.force || false);

        const output = {
            success: true,
            message: 'Indices setup complete',
            force: options.force || false,
        };

        console.log(JSON.stringify(output));
        log.info('CLI: Setup complete', output);

        process.exit(0);
    } catch (error) {
        const errorOutput = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };

        console.error(JSON.stringify(errorOutput));
        log.error('CLI: Setup failed', error as Error);
        process.exit(1);
    }
}
