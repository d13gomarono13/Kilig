import { SimpleJobQueue, Job } from './simple-queue.js';
import { Runner, InMemorySessionService, isFinalResponse, getFunctionCalls } from '@google/adk';
import { rootAgent } from '../../agents/root/index.js';
import { dbService } from '../db.js';
import { jobEventBus } from './event-bus.js';

// Define the job data structure
export interface AgentJobData {
  query: string;
  userId: string;
  sessionId: string;
  projectId: string;
}

// The processor function that runs the agent
const agentProcessor = async (job: Job<AgentJobData>) => {
  const { query, userId, sessionId, projectId } = job.data;
  
  console.log(`[Queue] Processing job ${job.id} for project ${projectId}`);

  const sessionService = new InMemorySessionService();
  const runner = new Runner({
    agent: rootAgent,
    sessionService,
    appName: 'kilig-api'
  });

  await sessionService.createSession({
    appName: 'kilig-api',
    userId,
    sessionId
  });

  const content = {
    role: 'user',
    parts: [{ text: query }],
  };

  try {
      for await (const event of runner.runAsync({
        userId,
        sessionId,
        newMessage: content,
      })) {
        // Emit raw ADK event for this job
        jobEventBus.emit(`job:${job.id}`, event);
      }
  } catch (e) {
      console.error('Agent run failed', e);
      throw e;
  }
};

// Singleton Queue
export const agentQueue = new SimpleJobQueue(agentProcessor);
