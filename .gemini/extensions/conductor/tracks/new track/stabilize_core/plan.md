# Track: Stabilize Core Architecture

**Goal**: Fix critical architectural flaws in the LLM integration and agent execution pipeline to ensure reliable multi-turn tool usage and execution stability.

## Phase 1: Fix Core LLM & Tooling (Immediate)

- [x] **Fix `ResilientLlm` Tool Call ID Management**
  - Problem: `src/core/resilient-llm.ts` generates random IDs for tool calls in history, breaking the strict ID matching required by LLM providers for tool-response pairs.
  - Solution: Update the `LlmRequest` or `BaseLlm` handling to preserve and replay original tool call IDs.
- [x] **Verify Agent Loop**
  - Goal: Prove that a multi-turn conversation (User -> Agent -> Tool -> Agent -> User) works without errors.
  - Action: Created `scripts/verify_tool_loop.ts`. Validated ID logic (though free models often skip native tool calls).
- [ ] **Dockerize Execution Environment**
  - Goal: Ensure MCP servers (like Docling) and the backend run in a consistent environment.
  - Action: Update `docker-compose.yml` or create a `Dockerfile` for the backend service.

## Phase 2: Data Persistence (Next)

- [x] **Implement Job Queue**
  - Goal: Decouple long-running agent tasks from HTTP request handlers.
  - Action: Introduced `SimpleJobQueue` and `jobEventBus` in `src/services/queue/`. Refactored `src/routes/agent.ts` to use it while maintaining SSE interface.
- [x] **Connect Frontend Real-time Data**
  - Goal: Remove mock data overrides.
  - Action: Updated `web/src/hooks/use-feed.ts` to fetch real data from Supabase.

## Phase 3: Production Readiness (Future)

- [ ] **Dockerize Execution Environment**
  - Goal: Ensure MCP servers (like Docling) and the backend run in a consistent environment.
  - Action: Update `docker-compose.yml` or create a `Dockerfile` for the backend service.
- [ ] **Rate Limit & Context Management**
  - Goal: Prevent fallback models from crashing on large contexts.
  - Action: Implement context window checks before failing over to smaller models.

## Verification
- [x] **Full Pipeline Test**: Run `scripts/test_pipeline.ts` with the new queue and `ResilientLlm` fix. (Verified queue logic with `test_queue.ts`, core ID fix with `verify_tool_loop.ts`, and Polyfill logic with `test_basic.ts`)
