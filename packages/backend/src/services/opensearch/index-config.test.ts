/**
 * Unit tests for OpenSearch Index Configuration
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the config before importing
vi.mock('../../config/index.js', () => ({
    getSettings: () => ({
        opensearch: {
            vectorDimension: 768,
            rrfPipelineName: 'test-rrf-pipeline'
        }
    })
}));

import { ARXIV_PAPERS_CHUNKS_MAPPING, HYBRID_RRF_PIPELINE } from './index-config.js';

describe('OpenSearch Index Configuration', () => {
    describe('ARXIV_PAPERS_CHUNKS_MAPPING', () => {
        it('should export the index mapping', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING).toBeDefined();
        });

        it('should enable k-NN in settings', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.settings.index.knn).toBe(true);
        });

        it('should set cosine similarity space type', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.settings.index['knn.space_type']).toBe('cosinesimil');
        });

        it('should use standard analyzer for text fields', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.chunk_text.analyzer).toBe('standard');
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.title.analyzer).toBe('standard');
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.abstract.analyzer).toBe('standard');
        });

        it('should have keyword subfield for title', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.title.fields.keyword.type).toBe('keyword');
        });

        it('should have keyword type for arxiv_id', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.arxiv_id.type).toBe('keyword');
        });

        it('should have integer type for chunk_index', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.chunk_index.type).toBe('integer');
        });

        it('should configure date type for published_date', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.published_date.type).toBe('date');
        });

        it('should configure embedding as knn_vector', () => {
            const embedding = ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.embedding;
            expect(embedding.type).toBe('knn_vector');
            expect(embedding.dimension).toBe(768); // From mock settings
            expect(embedding.method.name).toBe('hnsw');
            expect(embedding.method.engine).toBe('lucene');
        });

        it('should configure HNSW parameters', () => {
            const params = ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.embedding.method.parameters;
            expect(params.ef_construction).toBe(128);
            expect(params.m).toBe(16);
        });

        it('should disable indexing for metadata field', () => {
            expect(ARXIV_PAPERS_CHUNKS_MAPPING.mappings.properties.metadata.enabled).toBe(false);
        });
    });

    describe('HYBRID_RRF_PIPELINE', () => {
        it('should export the pipeline configuration', () => {
            expect(HYBRID_RRF_PIPELINE).toBeDefined();
        });

        it('should have id from settings', () => {
            expect(HYBRID_RRF_PIPELINE.id).toBe('test-rrf-pipeline');
        });

        it('should have description', () => {
            expect(HYBRID_RRF_PIPELINE.description).toContain('Hybrid search');
        });

        it('should have phase results processors', () => {
            expect(HYBRID_RRF_PIPELINE.phaseResultsProcessors).toBeDefined();
            expect(HYBRID_RRF_PIPELINE.phaseResultsProcessors.length).toBeGreaterThan(0);
        });

        it('should use min_max normalization', () => {
            const processor = HYBRID_RRF_PIPELINE.phaseResultsProcessors[0]['normalization-processor'];
            expect(processor.normalization.technique).toBe('min_max');
        });

        it('should use arithmetic_mean combination', () => {
            const processor = HYBRID_RRF_PIPELINE.phaseResultsProcessors[0]['normalization-processor'];
            expect(processor.combination.technique).toBe('arithmetic_mean');
        });

        it('should weight BM25 less than vector (0.4 vs 0.6)', () => {
            const processor = HYBRID_RRF_PIPELINE.phaseResultsProcessors[0]['normalization-processor'];
            const weights = processor.combination.parameters.weights;
            expect(weights[0]).toBe(0.4); // BM25
            expect(weights[1]).toBe(0.6); // Vector
        });
    });
});
