# Scientific Comic Pipeline & Illustrator Workbench Plan

**Objective:** Build a robust, deterministic pipeline to transform scientific papers into interactive, "Vivacious" web comics. The system is designed to **support human scientific illustrators**, offering them a high-quality "First Draft" that they can refine, rather than attempting fully autonomous generation.

**Core Philosophy:**
1.  **Determinism:** Agents do not write arbitrary code. They select and parameterize pre-validated **Revideo Templates**.
2.  **Human-in-the-loop:** The system outputs a structured `ComicManifest` (JSON) which can be edited via a UI before rendering.
3.  **Vivacious Interaction:** The frontend uses a "Guided View" approach (Zoom/Pan) where panels come alive (Video/Interactive) upon focus.

---

## Phase 1: Architecture & Data Contract (The "Manifest") (Completed)
**Goal:** Define the strict JSON schema that acts as the bridge between AI Agents and the Frontend.

*   [x] **Define `ComicManifest` Schema:**
    *   Structure for `Pages`, `Panels`, `Bubbles`. (Implemented in `src/types/comic.ts`)
*   [ ] **Create Revideo Template Library:**
    *   Identify and parameterize standard templates (e.g., `bar-chart`, `process-flow`). (Initial list defined in Narrative Agent).

## Phase 2: Agent Implementation (The "Draftsman") (In Progress)
**Goal:** Update agents to produce the Manifest deterministically.

*   [x] **Scientist Agent Update:**
    *   Ensure extraction of structured data suitable for visual representation.
*   [x] **Narrative Agent Update:**
    *   New Tool: `save_comic_manifest`.
    *   Logic: Map scientific sections to Panel Layouts and Revideo Templates.
*   [x] **Validator Agent Update:**
    *   New Tool: `validate_comic_manifest` for overlap and schema checks.

## Phase 3: Frontend "Vivacious" Engine (Completed)
**Goal:** Build the interactive web viewer.

*   [x] **Install Dependencies:** `react-zoom-pan-pinch`, `framer-motion`.
*   [x] **Build `<ComicViewer />`:**
    *   Canvas container with Zoom/Pan logic.
*   [x] **Build `<SmartPanel />`:**
    *   Lazy Loading and Animation activation.

## Phase 4: The Illustrator's Workbench (Editor) (In Progress)
**Goal:** The UI for the human illustrator.

*   [x] **Manifest Editor:** A split-screen UI.
*   [x] **Asset Management:** Support for `imageUrl` field in panels.
*   [ ] **Manual Refresh:** Button to reload the generated manifest from disk.

---

## Technical Stack
*   **Frontend:** React, Tailwind CSS, `react-zoom-pan-pinch`.
*   **Motion:** Revideo (for panel content), Framer Motion (for UI transitions).
*   **Data:** Zod (Validation), JSON.
*   **Agents:** Google ADK (Gemini 1.5 Pro / Flash).
