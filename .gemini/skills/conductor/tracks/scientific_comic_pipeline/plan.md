# Scientific Comic Pipeline & Illustrator Workbench Plan

**Objective:** Build a robust, deterministic pipeline to transform scientific papers into interactive, "Vivacious" web comics. The system is designed to **support human scientific illustrators**, offering them a high-quality "First Draft" that they can refine, rather than attempting fully autonomous generation.

**Core Philosophy:**
1.  **Determinism:** Agents do not write arbitrary code. They select and parameterize pre-validated **Revideo Templates**.
2.  **Human-in-the-loop:** The system outputs a structured `ComicManifest` (JSON) which can be edited via a UI before rendering.
3.  **Vivacious Interaction:** The frontend uses a "Guided View" approach (Zoom/Pan) where panels come alive (Video/Interactive) upon focus.

---

## Phase 1: Architecture & Data Contract (The "Manifest")
**Goal:** Define the strict JSON schema that acts as the bridge between AI Agents and the Frontend.

*   [ ] **Define `ComicManifest` Schema:**
    *   Structure for `Pages`, `Panels`, `Bubbles`.
    *   **Smart Panel Types:**
        *   `Static`: Image/Text only.
        *   `Revideo`: References a Template ID + Parameters (Data).
        *   `Code`: Syntax highlighted block.
*   [ ] **Create Revideo Template Library:**
    *   Create a set of standard, parameterized Revideo components (e.g., `BarChart`, `ProcessFlow`, `NetworkGraph`, `TalkingHead`).
    *   Agents will *configure* these (e.g., passing data points), not write them.

## Phase 2: Agent Implementation (The "Draftsman")
**Goal:** Update agents to produce the Manifest deterministically.

*   [ ] **Scientist Agent Update:**
    *   Ensure extraction of structured data (Research Question, Methods, Results) suitable for visual representation.
*   [ ] **Narrative Agent Update:**
    *   New Tool: `generate_comic_manifest`.
    *   Logic: Map scientific sections to Panel Layouts and Revideo Templates.
    *   *Constraint:* Must use only available Templates from the registry.

## Phase 3: Frontend "Vivacious" Engine
**Goal:** Build the interactive web viewer.

*   [ ] **Install Dependencies:** `react-zoom-pan-pinch`, `framer-motion`.
*   [ ] **Build `<ComicViewer />`:**
    *   Canvas container with Zoom/Pan logic.
    *   "Guided View" navigation (Next/Prev Panel).
*   [ ] **Build `<SmartPanel />`:**
    *   **Lazy Loading:** Shows a lightweight Preview/Thumbnail by default.
    *   **Activation:** On Zoom > 1.5x, swaps to the live `<RevideoPlayer />`.

## Phase 4: The Illustrator's Workbench (Editor)
**Goal:** The UI for the human illustrator.

*   [ ] **Manifest Editor:** A split-screen UI.
    *   **Left:** JSON Editor / Form Fields (Edit text, change templates, tweak data).
    *   **Right:** Live Preview of the Comic.
*   [ ] **Asset Management:** Allow uploading custom images to replace AI suggestions.

---

## Technical Stack
*   **Frontend:** React, Tailwind CSS, `react-zoom-pan-pinch`.
*   **Motion:** Revideo (for panel content), Framer Motion (for UI transitions).
*   **Data:** Zod (Validation), JSON.
*   **Agents:** Google ADK (Gemini 1.5 Pro / Flash).
