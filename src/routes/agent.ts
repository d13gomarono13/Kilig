import { FastifyInstance } from 'fastify';
import { Runner, InMemorySessionService, isFinalResponse, getFunctionCalls } from '@google/adk';
import { rootAgent } from '../agents/root/index.js';
import { dbService } from '../services/db.js';

export async function agentRoutes(server: FastifyInstance) {
  server.post('/api/trigger', async (request, reply) => {
    const { query } = request.body as { query: string };
    
    if (!query) {
      return reply.code(400).send({ error: 'Query is required' });
    }

    // 1. Create DB Project
    const project = await dbService.createProject(query);
    const projectId = project?.id;

    // Initialize ADK components
    const sessionService = new InMemorySessionService();
    const userId = 'api-user-' + Date.now();
    const sessionId = 'session-' + Date.now();
    
    const runner = new Runner({
      agent: rootAgent,
      sessionService,
      appName: 'kilig-api'
    });

    // Create session explicitly
    await sessionService.createSession({
      appName: 'kilig-api',
      userId,
      sessionId
    });

    // We'll use Server-Sent Events (SSE) for real-time updates
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    
    // Send initial project ID
    reply.raw.write(`data: ${JSON.stringify({ type: 'project_created', projectId })}\n\n`);

    const content = {
      role: 'user',
      parts: [{ text: query }],
    };

    try {
      let currentScript = null;
      let currentAnalysis = null;
      let currentSceneGraph = null;

      for await (const event of runner.runAsync({
        userId,
        sessionId,
        newMessage: content,
      })) {
        const toolCalls = getFunctionCalls(event);
        const isFinal = isFinalResponse(event);

        if (event.errorCode) {
          console.error(`[AGENT ERROR] ${event.errorCode}: ${event.errorMessage}`);
          reply.raw.write(`data: ${JSON.stringify({ type: 'error', code: event.errorCode, message: event.errorMessage })}\n\n`);
          continue;
        }

        // Stream interesting events to the client
        if (isFinal || (toolCalls && toolCalls.length > 0)) {
          const text = event.content?.parts?.find(p => p.text)?.text;
          const payload = JSON.stringify({
            type: 'agent_event',
            author: event.author,
            text: text,
            toolCalls: toolCalls,
            timestamp: new Date().toISOString()
          });
          reply.raw.write(`data: ${payload}\n\n`);

          // Capture artifacts based on author
          if (isFinal && projectId) {
             const responseText = event.content?.parts?.[0]?.text;
             if (event.author === 'scientist') {
                currentAnalysis = responseText;
                await dbService.updateProjectArtifact(projectId, { 
                  status: 'scripting', 
                  research_summary: responseText 
                });
                reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'analysis', content: responseText })}\n\n`);
             } else if (event.author === 'narrative_architect') {
                currentScript = responseText;
                await dbService.updateProjectArtifact(projectId, { 
                  status: 'designing', 
                  script: responseText 
                });
                reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'script', content: responseText })}\n\n`);
             } else if (event.author === 'designer') {
                currentSceneGraph = responseText;
                await dbService.updateProjectArtifact(projectId, { 
                  status: 'completed', 
                  scenegraph: responseText 
                });
                reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'scenegraph', content: responseText })}\n\n`);
             }
          }
        }
      }
      
      reply.raw.write(`data: ${JSON.stringify({ type: 'done', status: 'DONE' })}\n\n`);
    } catch (error) {
      console.error('Agent Execution Error:', error);
      if (projectId) await dbService.updateProjectArtifact(projectId, { status: 'failed' });
      reply.raw.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });
}