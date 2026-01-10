/**
 * OpenSearch Index Configuration
 * 
 * Defines index mappings for hybrid search (BM25 + vector) and RRF pipeline.
 */

import { getSettings } from '../../config/index.js';

const settings = getSettings();

/**
 * Hybrid index mapping for paper chunks
 * Supports both BM25 text search and k-NN vector search
 */
export const ARXIV_PAPERS_CHUNKS_MAPPING = {
    settings: {
        index: {
            knn: true,
            'knn.space_type': 'cosinesimil',
        },
        analysis: {
            analyzer: {
                default: {
                    type: 'standard',
                },
            },
        },
    },
    mappings: {
        properties: {
            // Text fields for BM25 search
            chunk_text: {
                type: 'text',
                analyzer: 'standard',
            },
            title: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                    keyword: {
                        type: 'keyword',
                        ignore_above: 512,
                    },
                },
            },
            abstract: {
                type: 'text',
                analyzer: 'standard',
            },
            section_title: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                    keyword: {
                        type: 'keyword',
                        ignore_above: 256,
                    },
                },
            },

            // Metadata fields
            arxiv_id: {
                type: 'keyword',
            },
            paper_id: {
                type: 'keyword',
            },
            chunk_index: {
                type: 'integer',
            },
            word_count: {
                type: 'integer',
            },
            categories: {
                type: 'keyword',
            },
            published_date: {
                type: 'date',
                format: 'yyyy-MM-dd||yyyy-MM-dd\'T\'HH:mm:ss||epoch_millis',
            },

            // Vector field for k-NN search
            embedding: {
                type: 'knn_vector',
                dimension: settings.opensearch.vectorDimension,
                method: {
                    name: 'hnsw',
                    space_type: 'cosinesimil',
                    engine: 'lucene',
                    parameters: {
                        ef_construction: 128,
                        m: 16,
                    },
                },
            },

            // Additional metadata
            metadata: {
                type: 'object',
                enabled: false,
            },
        },
    },
};

/**
 * RRF (Reciprocal Rank Fusion) search pipeline for hybrid search
 * Combines BM25 and vector search results using RRF scoring
 */
export const HYBRID_RRF_PIPELINE = {
    id: settings.opensearch.rrfPipelineName,
    description: 'Hybrid search pipeline using RRF to combine BM25 and vector search results',
    phaseResultsProcessors: [
        {
            'normalization-processor': {
                normalization: {
                    technique: 'min_max',
                },
                combination: {
                    technique: 'arithmetic_mean',
                    parameters: {
                        weights: [0.4, 0.6], // 40% BM25, 60% vector
                    },
                },
            },
        },
    ],
};
