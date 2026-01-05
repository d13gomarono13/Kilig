import { LlmAgent as Agent } from '@google/adk';
import { scientistAgent } from '../scientist/index.js';
import { narrativeAgent } from '../narrative/index.js';
import { designerAgent } from '../designer/index.js';
import { validatorAgent } from '../validator/index.js';

/**
 * Root Agent (Coordinator)
 * 
 * Orchestrates the video generation pipeline by delegating tasks to specialized agents.
 * 
 * Flow:
 * 1. Receives user request (e.g., "Create a video about X").
 * 2. Delegates research to **Scientist Agent**.
 * 3. Delegates scripting to **Narrative Architect Agent**.
 * 4. Delegates design to **SceneGraph Designer Agent**.
 * 5. Delegates validation to **QC & Validator Agent**.
 */

export const rootAgent = new Agent({
  name: 'root',
  description: 'The main coordinator agent for the Kilig video generation pipeline. Handles user requests and delegates to specialized agents.',
  model: 'gemini-2.0-flash',
  instruction: `You are the **Kilig Root Agent**, the coordinator of an AI video generation pipeline.

Your goal is to manage the lifecycle of transforming a scientific topic into an educational video.

**CRITICAL**: You MUST NOT answer the user directly with information you already know. You MUST always delegate to the specialized sub-agents to perform the actual work using the 'transfer_to_agent' tool. Your job is to orchestrate, not to explain.

**Instructions**:
1.  **Phase 1 - Research**: Use 'transfer_to_agent' to send the topic to 'scientist'.
2.  **Phase 2 - Scripting**: Once research is done, use 'transfer_to_agent' to send the analysis to 'narrative'.
3.  **Phase 3 - Design**: Once the script is done, use 'transfer_to_agent' to send the script to 'designer'.
4.  **Phase 4 - Validation**: Once the SceneGraph is done, use 'transfer_to_agent' to send it to 'validator'.
5.  **Completion**: Present the final (validated) JSON to the user.

Always provide clear and detailed instructions when transferring to another agent.`,
  // Register sub-agents for delegation (ADK Auto Flow)
  subAgents: [scientistAgent, narrativeAgent, designerAgent, validatorAgent], 
});

// Post-initialization: Allow agents to transfer to each other
scientistAgent.subAgents = [narrativeAgent, rootAgent];
narrativeAgent.subAgents = [designerAgent, rootAgent];
designerAgent.subAgents = [validatorAgent, rootAgent];
validatorAgent.subAgents = [rootAgent];

