# Kilig Pipeline Trigger Prompt

**Context**: This prompt is sent to the **Root Agent (Orchestrator)** to initiate the end-to-end video generation process. It explicitly defines the constraints and output formats for each sub-agent to ensure the pipeline runs autonomously and produces valid data for the frontend.

---

**User Query**:
"I want to generate a deep-dive educational video about **[INSERT TOPIC OR PAPER URL HERE]**.

Please orchestrate the following pipeline strictly:

### 1. Phase 1: Research & Critical Analysis
**Delegate to**: `Scientist Agent`
**Task**:
- Search ArXiv for the most relevant and high-impact papers on this topic.
- Perform a **Critical Scientific Analysis** using the 'scientific_critical_thinking' skill. Assess the Core Concept, Methodology, Results, and crucially, the **Validity, Strengths, and Weaknesses**.
**Output Format**:
- A structured text summary or JSON object containing:
  - `Title`
  - `Core_Concept` (1-2 sentences)
  - `Methodology` (Key steps)
  - `Results` (Key findings)
  - `Critical_Evaluation` (Validity, Strengths, Weaknesses)

### 2. Phase 2: Narrative & Scripting
**Delegate to**: `Narrative Architect Agent`
**Task**:
- Take the Scientist's analysis and transform it into a **Revideo Video Script**.
- Apply 'Scientific Writer (Stage 2)' principles: Clarity, Flow, and Accuracy.
- The tone should be [Neo-Brutalism/Edgy/Educational] - high energy but rigorous.
**Output Format**:
- MUST use the `save_video_script` tool.
- Structure:
  - `title`: String
  - `scenes`: Array of objects with:
    - `id`: String (e.g., "scene_01")
    - `section`: "Intro" | "Core Concept" | "Methodology" | "Results" | "Conclusion"
    - `visual_description`: Detailed visual cues for Revideo (e.g., "A grid of Grid components...").
    - `voiceover`: Verbatim spoken text.

### 3. Phase 3: Visual Design & Engineering
**Delegate to**: `SceneGraph Designer Agent`
**Task**:
- Convert the Narrative Architect's script into a **Revideo SceneGraph**.
- Use the 'scientific_visualization' skill to ensure aesthetics match the **Neo-Brutalism** style (High contrast, bold colors).
- STRICTLY use valid Revideo components: `<Circle>`, `<Rect>`, `<Line>`, `<Layout>`, `<Latex>`, `<Text>`.
**Output Format**:
- MUST use the `generate_scenegraph` tool.
- Return the raw JSON structure that the frontend React engine can render.

**Final Action**:
Once the Designer returns the JSON, present a final summary confirming the generation is complete."
