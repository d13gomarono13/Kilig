import { Langfuse } from 'langfuse';
import { AsyncLocalStorage } from 'node:async_hooks';

const traceContext = new AsyncLocalStorage<string>();

export const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_HOST,
    enabled: process.env.LANGFUSE_ENABLED === 'true'
});

export function createAgentTrace(agentName: string, userId: string, sessionId: string) {
    const parentTraceId = traceContext.getStore();

    // If we have a parent trace, we should link to it or create a span
    // For simplicity in this implementation, if there's a parent trace, we create a span
    if (parentTraceId) {
        return langfuse.span({
            traceId: parentTraceId,
            name: `${agentName}_execution`,
            metadata: { agent: agentName, userId, sessionId }
        });
    }

    return langfuse.trace({
        name: `${agentName}_execution`,
        userId,
        sessionId,
        metadata: {
            agent: agentName,
            timestamp: new Date().toISOString()
        }
    });
}

export async function withTrace<T>(traceId: string, callback: () => Promise<T>): Promise<T> {
    return traceContext.run(traceId, callback);
}

export function getCurrentTraceId(): string | undefined {
    return traceContext.getStore();
}
