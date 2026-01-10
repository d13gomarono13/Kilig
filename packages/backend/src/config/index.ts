/**
 * Kilig Configuration System
 * 
 * Typed configuration management with environment variable support.
 * Inspired by Pydantic settings pattern from arxiv-paper-curator.
 */

import 'dotenv/config';
import { z } from 'zod';

// ============================================================================
// Schema Definitions
// ============================================================================

const ArxivSettingsSchema = z.object({
    baseUrl: z.string().default('https://export.arxiv.org/api/query'),
    pdfCacheDir: z.string().default('./data/arxiv_pdfs'),
    rateLimitDelay: z.number().default(3.0),
    timeoutSeconds: z.number().default(30),
    maxResults: z.number().default(15),
    searchCategory: z.string().default('cs.AI'),
    downloadMaxRetries: z.number().default(3),
    downloadRetryDelayBase: z.number().default(5.0),
    maxConcurrentDownloads: z.number().default(5),
    maxConcurrentParsing: z.number().default(1),
});

const ChunkingSettingsSchema = z.object({
    chunkSize: z.number().default(600),        // Target words per chunk
    overlapSize: z.number().default(100),      // Words to overlap between chunks
    minChunkSize: z.number().default(100),     // Minimum words for a valid chunk
    sectionBased: z.boolean().default(true),   // Use section-based chunking when available
});

const OpenSearchSettingsSchema = z.object({
    host: z.string().default('http://localhost:9200'),
    indexName: z.string().default('kilig-papers'),
    chunkIndexSuffix: z.string().default('chunks'),
    maxTextSize: z.number().default(1000000),

    // Vector search settings
    vectorDimension: z.number().default(768),  // Gemini text-embedding-004 dimension
    vectorSpaceType: z.string().default('cosinesimil'),

    // Hybrid search settings
    rrfPipelineName: z.string().default('hybrid-rrf-pipeline'),
    hybridSearchSizeMultiplier: z.number().default(2),
});

const RedisSettingsSchema = z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().default(''),
    db: z.number().default(0),
    decodeResponses: z.boolean().default(true),
    socketTimeout: z.number().default(30),
    socketConnectTimeout: z.number().default(30),

    // Cache settings
    ttlHours: z.number().default(6),
    enabled: z.boolean().default(false),
});

const LangfuseSettingsSchema = z.object({
    publicKey: z.string().default(''),
    secretKey: z.string().default(''),
    host: z.string().default('http://localhost:3001'),
    enabled: z.boolean().default(false),
    flushAt: z.number().default(15),
    flushInterval: z.number().default(1.0),
    maxRetries: z.number().default(3),
    timeout: z.number().default(30),
    debug: z.boolean().default(false),
});

const EmbeddingsSettingsSchema = z.object({
    provider: z.enum(['gemini', 'jina']).default('gemini'),
    geminiModel: z.string().default('text-embedding-004'),
    jinaApiKey: z.string().default(''),
    jinaBaseUrl: z.string().default('https://api.jina.ai/v1'),
    dimension: z.number().default(768),  // 768 for Gemini, 1024 for Jina
    batchSize: z.number().default(10),
});

const AgenticRagSettingsSchema = z.object({
    // Guardrail settings
    guardrailThreshold: z.number().default(50),  // 0-100 score threshold

    // Retrieval settings
    topK: z.number().default(5),
    useHybrid: z.boolean().default(true),
    maxRetrievalAttempts: z.number().default(3),

    // Grading settings
    relevanceThreshold: z.number().default(0.5),

    // LLM settings
    temperature: z.number().default(0.0),
});

const SettingsSchema = z.object({
    appVersion: z.string().default('0.2.0'),
    debug: z.boolean().default(true),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    serviceName: z.string().default('kilig-rag'),

    // Nested settings
    arxiv: ArxivSettingsSchema.default({}),
    chunking: ChunkingSettingsSchema.default({}),
    opensearch: OpenSearchSettingsSchema.default({}),
    redis: RedisSettingsSchema.default({}),
    langfuse: LangfuseSettingsSchema.default({}),
    embeddings: EmbeddingsSettingsSchema.default({}),
    agenticRag: AgenticRagSettingsSchema.default({}),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ArxivSettings = z.infer<typeof ArxivSettingsSchema>;
export type ChunkingSettings = z.infer<typeof ChunkingSettingsSchema>;
export type OpenSearchSettings = z.infer<typeof OpenSearchSettingsSchema>;
export type RedisSettings = z.infer<typeof RedisSettingsSchema>;
export type LangfuseSettings = z.infer<typeof LangfuseSettingsSchema>;
export type EmbeddingsSettings = z.infer<typeof EmbeddingsSettingsSchema>;
export type AgenticRagSettings = z.infer<typeof AgenticRagSettingsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// ============================================================================
// Environment Variable Parsing
// ============================================================================

function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

function parseEnvNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

function loadSettingsFromEnv(): Settings {
    const rawSettings = {
        appVersion: process.env.APP_VERSION,
        debug: parseEnvBoolean(process.env.DEBUG, true),
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        serviceName: process.env.SERVICE_NAME,

        arxiv: {
            baseUrl: process.env.ARXIV_BASE_URL,
            pdfCacheDir: process.env.ARXIV_PDF_CACHE_DIR,
            rateLimitDelay: parseEnvNumber(process.env.ARXIV_RATE_LIMIT_DELAY, 3.0),
            timeoutSeconds: parseEnvNumber(process.env.ARXIV_TIMEOUT_SECONDS, 30),
            maxResults: parseEnvNumber(process.env.ARXIV_MAX_RESULTS, 15),
            searchCategory: process.env.ARXIV_SEARCH_CATEGORY,
            downloadMaxRetries: parseEnvNumber(process.env.ARXIV_DOWNLOAD_MAX_RETRIES, 3),
            downloadRetryDelayBase: parseEnvNumber(process.env.ARXIV_DOWNLOAD_RETRY_DELAY_BASE, 5.0),
            maxConcurrentDownloads: parseEnvNumber(process.env.ARXIV_MAX_CONCURRENT_DOWNLOADS, 5),
            maxConcurrentParsing: parseEnvNumber(process.env.ARXIV_MAX_CONCURRENT_PARSING, 1),
        },

        chunking: {
            chunkSize: parseEnvNumber(process.env.CHUNKING_CHUNK_SIZE, 600),
            overlapSize: parseEnvNumber(process.env.CHUNKING_OVERLAP_SIZE, 100),
            minChunkSize: parseEnvNumber(process.env.CHUNKING_MIN_CHUNK_SIZE, 100),
            sectionBased: parseEnvBoolean(process.env.CHUNKING_SECTION_BASED, true),
        },

        opensearch: {
            host: process.env.OPENSEARCH_HOST,
            indexName: process.env.OPENSEARCH_INDEX_NAME,
            chunkIndexSuffix: process.env.OPENSEARCH_CHUNK_INDEX_SUFFIX,
            maxTextSize: parseEnvNumber(process.env.OPENSEARCH_MAX_TEXT_SIZE, 1000000),
            vectorDimension: parseEnvNumber(process.env.OPENSEARCH_VECTOR_DIMENSION, 768),
            vectorSpaceType: process.env.OPENSEARCH_VECTOR_SPACE_TYPE,
            rrfPipelineName: process.env.OPENSEARCH_RRF_PIPELINE_NAME,
            hybridSearchSizeMultiplier: parseEnvNumber(process.env.OPENSEARCH_HYBRID_SEARCH_SIZE_MULTIPLIER, 2),
        },

        redis: {
            host: process.env.REDIS_HOST,
            port: parseEnvNumber(process.env.REDIS_PORT, 6379),
            password: process.env.REDIS_PASSWORD,
            db: parseEnvNumber(process.env.REDIS_DB, 0),
            decodeResponses: parseEnvBoolean(process.env.REDIS_DECODE_RESPONSES, true),
            socketTimeout: parseEnvNumber(process.env.REDIS_SOCKET_TIMEOUT, 30),
            socketConnectTimeout: parseEnvNumber(process.env.REDIS_SOCKET_CONNECT_TIMEOUT, 30),
            ttlHours: parseEnvNumber(process.env.REDIS_TTL_HOURS, 6),
            enabled: parseEnvBoolean(process.env.REDIS_ENABLED, false),
        },

        langfuse: {
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            host: process.env.LANGFUSE_HOST,
            enabled: parseEnvBoolean(process.env.LANGFUSE_ENABLED, false),
            flushAt: parseEnvNumber(process.env.LANGFUSE_FLUSH_AT, 15),
            flushInterval: parseEnvNumber(process.env.LANGFUSE_FLUSH_INTERVAL, 1.0),
            maxRetries: parseEnvNumber(process.env.LANGFUSE_MAX_RETRIES, 3),
            timeout: parseEnvNumber(process.env.LANGFUSE_TIMEOUT, 30),
            debug: parseEnvBoolean(process.env.LANGFUSE_DEBUG, false),
        },

        embeddings: {
            provider: process.env.EMBEDDINGS_PROVIDER as 'gemini' | 'jina',
            geminiModel: process.env.EMBEDDINGS_GEMINI_MODEL,
            jinaApiKey: process.env.JINA_API_KEY,
            jinaBaseUrl: process.env.JINA_BASE_URL,
            dimension: parseEnvNumber(process.env.EMBEDDINGS_DIMENSION, 768),
            batchSize: parseEnvNumber(process.env.EMBEDDINGS_BATCH_SIZE, 10),
        },

        agenticRag: {
            guardrailThreshold: parseEnvNumber(process.env.AGENTIC_RAG_GUARDRAIL_THRESHOLD, 50),
            topK: parseEnvNumber(process.env.AGENTIC_RAG_TOP_K, 5),
            useHybrid: parseEnvBoolean(process.env.AGENTIC_RAG_USE_HYBRID, true),
            maxRetrievalAttempts: parseEnvNumber(process.env.AGENTIC_RAG_MAX_RETRIEVAL_ATTEMPTS, 3),
            relevanceThreshold: parseEnvNumber(process.env.AGENTIC_RAG_RELEVANCE_THRESHOLD, 0.5),
            temperature: parseEnvNumber(process.env.AGENTIC_RAG_TEMPERATURE, 0.0),
        },
    };

    // Parse and validate with defaults
    return SettingsSchema.parse(rawSettings);
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _settings: Settings | null = null;

export function getSettings(): Settings {
    if (!_settings) {
        _settings = loadSettingsFromEnv();
        console.log(`[Config] Loaded settings for environment: ${_settings.environment}`);
    }
    return _settings;
}

// Re-export for convenience
export const settings = getSettings();
