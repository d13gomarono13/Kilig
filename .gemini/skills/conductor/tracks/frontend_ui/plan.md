# Frontend UI Track (Neo-Brutalism Migration)

## Objective
Establish the `web` directory as a modern, neo-brutalist frontend using React 18 + Vite.
This ensures a high-energy, distinct visual identity for the Kilig platform.

## Architecture
- **Framework**: React 18 + Vite (SPA).
- **Styling**: Tailwind CSS v3 (Neo-Brutalism).
- **Routing**: React Router v6.
- **Backend Interaction**: HTTP Fetch + SSE to `http://localhost:8080` (Fastify).
- **State Management**: TanStack Query + React Context.

## Tasks
- [x] **Setup & Structure**
    - [x] Initialize Vite project with React & TypeScript.
    - [x] Configure Tailwind CSS v3.
    - [x] Setup Project Directory Structure (`src/components`, `src/pages`, `src/hooks`).
- [x] **Design System Implementation**
    - [x] Integrate `Space Grotesk`, `Lora`, and `Space Mono` fonts.
    - [x] Implement global CSS variables for Neo-Brutalist theme (`--background`, `--neo-shadow`, etc.).
    - [x] Create/Port UI components (Buttons, Cards, Inputs) with Neo-Brutalist styling.
- [x] **Core Features**
    - [x] **Landing Page**: Implement high-impact "Kilig" landing page with "Start Creating" CTA.
    - [x] **Dashboard**: Project grid and "New Project" trigger.
    - [x] **Studio**: Three-pane layout for Agent Workspace, Canvas (Revideo), and Inspector.
- [x] **Integration**
    - [x] Install `@revideo/player-react`.
    - [x] Setup `react-router-dom` for navigation (`/`, `/dashboard`, `/studio/:id`).
    - [x] Integrate `TanStack Query` for data fetching.
- [x] **Verification**
    - [x] Ensure `npm run dev` in `web` works.
    - [x] Verify visual alignment with Neo-Brutalist design goals.
