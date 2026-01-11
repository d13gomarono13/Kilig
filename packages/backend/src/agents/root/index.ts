import { LlmAgent as Agent } from '@google/adk';
import { scientistAgent } from '../scientist/index.js';
import { narrativeAgent } from '../narrative/index.js';
import { designerAgent } from '../designer/index.js';
import { validatorAgent } from '../validator/index.js';
import { llmModel } from '../config.js';

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
  description: 'The main coordinator agent for Kilig. Orchestrates both Video (SceneGraph) and Scientific Comic pipelines.',
  model: llmModel,
  instruction: `You are the **Kilig Root Agent**, the coordinator of an AI scientific media generation pipeline.

Your goal is to manage the lifecycle of transforming a scientific topic into either an educational **Video** or an interactive **Scientific Comic**.

**IMPORTANT**: You participate in a **Stateful Workflow**. When you delegate, the system tracks the state in a database.

**Pipelines**:

### 1. The Video Pipeline (Target: Revideo SceneGraph)
1.  **Research**: Transfer to 'scientist'.
2.  **Scripting**: Once research is done, transfer findings to 'narrative' for a video script.
3.  **Design**: Transfer script to 'designer' for a SceneGraph.
4.  **Validation**: Transfer SceneGraph to 'validator'.

### 2. The Comic Pipeline (Target: Scientific Comic Manifest)
1.  **Research**: Transfer to 'scientist'.
2.  **Comic Layout**: Once research is done, transfer findings to 'narrative' to generate a **Comic Manifest** using 'save_comic_manifest'.
3.  **Validation**: Transfer Comic Manifest to 'validator'.

**Decision Logic**:
- If the user asks for a "video", "animation", or "Revideo", use the **Video Pipeline**.
- If the user asks for a "comic", "storyboard", or "vivacious panel", use the **Comic Pipeline**.
- If unspecified, prefer the **Comic Pipeline** as it is our primary high-fidelity format.

Always provide clear and detailed instructions when transferring to another agent.

**CRITICAL**: When you want to transfer to another agent, you MUST use the \`transfer_to_agent\` tool. Do NOT just write it as text. Use the tool.`,
  // Register sub-agents for delegation (ADK Auto Flow)
  subAgents: [scientistAgent, narrativeAgent, designerAgent, validatorAgent],
});

// Explicitly remove the default CodeExecutionRequestProcessor which enforces "Gemini code execution"
// We remove by index (5) because minification mangles class names preventing name-based filtering.
// Default order: [Basic, Identity, Instructions, Confirmation, Content, CodeExecution, Transfer]
if (rootAgent.requestProcessors.length > 5) {
  rootAgent.requestProcessors.splice(5, 1);
}

// Remove CodeExecutionResponseProcessor if present (usually empty by default but good safety)
if (rootAgent.responseProcessors.length > 0) {
  rootAgent.responseProcessors = [];
}

// Post-initialization: Allow agents to transfer to each other
(scientistAgent as any).subAgents = [narrativeAgent, rootAgent];
(narrativeAgent as any).subAgents = [designerAgent, rootAgent];
(designerAgent as any).subAgents = [validatorAgent, rootAgent];
(validatorAgent as any).subAgents = [rootAgent];
