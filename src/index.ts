import 'dotenv/config';
import { Orchestrator } from './core/orchestrator.js';
import { Task } from './types/index.js';

async function main() {
  const orchestrator = new Orchestrator({
    apiKey: process.env.GEMINI_API_KEY,
    maxAgents: 5
  });

  try {
    await orchestrator.start();
    console.log('Orchestrator started successfully.');

    // Example: Create a root task to generate a video
    const rootTask: Task = {
      id: 'task-root-1',
      description: 'Create an educational video about "Transformers in NLP"',
      mode: 'coordinator', // Root agent mode
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await orchestrator.addTask(rootTask);
    console.log('Root task added.');
    
    // Note: The orchestrator runs asynchronously. In a real app, you might keep the process alive
    // or wait for specific events. Here we'll just keep it running for a bit.
    
    // To properly exit in this simple script:
    // await new Promise(resolve => setTimeout(resolve, 60000));
    // await orchestrator.stop();

  } catch (error) {
    console.error('Failed to start orchestrator:', error);
    process.exit(1);
  }
}

// Only run if called directly
// if (import.meta.url === `file://${process.argv[1]}`) {
  main();
// }
