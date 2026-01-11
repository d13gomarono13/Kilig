import { getCacheClient, CacheableRequest } from './redis-client.js';

const HOT_QUERIES = [
    'latest developments in quantum computing',
    'transformer architecture optimization',
    'climate change mitigation strategies',
    'advancements in cancer immunotherapy',
    'fusion energy progress',
    'generative ai in healthcare',
    'solid state batteries',
    'CRISPR gene editing applications',
    'neuromorphic computing',
    'autonomous vehicle safety'
];

export class CacheWarmer {
    private isWarming: boolean = false;

    /**
     * Start the cache warming process
     * This iterates through hot queries and ensures they are cached.
     * Note: In a real production scenario, this would call the actual RAG pipeline
     * to populate the cache. For now, we simulate the check to avoid API costs
     * on every startup during development.
     */
    async warmup(): Promise<void> {
        if (this.isWarming) {
            console.log('[CacheWarmer] Warming already in progress');
            return;
        }

        this.isWarming = true;
        console.log('[CacheWarmer] Starting cache warmup...');

        const client = getCacheClient();
        const connected = await client.connect();

        if (!connected) {
            console.log('[CacheWarmer] Cache not enabled or disconnected. Skipping warmup.');
            this.isWarming = false;
            return;
        }

        let hits = 0;
        let misses = 0;

        for (const query of HOT_QUERIES) {
            const request: CacheableRequest = {
                query,
                model: 'default',
                useHybrid: true
            };

            // Just checking if it exists in cache
            const cached = await client.findCachedResponse(request);
            if (cached) {
                hits++;
            } else {
                misses++;
                // TODO: In production, trigger a background job to fetch this query
                // await ragService.process(query);
            }
        }

        console.log(`[CacheWarmer] Warmup complete. Hits: ${hits}, Misses: ${misses}`);
        this.isWarming = false;
    }
}

// Singleton
let _warmer: CacheWarmer | null = null;

export function getCacheWarmer(): CacheWarmer {
    if (!_warmer) {
        _warmer = new CacheWarmer();
    }
    return _warmer;
}
