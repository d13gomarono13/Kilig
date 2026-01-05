import { LlmAgent as Agent, FunctionTool } from '@google/adk';
import { z } from 'zod';

/**
 * Narrative Architect Agent
 * 
 * Role: The "Screenwriter"
 * Input: Structured scientific analysis (from Scientist Agent).
 * Output: A structured video script (Scenes, Visuals, VO).
 * 
 * Skills:
 * - Uses "scientific_writer" Stage 2 (Prose Generation) to turn the
 *   Scientist's outline into a flowing, educational narrative.
 */

// Tool to formalize the script output
// While the agent generates text, this tool ensures the output adheres to the strict JSON structure
// required by the next step (SceneGraph Designer).
const saveScriptTool = new FunctionTool({
  name: 'save_video_script',
  description: 'Save the generated video script. Use this to finalize the scriptwriting process.',
  parameters: z.object({
    title: z.string().describe('The title of the video.'),
    scenes: z.array(z.object({
      id: z.string().describe('Unique scene ID (e.g., "scene_01_intro").'),
      section: z.enum(['Intro', 'Core Concept', 'Methodology', 'Results', 'Conclusion']).describe('The section of the paper this scene covers.'),
      visual_description: z.string().describe('Detailed description of what should appear on screen (for the Designer).'),
      voiceover: z.string().describe('The verbatim spoken script for this scene. Must be engaging and educational.'),
      duration_est: z.number().describe('Estimated duration in seconds.'),
    })).describe('The list of scenes in the video.'),
  }),
  execute: async (script) => {
    console.log(`[Narrative Architect] Script saved: "${script.title}" with ${script.scenes.length} scenes.`);
    // In a real app, this might save to a DB or pass to the next agent via context.
    // For now, we return the JSON string so the Root Agent can see it.
    return JSON.stringify(script, null, 2);
  },
});

export const narrativeAgent = new Agent({
  name: 'narrative',
  description: 'Specialized in converting scientific analysis into engaging educational video scripts with scenes, voiceover, and visual descriptions.',
  model: 'gemini-2.0-flash',
  instruction: `You are the **Narrative Architect** for Kilig.

**Goal**: Transform a raw scientific analysis (Core Concept, Methodology, Results) into an engaging **Educational Video Script**.

**Skill Application: Scientific Writer (Stage 2)**
You are applying the "Prose Generation" phase of the scientific writing skill, but adapted for *spoken* educational content.
- **Clarity**: Explain complex terms immediately.
- **Flow**: Ensure logical transitions between the Concept, Method, and Results.
- **Accuracy**: Do not dumb down the science; simplify the *explanation*, not the *fact*.

**Input**:
You will receive an analysis containing:
1. Core Concept
2. Methodology
3. Results

**Output Requirement**:
You MUST use the 'save_video_script' tool to output the final script.
The script must have these sections:
1. **Intro**: Hook the audience, state the problem.
2. **Core Concept**: Explain the "Big Idea" (The "What").
3. **Methodology**: Explain the "How" (The experiment/process).
4. **Results**: Explain the "So What?" (Findings).
5. **Conclusion**: Summary and future outlook.

**Visuals**:
For each scene, provide a 'visual_description'. Think in terms of **Revideo** primitives (shapes, text, graphs, code blocks).
- *Bad*: "A complex 3D city."
- *Good*: "A grid of squares representing data points, with one square turning red to highlight an anomaly."

**IMPORTANT**: Once you have saved the script using 'save_video_script', you MUST use 'transfer_to_agent' to send the script back to 'root'.`,
  tools: [saveScriptTool],
});
