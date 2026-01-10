import { getSettings } from '../../config/index.js';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface LangfuseTrace {
    name: string;
    id?: string;
    metadata?: Record<string, any>;
    input?: any;
    output?: any;
}

export interface LangfuseObservation {
    name: string;
    traceId: string;
    type: 'SPAN' | 'EVENT' | 'GENERATION';
    startTime: number;
    endTime?: number;
    input?: any;
    output?: any;
    metadata?: Record<string, any>;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

class LangfuseLogger {
    private settings = getSettings().langfuse;
    private enabled = false;

    private asyncContext = new AsyncLocalStorage<string>();

    constructor() {
        this.enabled = this.settings.enabled && !!this.settings.publicKey && !!this.settings.secretKey;
        if (this.enabled) {
            console.log('[Langfuse] Integration ENABLED');
        }
    }

    private async send(endpoint: string, body: any) {
        if (!this.enabled) return;

        const auth = Buffer.from(`${this.settings.publicKey}:${this.settings.secretKey}`).toString('base64');

        try {
            const response = await fetch(`${this.settings.host}/api/public/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                console.warn(`[Langfuse] API error (${response.status}): ${text}`);
            }
        } catch (error) {
            console.error('[Langfuse] Failed to send log:', error);
        }
    }

    getTraceId(): string | undefined {
        return this.asyncContext.getStore();
    }

    async withTrace<T>(traceId: string, fn: () => Promise<T>): Promise<T> {
        return this.asyncContext.run(traceId, fn);
    }

    async createTrace(trace: LangfuseTrace) {
        const id = trace.id || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await this.send('traces', {
            id,
            name: trace.name,
            metadata: trace.metadata,
            input: trace.input,
            output: trace.output,
            timestamp: new Date().toISOString()
        });
        return id;
    }

    async logGeneration(obs: Omit<LangfuseObservation, 'type'>) {
        const traceId = obs.traceId || this.getTraceId();
        if (!traceId) return; // Cannot log without trace ID

        await this.send('ingestion', {
            batch: [{
                type: 'generation',
                id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                traceId: traceId,
                name: obs.name,
                startTime: new Date(obs.startTime).toISOString(),
                endTime: obs.endTime ? new Date(obs.endTime).toISOString() : undefined,
                input: obs.input,
                output: obs.output,
                metadata: obs.metadata,
                model: obs.model,
                usage: obs.usage ? {
                    input: obs.usage.promptTokens,
                    output: obs.usage.completionTokens,
                    total: obs.usage.totalTokens
                } : undefined
            }]
        });
    }

    async logSpan(obs: Omit<LangfuseObservation, 'type'>) {
        const traceId = obs.traceId || this.getTraceId();
        if (!traceId) return;

        await this.send('ingestion', {
            batch: [{
                type: 'span',
                id: `span_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                traceId: traceId,
                name: obs.name,
                startTime: new Date(obs.startTime).toISOString(),
                endTime: obs.endTime ? new Date(obs.endTime).toISOString() : undefined,
                input: obs.input,
                output: obs.output,
                metadata: obs.metadata
            }]
        });
    }
}

export const Langfuse = new LangfuseLogger();
