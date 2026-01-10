/**
 * OpenSearch Query Builder
 * 
 * Builds complex OpenSearch queries with proper scoring, filtering, and highlighting.
 */

export interface QueryBuilderOptions {
    query: string;
    size?: number;
    from?: number;
    fields?: string[];
    categories?: string[];
    trackTotalHits?: boolean;
    latestPapers?: boolean;
    searchChunks?: boolean;
}

export interface SearchQuery {
    query: Record<string, any>;
    size: number;
    from: number;
    track_total_hits: boolean;
    _source: any;
    highlight: Record<string, any>;
    sort?: Array<Record<string, any>>;
}

export class QueryBuilder {
    private query: string;
    private size: number;
    private from: number;
    private fields: string[];
    private categories?: string[];
    private trackTotalHits: boolean;
    private latestPapers: boolean;
    private searchChunks: boolean;

    constructor(options: QueryBuilderOptions) {
        this.query = options.query;
        this.size = options.size ?? 10;
        this.from = options.from ?? 0;
        this.categories = options.categories;
        this.trackTotalHits = options.trackTotalHits ?? true;
        this.latestPapers = options.latestPapers ?? false;
        this.searchChunks = options.searchChunks ?? false;

        // Default fields based on search type
        if (options.fields) {
            this.fields = options.fields;
        } else if (this.searchChunks) {
            this.fields = ['chunk_text^3', 'title^2', 'abstract^1'];
        } else {
            this.fields = ['title^3', 'abstract^2', 'authors^1'];
        }
    }

    build(): SearchQuery {
        return {
            query: this.buildQuery(),
            size: this.size,
            from: this.from,
            track_total_hits: this.trackTotalHits,
            _source: this.buildSourceFields(),
            highlight: this.buildHighlight(),
            ...this.buildSort(),
        };
    }

    private buildQuery(): Record<string, any> {
        const mustClauses: Array<Record<string, any>> = [];

        if (this.query.trim()) {
            mustClauses.push(this.buildTextQuery());
        }

        const filterClauses = this.buildFilters();

        const boolQuery: Record<string, any> = {};

        if (mustClauses.length > 0) {
            boolQuery.must = mustClauses;
        } else {
            boolQuery.must = [{ match_all: {} }];
        }

        if (filterClauses.length > 0) {
            boolQuery.filter = filterClauses;
        }

        return { bool: boolQuery };
    }

    private buildTextQuery(): Record<string, any> {
        return {
            multi_match: {
                query: this.query,
                fields: this.fields,
                type: 'best_fields',
                operator: 'or',
                fuzziness: 'AUTO',
                prefix_length: 2,
            },
        };
    }

    private buildFilters(): Array<Record<string, any>> {
        const filters: Array<Record<string, any>> = [];

        if (this.categories && this.categories.length > 0) {
            filters.push({ terms: { categories: this.categories } });
        }

        return filters;
    }

    private buildSourceFields(): any {
        if (this.searchChunks) {
            return { excludes: ['embedding'] };
        }
        return ['arxiv_id', 'title', 'authors', 'abstract', 'categories', 'published_date', 'pdf_url'];
    }

    private buildHighlight(): Record<string, any> {
        if (this.searchChunks) {
            return {
                fields: {
                    chunk_text: {
                        fragment_size: 150,
                        number_of_fragments: 2,
                        pre_tags: ['<mark>'],
                        post_tags: ['</mark>'],
                    },
                    title: {
                        fragment_size: 0,
                        number_of_fragments: 0,
                        pre_tags: ['<mark>'],
                        post_tags: ['</mark>'],
                    },
                    abstract: {
                        fragment_size: 150,
                        number_of_fragments: 1,
                        pre_tags: ['<mark>'],
                        post_tags: ['</mark>'],
                    },
                },
                require_field_match: false,
            };
        }

        // Paper-specific highlighting
        return {
            fields: {
                title: {
                    fragment_size: 0,
                    number_of_fragments: 0,
                },
                abstract: {
                    fragment_size: 150,
                    number_of_fragments: 3,
                    pre_tags: ['<mark>'],
                    post_tags: ['</mark>'],
                },
                authors: {
                    fragment_size: 0,
                    number_of_fragments: 0,
                    pre_tags: ['<mark>'],
                    post_tags: ['</mark>'],
                },
            },
            require_field_match: false,
        };
    }

    private buildSort(): { sort?: Array<Record<string, any>> } {
        if (this.latestPapers) {
            return {
                sort: [{ published_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
            };
        }

        if (!this.query.trim()) {
            return {
                sort: [{ published_date: { order: 'desc' } }, { _score: { order: 'desc' } }],
            };
        }

        // For text queries, sort by relevance (no explicit sort)
        return {};
    }
}
