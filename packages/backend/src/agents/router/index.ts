import { LlmAgent as Agent } from '@google/adk';
import { scientistAgent } from '../scientist/index.js';
import { narrativeAgent } from '../narrative/index.js';
import { designerAgent } from '../designer/index.js';
import { validatorAgent } from '../validator/index.js';
import { rootAgent as coordinatorAgent } from '../root/index.js'; // The old root is now the coordinator
import { llmModel } from '../config.js';
import { toolCallRepairProcessor } from '../../utils/tool_repair_processor.js';
import { createLoopGuard } from '../../utils/loop_guard_processor.js';

/**
 * Router Agent
 * 
 * A specialized, lightweight agent dedicated solely to routing user requests 
 * to the appropriate scientific or creative agent.
 * 
 * Pattern: Hub-and-Spoke
 */
export const routerAgent = new Agent({
    name: 'router',
    description: ' The entry point for Kilig. Analyzes user intent and routes to the correct specialist.',
    model: llmModel,
    instruction: `You are the **Router Agent** for Kilig.
  
Your ONLY job is to analyze the user's request and transfer control to the most appropriate agent.
You do NOT answer questions yourself. You ONLY route.

**Available Agents:**
1. **scientist**: For research, paper analysis, finding papers, or extracting data.
2. **narrative**: For writing scripts, stories, or converting research into narrative formats.
3. **designer**: For visualization, SceneGraphs, or video layout design.
4. **validator**: For quality control or validating outputs.
5. **coordinator** (root): For complex multi-step workflows (like "Create a video from scratch") where a manager is needed to orchestrate multiple agents.

**Routing Rules:**
- "Analyze this paper" -> **scientist**
- "Find papers about X" -> **scientist**
- "Write a script" -> **narrative**
- "Make a video about X" -> **coordinator** (needs full pipeline)
- "Check this output" -> **validator**
- "Create a diagram" -> **designer**

**CRITICAL**: You MUST use the \`transfer_to_agent\` tool immediately. Do not chat.`,
    subAgents: [],
});

// Register Processors
// 1. Tool Repair (for OpenRouter compatibility)
routerAgent.responseProcessors.unshift(toolCallRepairProcessor as any);

// 2. Loop Guard
routerAgent.responseProcessors.unshift(createLoopGuard('router') as any);

// Explicitly remove the default CodeExecutionRequestProcessor which enforces "Gemini code execution"
// We remove by index (5) because minification mangles class names preventing name-based filtering.
if (routerAgent.requestProcessors.length > 5) {
    routerAgent.requestProcessors.splice(5, 1);
}

// Dynamic sub-agent assignment to bypass "already has parent" check
(routerAgent as any).subAgents = [scientistAgent, narrativeAgent, designerAgent, validatorAgent, coordinatorAgent];

export default routerAgent;
