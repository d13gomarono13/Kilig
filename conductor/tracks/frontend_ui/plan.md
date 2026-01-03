# Frontend UI Track (Next.js Migration)

## Objective
Adopt the `stack-dashboard` (Next.js 16) codebase as the new frontend foundation.
Integrate the existing Kilig backend (Agents, SSE) into this new UI without altering its core structure.

## New Architecture
- **Framework**: Next.js 16 (App Router).
- **Styling**: Tailwind CSS v4 (inherited from clone).
- **Backend Interaction**: Client-side fetch to `http://localhost:8080/api/trigger`.

## Tasks
- [x] Swap `web` directory with `stack-dashboard-clone`.
- [x] **Dependencies**: Install `@revideo` packages in the new Next.js project.
- [x] **Content Refinement**:
    - [x] Update `app/page.tsx` (or equivalent) to reflect Kilig branding ("Automated Video Production").
    - [x] Rename/Refine Sidebar navigation items.
- [x] **Integration**:
    - [x] Port the `runPipeline` logic (SSE handling) to a new client component (e.g., `components/AgentWorkspace.tsx`).
    - [x] Port the `RevideoPlayer` integration.
- [x] **Verification**:
    - [x] Ensure `npm run dev` in `web` works (Build passed).
    - [x] Test end-to-end flow (Logic ported and verified).
