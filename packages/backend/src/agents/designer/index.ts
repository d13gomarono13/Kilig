import { LlmAgent as Agent, FunctionTool, MCPToolset } from '@google/adk';
import { SceneGraphSchema } from '@kilig/shared';
import fs from 'fs/promises';
import path from 'path';
import { llmModel } from '../config.js';

/**
 * SceneGraph Designer Agent
 * 
 * Role: The "Visualizer" / "Animator"
 * Input: Script from Narrative Architect (Scenes, Visuals, VO).
 * Output: SceneGraph JSON for Revideo.
 * 
 * Skills:
 * - Uses "scientific_visualization" to assess aesthetic components and clarity.
 * - Uses "Revideo" documentation for accurate component usage.
 */

// Claude Scientific Skills MCP Toolset Configuration (for visualization skill)
const claudeSkillsToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uvx',
    args: ['claude-skills-mcp'],
  },
});

const generateSceneGraphTool = new FunctionTool({
  name: 'generate_scenegraph',
  description: 'Generate the final Revideo SceneGraph JSON. This is the blueprint for the React renderer.',
  parameters: SceneGraphSchema,
  execute: async (scenegraph) => {
    console.log(`[Designer] Generated SceneGraph with ${scenegraph.scenes.length} scenes.`);

    // Persistence: Save to local file for frontend usage
    try {
      const outputPath = path.join(process.cwd(), 'web/src/data/scenegraph.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(scenegraph, null, 2));
      console.log(`[Designer] SceneGraph saved to: ${outputPath}`);
    } catch (error) {
      console.error('[Designer] Failed to save SceneGraph to file:', error);
    }

    return JSON.stringify(scenegraph, null, 2);
  },
});

export const designerAgent = new Agent({
  name: 'designer',
  description: 'Specialized in transforming video scripts into Revideo SceneGraph JSON blueprints. Generates the actual animation and layout data.',
  model: llmModel,
  instruction: `You are the **SceneGraph Designer Agent** ("The Visualizer").

**Goal**: Transform a text-based video script into a **Revideo SceneGraph JSON**.

**Key Skills**:
1.  **Scientific Visualization**: Use this skill to evaluate *why* a visual is chosen. Ensure illustrations are clear, accurate, and aesthetically pleasing.
2.  **Revideo Expert**: You MUST use valid Revideo components and props.
    *   **Components**: <Circle>, <Rect>, <Text>, <Layout>, <Line>, <Latex>, <Img>.
    *   **Signals**: Remember that props are signals (e.g., \`position.x(100)\`).
    *   **Layouts**: Use Flexbox layout via the \`<Layout>\` component for organizing data.
    *   **Tweening**: Define animations clearly.

**Instructions**:
1.  Receive the script from the Narrative Architect.
2.  For each scene (maximum 5), design the visuals using Revideo primitives.
3.  **Visualization Check**: Ask "Is this accurate? Is it beautiful? Does it explain the concept?" using the 'scientific_visualization' skill logic.
4.  **Generate JSON**: Output the strict JSON structure using 'generate_scenegraph'. Ensure you DO NOT exceed 5 scenes.

**Reference Patterns**:
- Use \`<Layout>\` for grouping and alignment.
- Use \`<Circle>\` and \`<Rect>\` for data points and containers.
- Use \`<Line>\` or \`<Spline>\` for connections.
- Use \`<Latex>\` for formulas.
- Animations: Prefer 'easeInOutCubic' for natural movement.

**IMPORTANT**: Once you have generated the SceneGraph using 'generate_scenegraph', you MUST use 'transfer_to_agent' to send the JSON to the **QC & Validator Agent** ('validator').

**Constraint**: Return ONLY the JSON data structure via the tool. Do not write raw TSX code blocks; we are generating the *data* that drives the renderer.`,
  tools: [claudeSkillsToolset, generateSceneGraphTool],
});
