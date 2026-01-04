# Product Requirement Document (PRD): Kilig Frontend v1.0

## 1. Product Overview
**Kilig** is an AI-powered platform designed to transform scientific papers into engaging, animated explanatory videos. By leveraging autonomous agents and a "Data-Driven Pure TypeScript" approach, Kilig automates the research, scripting, and animation phases, allowing researchers to visualize complex ideas instantly.

## 2. Target Audience
*   **Academic Researchers:** Need to visualize findings for conferences and journals.
*   **Science Communicators:** Need rapid video production for social media.
*   **Students:** Need visual aids to understand dense academic material.

## 3. Design System & Aesthetics
**Style:** Neo-Brutalism (STACK Open Source Theme)
*   **Philosophy:** Raw, bold, and high-energy. Rejects the soft, rounded "SaaS" look in favor of distinctiveness.
*   **Typography:**
    *   **Headers:** `Space Grotesk` (Sans-serif)
    *   **Data/Code:** `Space Mono` (Monospace)
*   **Color Palette (Neo):**
    *   `neo-black`: `#181818` (Primary Borders/Text)
    *   `neo-white`: `#FFFFFF`
    *   `neo-bg`: `#F7F9FC` (Canvas Background)
    *   **Accents:**
        *   `neo-yellow`: `#FFE66D`
        *   `neo-red`: `#FF6B6B`
        *   `neo-blue`: `#4ECDC4`
        *   `neo-green`: `#95E1D3`
        *   `neo-purple`: `#A06CD5`
        *   `neo-pink`: `#FF9FF3`
*   **Visual Elements:**
    *   **Borders:** Thick, black borders (2px-4px) on all interactive elements.
    *   **Shadows:** Hard, non-blurred drop shadows:
        *   `neo`: `4px 4px 0px 0px #181818`
        *   `neo-sm`: `2px 2px 0px 0px #181818`
        *   `neo-lg`: `8px 8px 0px 0px #181818`
    *   **Background Pattern:** Radial gradient dots (`#181818`) sized 24px.
    *   **Scrollbars:** Custom brutalist scrollbars (Red thumb, Black border).

## 4. Key Pages & Functional Requirements

### 4.1 Landing Page (`/`)
*   **Goal:** Convert visitors into users by showcasing the platform's power.
*   **Components:**
    *   **Hero Section:** High-impact "Kilig" header with a sub-headline emphasizing speed and automation ("Raw. Bold. Fast.").
    *   **Call to Action (CTA):** Prominent "Start Creating" button leading to the Dashboard.
    *   **Feature Cards:** "Agents" (Autonomous workflow) and "Revideo" (Programmatic animation) highlights.
    *   **Auth Entry:** Simple login/signup card.

### 4.2 Dashboard (`/dashboard`)
*   **Goal:** Manage existing projects and initiate new ones.
*   **Components:**
    *   **Header:** User greeting and "New Project" trigger.
    *   **Project Grid:** A neo-brutalist grid of project cards.
        *   **Card Details:** Title, creation date, status badge (Processing, Done, Failed).
        *   **Actions:** "Edit Studio" button to enter the workspace.
    *   **New Project Modal:** A dialog to input the paper topic or URL.
        *   **Action:** "Launch Pipeline" triggers the agent workflow and navigates to the Studio.

### 4.3 The Studio (`/studio/:id`)
*   **Goal:** The central workspace for the "Idea to Video" workflow.
*   **Layout:** Three-pane split view.
*   **Left Panel: Agent Workspace**
    *   **Agent Logs:** A real-time chat interface displaying streamed events (SSE) from the backend.
    *   **Status Indicators:** Visual cues for which agent is active (Scientist, Narrative Architect, Designer).
    *   **Artifact Tabs:**
        *   **Analysis:** View the raw scientific research summary.
        *   **Script:** View the generated video script.
    *   **Error Handling:** Distinct red styling for system/agent errors.
*   **Center Panel: The Canvas**
    *   **Revideo Player:** A React component rendering the video in real-time based on the SceneGraph JSON.
    *   **Playback Controls:** Play, Pause, Seek.
    *   **Visualization Hints:** Cards displaying the rationale behind specific visual choices.
*   **Right Panel: Inspector & Config**
    *   **SceneGraph Editor:** A read-only (or editable) view of the generated JSON structure.
    *   **Global Controls:** Inputs to tweak global styles (Accent Color, Font) that instantly update the video.

## 5. Technical Architecture
*   **Framework:** React 18 + Vite.
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS v3.
*   **UI Library:** shadcn/ui + Neo-Brutalism components.
*   **Animation Engine:** @revideo/player-react.
*   **State Management:** React `useState` + React Query + SSE.

## 6. Integration Points
*   **Trigger Endpoint:** `POST /api/trigger`
    *   **Payload:** `{ query: string }`
    *   **Response:** SSE Stream (`project_created`, `agent_event`, `artifact_updated`, `error`, `done`).
*   **Database (Supabase):**
    *   **Table:** `video_projects`
    *   **Fields:** `status`, `research_summary`, `script`, `scenegraph`.
*   **Real-time Updates:**
    *   **SSE Client:** Listens for `artifact_updated` events to auto-refresh the Script and Analysis views without reloading.
