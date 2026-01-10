import { Langfuse } from 'langfuse';

export const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_HOST,
    enabled: process.env.LANGFUSE_ENABLED === 'true'
});

export function createAgentTrace(agentName: string, userId: string, sessionId: string) {
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
