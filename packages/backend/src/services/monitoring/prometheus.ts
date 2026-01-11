/**
 * Prometheus Metrics Service
 * 
 * Provides metrics collection for monitoring Kilig backend performance.
 * Exposes a /metrics endpoint for Prometheus scraping.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Simple in-memory metrics store
interface MetricValue {
    value: number;
    labels: Record<string, string>;
    timestamp: number;
}

class MetricsRegistry {
    private counters: Map<string, MetricValue[]> = new Map();
    private histograms: Map<string, { sum: number; count: number; buckets: Map<number, number> }[]> = new Map();
    private gauges: Map<string, MetricValue> = new Map();

    // Counter operations
    incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
        const key = this.labelsToKey(name, labels);
        const existing = this.counters.get(key) || [];
        const current = existing.find(m => JSON.stringify(m.labels) === JSON.stringify(labels));

        if (current) {
            current.value += value;
            current.timestamp = Date.now();
        } else {
            existing.push({ value, labels, timestamp: Date.now() });
            this.counters.set(key, existing);
        }
    }

    // Gauge operations
    setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
        const key = this.labelsToKey(name, labels);
        this.gauges.set(key, { value, labels, timestamp: Date.now() });
    }

    // Histogram operations
    observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
        const key = this.labelsToKey(name, labels);
        const buckets = new Map<number, number>();
        const defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

        for (const bucket of defaultBuckets) {
            buckets.set(bucket, value <= bucket ? 1 : 0);
        }

        const existing = this.histograms.get(key);
        if (existing && existing.length > 0) {
            const current = existing[0];
            current.sum += value;
            current.count += 1;
            for (const bucket of defaultBuckets) {
                const prev = current.buckets.get(bucket) || 0;
                current.buckets.set(bucket, prev + (value <= bucket ? 1 : 0));
            }
        } else {
            this.histograms.set(key, [{ sum: value, count: 1, buckets }]);
        }
    }

    // Generate Prometheus format output
    toPrometheusFormat(): string {
        const lines: string[] = [];

        // Counters
        const counterEntries = Array.from(this.counters.entries());
        for (const [key, values] of counterEntries) {
            const name = key.split('{')[0];
            lines.push(`# HELP ${name} Counter metric`);
            lines.push(`# TYPE ${name} counter`);
            for (const v of values) {
                const labelStr = this.formatLabels(v.labels);
                lines.push(`${name}${labelStr} ${v.value}`);
            }
        }

        // Gauges
        const gaugesByName = new Map<string, MetricValue[]>();
        const gaugeEntries = Array.from(this.gauges.entries());
        for (const [key, value] of gaugeEntries) {
            const name = key.split('{')[0];
            const existing = gaugesByName.get(name) || [];
            existing.push(value);
            gaugesByName.set(name, existing);
        }

        const gaugeNameEntries = Array.from(gaugesByName.entries());
        for (const [name, values] of gaugeNameEntries) {
            lines.push(`# HELP ${name} Gauge metric`);
            lines.push(`# TYPE ${name} gauge`);
            for (const v of values) {
                const labelStr = this.formatLabels(v.labels);
                lines.push(`${name}${labelStr} ${v.value}`);
            }
        }

        // Histograms
        const histogramEntries = Array.from(this.histograms.entries());
        for (const [key, values] of histogramEntries) {
            const name = key.split('{')[0];
            lines.push(`# HELP ${name} Histogram metric`);
            lines.push(`# TYPE ${name} histogram`);

            for (const v of values) {
                const bucketEntries = Array.from(v.buckets.entries());
                for (const [bucket, count] of bucketEntries) {
                    lines.push(`${name}_bucket{le="${bucket}"} ${count}`);
                }
                lines.push(`${name}_bucket{le="+Inf"} ${v.count}`);
                lines.push(`${name}_sum ${v.sum}`);
                lines.push(`${name}_count ${v.count}`);
            }
        }

        return lines.join('\n');
    }

    private labelsToKey(name: string, labels: Record<string, string>): string {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }

    private formatLabels(labels: Record<string, string>): string {
        const entries = Object.entries(labels);
        if (entries.length === 0) return '';
        return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
    }
}

// Global metrics registry instance
export const metrics = new MetricsRegistry();

// Pre-defined metrics
export const KiligMetrics = {
    // HTTP request metrics
    httpRequestsTotal: (method: string, path: string, status: number) => {
        metrics.incrementCounter('http_requests_total', 1, { method, path, status: String(status) });
    },

    httpRequestDuration: (method: string, path: string, durationSeconds: number) => {
        metrics.observeHistogram('http_request_duration_seconds', durationSeconds, { method, path });
    },

    // Agent execution metrics
    agentExecutionTotal: (agentName: string, status: 'success' | 'error') => {
        metrics.incrementCounter('agent_execution_total', 1, { agent: agentName, status });
    },

    agentExecutionDuration: (agentName: string, durationSeconds: number) => {
        metrics.observeHistogram('agent_execution_duration_seconds', durationSeconds, { agent: agentName });
    },

    // Search metrics
    searchRequestsTotal: (searchType: 'bm25' | 'vector' | 'hybrid') => {
        metrics.incrementCounter('search_requests_total', 1, { type: searchType });
    },

    searchLatency: (searchType: string, durationSeconds: number) => {
        metrics.observeHistogram('search_latency_seconds', durationSeconds, { type: searchType });
    },

    // Cache metrics
    cacheOperationsTotal: (operation: 'hit' | 'miss' | 'set') => {
        metrics.incrementCounter('cache_operations_total', 1, { operation });
    },

    // Embedding metrics
    embeddingsGenerated: (count: number = 1) => {
        metrics.incrementCounter('embeddings_generated_total', count);
    },

    embeddingLatency: (durationSeconds: number) => {
        metrics.observeHistogram('embedding_generation_seconds', durationSeconds);
    },

    // Paper indexing metrics
    papersIndexedTotal: (status: 'success' | 'error') => {
        metrics.incrementCounter('papers_indexed_total', 1, { status });
    },

    chunksIndexedTotal: (count: number) => {
        metrics.incrementCounter('chunks_indexed_total', count);
    },

    // Active connections gauge
    setActiveConnections: (service: string, count: number) => {
        metrics.setGauge('active_connections', count, { service });
    },
};

/**
 * Register metrics endpoint with Fastify
 */
export async function registerMetricsEndpoint(app: FastifyInstance): Promise<void> {
    app.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
        reply.header('Content-Type', 'text/plain; version=0.0.4');
        return reply.send(metrics.toPrometheusFormat());
    });

    console.log('[Metrics] Prometheus metrics endpoint registered at /metrics');
}

/**
 * Register metrics hooks with Fastify to track HTTP request metrics
 * Call this during app initialization to automatically track all requests.
 */
export function registerMetricsHooks(app: FastifyInstance): void {
    // Store start time in request context
    app.addHook('onRequest', async (request) => {
        (request as any).metricsStartTime = process.hrtime.bigint();
    });

    // Record metrics after response is sent
    app.addHook('onResponse', async (request, reply) => {
        const startTime = (request as any).metricsStartTime as bigint | undefined;
        if (!startTime) return;

        const end = process.hrtime.bigint();
        const durationNs = Number(end - startTime);
        const durationSeconds = durationNs / 1e9;

        const method = request.method;
        const path = request.routeOptions?.url || request.url;
        const status = reply.statusCode;

        KiligMetrics.httpRequestsTotal(method, path, status);
        KiligMetrics.httpRequestDuration(method, path, durationSeconds);
    });

    console.log('[Metrics] HTTP request tracking hooks registered');
}
