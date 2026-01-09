/**
 * OpenSearch Index Snapshot Generator
 * 
 * Exports the current OpenSearch index state to JSON files for zero-search testing.
 * 
 * Usage:
 *   npx tsx scripts/snapshot_opensearch_index.ts
 * 
 * Output:
 *   tests/golden/opensearch/<index-name>/
 *     ├── metadata.json       # Index info, timestamp, document count
 *     └── documents.json      # All indexed documents
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { OpenSearchClient } from '../src/services/opensearch/client.js';
import { config } from '../src/config/index.js';

const GOLDEN_DIR = path.join(process.cwd(), 'tests', 'golden', 'opensearch');

async function snapshotOpenSearchIndex() {
    console.log('📸 OpenSearch Index Snapshot Generator');
    console.log('-'.repeat(60));

    const client = new OpenSearchClient();
    const indexName = config.openSearch.indexName;
    const outputDir = path.join(GOLDEN_DIR, indexName);

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`📊 Index: ${indexName}`);
    console.log(`📁 Output: ${outputDir}`);

    // Check connection
    const isHealthy = await client.checkHealth();
    if (!isHealthy) {
        console.error('❌ OpenSearch is not healthy. Ensure Docker is running.');
        process.exit(1);
    }

    // Export all documents using scroll API
    console.log('\n🔄 Exporting documents...');

    const documents: any[] = [];
    let scrollId: string | undefined;
    let hasMore = true;

    // Initial search with scroll
    const initialResponse = await (client as any).client.search({
        index: indexName,
        scroll: '1m',
        size: 1000,
        body: {
            query: { match_all: {} }
        }
    });

    scrollId = initialResponse.body._scroll_id;
    documents.push(...initialResponse.body.hits.hits.map((hit: any) => ({
        _id: hit._id,
        _source: hit._source
    })));

    // Continue scrolling
    while (hasMore) {
        const scrollResponse = await (client as any).client.scroll({
            scroll_id: scrollId,
            scroll: '1m'
        });

        const hits = scrollResponse.body.hits.hits;
        if (hits.length === 0) {
            hasMore = false;
        } else {
            documents.push(...hits.map((hit: any) => ({
                _id: hit._id,
                _source: hit._source
            })));
            scrollId = scrollResponse.body._scroll_id;
        }
    }

    // Clear scroll
    if (scrollId) {
        await (client as any).client.clearScroll({ scroll_id: scrollId });
    }

    // Save metadata
    const metadata = {
        indexName,
        snapshotAt: new Date().toISOString(),
        documentCount: documents.length,
        openSearchVersion: '2.11'
    };
    fs.writeFileSync(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    // Save documents
    fs.writeFileSync(
        path.join(outputDir, 'documents.json'),
        JSON.stringify(documents, null, 2)
    );

    console.log('\n' + '-'.repeat(60));
    console.log(`📸 Snapshot complete!`);
    console.log(`📊 ${documents.length} documents exported`);
    console.log(`📁 Saved to: ${outputDir}`);
}

snapshotOpenSearchIndex().catch(console.error);
