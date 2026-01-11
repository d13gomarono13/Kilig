import { FastifyInstance } from 'fastify';
import { isFinalResponse, getFunctionCalls } from '@google/adk';
import { dbService } from '../services/db.js';
import { agentQueue } from '../services/queue/index.js';
import { jobEventBus } from '../services/queue/event-bus.js';
import { TriggerBodySchema, validateBody } from './schemas.js';
import { getLogger } from '../utils/logger.js';

const log = getLogger('AgentAPI');

export async function agentRoutes(server: FastifyInstance) {
  server.post('/api/trigger', async (request, reply) => {
    // Validate input
    const { query } = validateBody(TriggerBodySchema, request.body);

    // 1. Create DB Project
    const project = await dbService.createProject(query);
    const projectId = project?.id;

    const userId = 'api-user-' + Date.now();
    const sessionId = 'session-' + Date.now();

    // 2. Add to Queue
    const job = await agentQueue.add('agent-run', {
      query,
      userId,
      sessionId,
      projectId
    });

    log.info('Job created', { jobId: job.id, projectId });

    // We'll use Server-Sent Events (SSE) for real-time updates
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    // Send initial project ID
    reply.raw.write(`data: ${JSON.stringify({ type: 'project_created', projectId, jobId: job.id })}\n\n`);

    // 3. Subscribe to Event Bus
    const listener = async (event: any) => {
      const toolCalls = getFunctionCalls(event);
      const isFinal = isFinalResponse(event);

      if (event.errorCode) {
        log.error('Agent error', { code: event.errorCode, message: event.errorMessage });
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', code: event.errorCode, message: event.errorMessage })}\n\n`);
        return;
      }

      // Stream interesting events to the client
      if (isFinal || (toolCalls && toolCalls.length > 0)) {
        const text = event.content?.parts?.find((p: any) => p.text)?.text;
        const payload = JSON.stringify({
          type: 'agent_event',
          author: event.author,
          text: text,
          toolCalls: toolCalls,
          timestamp: new Date().toISOString()
        });
        reply.raw.write(`data: ${payload}\n\n`);

        // Capture artifacts based on author
        // We save on EITHER:
        // 1. isFinal (The agent is actually done)
        // 2. transfer_to_agent (The agent is handing off work, implying its part is done)
        // 2. transfer_to_agent (The agent is handing off work, implying its part is done)
        const isHandoff = toolCalls?.some((tc: any) => (tc.name === 'transfer_to_agent' || tc.function?.name === 'transfer_to_agent'));

        if ((isFinal || isHandoff) && projectId) {
          const responseText = event.content?.parts?.[0]?.text || "";

          // Only save if we actually have content to save
          if (responseText.length > 10) {
            if (event.author === 'scientist') {
              await dbService.updateProjectArtifact(projectId, {
                status: 'scripting',
                research_summary: responseText
              });
              reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'analysis', content: responseText })}\n\n`);
            } else if (event.author === 'narrative') {
              await dbService.updateProjectArtifact(projectId, {
                status: 'designing',
                script: responseText
              });
              reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'script', content: responseText })}\n\n`);
            } else if (event.author === 'designer') {
              // Designer might output JSON in the text block OR as a tool argument. 
              // Usually it's in the text block for 'generate_scenegraph' tool but let's capture text for now.
              await dbService.updateProjectArtifact(projectId, {
                status: 'completed',
                scenegraph: responseText
              });
              reply.raw.write(`data: ${JSON.stringify({ type: 'artifact_updated', artifactType: 'scenegraph', content: responseText })}\n\n`);
            }
          }
        }
      }
    };

    const completionListener = (completedJob: any) => {
      if (completedJob.id === job.id) {
        reply.raw.write(`data: ${JSON.stringify({ type: 'done', status: 'DONE' })}\n\n`);
        cleanup();
        reply.raw.end();
      }
    };

    const failureListener = (failedJob: any) => {
      if (failedJob.id === job.id) {
        if (projectId) dbService.updateProjectArtifact(projectId, { status: 'failed' });
        reply.raw.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
        cleanup();
        reply.raw.end();
      }
    };

    const cleanup = () => {
      jobEventBus.off(`job:${job.id}`, listener);
      agentQueue.off('jobCompleted', completionListener);
      agentQueue.off('jobFailed', failureListener);
    };

    jobEventBus.on(`job:${job.id}`, listener);
    agentQueue.on('jobCompleted', completionListener);
    agentQueue.on('jobFailed', failureListener);

    // Handle client disconnect
    request.raw.on('close', () => {
      log.debug('Client disconnected', { jobId: job.id });
      cleanup();
    });
  });
}