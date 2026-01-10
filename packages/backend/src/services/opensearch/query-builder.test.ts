/**
 * Unit tests for the OpenSearch Query Builder
 */
import { describe, it, expect } from 'vitest';
import { QueryBuilder, QueryBuilderOptions, SearchQuery } from './query-builder.js';

describe('QueryBuilder', () => {
    describe('constructor defaults', () => {
        it('should set default size to 10', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result.size).toBe(10);
        });

        it('should set default from to 0', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result.from).toBe(0);
        });

        it('should set default track_total_hits to true', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result.track_total_hits).toBe(true);
        });

        it('should use paper fields by default', () => {
            const builder = new QueryBuilder({ query: 'machine learning' });
            const result = builder.build();
            const multiMatch = result.query.bool.must[0].multi_match;

            expect(multiMatch.fields).toContain('title^3');
            expect(multiMatch.fields).toContain('abstract^2');
            expect(multiMatch.fields).toContain('authors^1');
        });

        it('should use chunk fields when searchChunks is true', () => {
            const builder = new QueryBuilder({ query: 'transformers', searchChunks: true });
            const result = builder.build();
            const multiMatch = result.query.bool.must[0].multi_match;

            expect(multiMatch.fields).toContain('chunk_text^3');
            expect(multiMatch.fields).toContain('title^2');
        });
    });

    describe('build()', () => {
        it('should build valid search query structure', () => {
            const builder = new QueryBuilder({ query: 'neural networks' });
            const result = builder.build();

            expect(result).toHaveProperty('query');
            expect(result).toHaveProperty('size');
            expect(result).toHaveProperty('from');
            expect(result).toHaveProperty('track_total_hits');
            expect(result).toHaveProperty('_source');
            expect(result).toHaveProperty('highlight');
        });

        it('should respect custom size', () => {
            const builder = new QueryBuilder({ query: 'test', size: 25 });
            const result = builder.build();

            expect(result.size).toBe(25);
        });

        it('should respect custom from (offset)', () => {
            const builder = new QueryBuilder({ query: 'test', from: 50 });
            const result = builder.build();

            expect(result.from).toBe(50);
        });

        it('should use custom fields when provided', () => {
            const builder = new QueryBuilder({
                query: 'test',
                fields: ['custom_field^5', 'other_field^1']
            });
            const result = builder.build();
            const multiMatch = result.query.bool.must[0].multi_match;

            expect(multiMatch.fields).toEqual(['custom_field^5', 'other_field^1']);
        });
    });

    describe('query building', () => {
        it('should build multi_match query for text search', () => {
            const builder = new QueryBuilder({ query: 'attention mechanism' });
            const result = builder.build();

            expect(result.query.bool.must[0]).toHaveProperty('multi_match');
            expect(result.query.bool.must[0].multi_match.query).toBe('attention mechanism');
            expect(result.query.bool.must[0].multi_match.type).toBe('best_fields');
        });

        it('should use match_all for empty query', () => {
            const builder = new QueryBuilder({ query: '' });
            const result = builder.build();

            expect(result.query.bool.must[0]).toHaveProperty('match_all');
        });

        it('should use match_all for whitespace-only query', () => {
            const builder = new QueryBuilder({ query: '   ' });
            const result = builder.build();

            expect(result.query.bool.must[0]).toHaveProperty('match_all');
        });

        it('should enable fuzzy matching', () => {
            const builder = new QueryBuilder({ query: 'transformr' }); // typo
            const result = builder.build();

            expect(result.query.bool.must[0].multi_match.fuzziness).toBe('AUTO');
        });
    });

    describe('filtering', () => {
        it('should add category filter when categories provided', () => {
            const builder = new QueryBuilder({
                query: 'deep learning',
                categories: ['cs.AI', 'cs.LG']
            });
            const result = builder.build();

            expect(result.query.bool.filter).toBeDefined();
            expect(result.query.bool.filter[0]).toEqual({
                terms: { categories: ['cs.AI', 'cs.LG'] }
            });
        });

        it('should not add filter when categories empty', () => {
            const builder = new QueryBuilder({
                query: 'test',
                categories: []
            });
            const result = builder.build();

            expect(result.query.bool.filter).toBeUndefined();
        });

        it('should not add filter when categories undefined', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result.query.bool.filter).toBeUndefined();
        });
    });

    describe('source fields', () => {
        it('should exclude embedding for chunk search', () => {
            const builder = new QueryBuilder({ query: 'test', searchChunks: true });
            const result = builder.build();

            expect(result._source).toEqual({ excludes: ['embedding'] });
        });

        it('should return specific fields for paper search', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result._source).toContain('arxiv_id');
            expect(result._source).toContain('title');
            expect(result._source).toContain('abstract');
        });
    });

    describe('highlighting', () => {
        it('should configure chunk highlighting for chunk search', () => {
            const builder = new QueryBuilder({ query: 'test', searchChunks: true });
            const result = builder.build();

            expect(result.highlight.fields).toHaveProperty('chunk_text');
            expect(result.highlight.fields.chunk_text.fragment_size).toBe(150);
        });

        it('should configure paper highlighting for paper search', () => {
            const builder = new QueryBuilder({ query: 'test' });
            const result = builder.build();

            expect(result.highlight.fields).toHaveProperty('title');
            expect(result.highlight.fields).toHaveProperty('abstract');
            expect(result.highlight.fields).toHaveProperty('authors');
        });

        it('should use mark tags for highlighting', () => {
            const builder = new QueryBuilder({ query: 'test', searchChunks: true });
            const result = builder.build();

            expect(result.highlight.fields.chunk_text.pre_tags).toContain('<mark>');
            expect(result.highlight.fields.chunk_text.post_tags).toContain('</mark>');
        });
    });

    describe('sorting', () => {
        it('should sort by date when latestPapers is true', () => {
            const builder = new QueryBuilder({ query: 'test', latestPapers: true });
            const result = builder.build();

            expect(result.sort).toBeDefined();
            expect(result.sort![0]).toEqual({ published_date: { order: 'desc' } });
        });

        it('should sort by date for empty queries', () => {
            const builder = new QueryBuilder({ query: '' });
            const result = builder.build();

            expect(result.sort).toBeDefined();
            expect(result.sort![0]).toEqual({ published_date: { order: 'desc' } });
        });

        it('should not add sort for text queries (relevance)', () => {
            const builder = new QueryBuilder({ query: 'neural networks' });
            const result = builder.build();

            expect(result.sort).toBeUndefined();
        });
    });
});
