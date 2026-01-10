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

**IMPORTANT**: You will be provided with a **REFERENCE DOCUMENT** (the full text of the paper) at the very beginning of the conversation history. This document enables efficient caching. You and all specialized sub-agents MUST treat this document as the primary source of truth for all analysis.

**CRITICAL**: You MUST NOT answer the user directly with information you already know. You MUST always delegate to the specialized sub-agents.

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
  // Explicitly disable default ADK processors to prevent implicit "Gemini code execution tool" requirement
  requestProcessors: [],
  responseProcessors: [],
});

// Post-initialization: Allow agents to transfer to each other
(scientistAgent as any).subAgents = [narrativeAgent, rootAgent];
(narrativeAgent as any).subAgents = [designerAgent, rootAgent];
(designerAgent as any).subAgents = [validatorAgent, rootAgent];
(validatorAgent as any).subAgents = [rootAgent];
