/**
 * OpenSearch Service Exports
 */

export { OpenSearchClient, createOpenSearchClient } from './client.js';
export type { SearchResult, ChunkHit, ChunkData } from './client.js';
export { QueryBuilder } from './query-builder.js';
export type { QueryBuilderOptions, SearchQuery } from './query-builder.js';
export { ARXIV_PAPERS_CHUNKS_MAPPING, HYBRID_RRF_PIPELINE } from './index-config.js';
