# Track: Final Integration

## Objective
End-to-end testing and optimization of the scientific video generation pipeline, focusing on stability and rate-limit mitigation.

## Scientific Workflow: Step-by-Step Testing Protocol

To perform a proper test of the entire pipeline and mitigate Gemini API rate limit (429) errors:

1.  **Preparation**
    -   Ensure `GOOGLE_API_KEY` is exported in the environment.
    -   Verify all agents in `src/agents/` are configured to use `gemini-2.0-flash`.
    -   Ensure `rootAgent` in `src/agents/root/index.ts` has all sub-agents (Scientist, Narrative, Designer, Validator) registered in the `subAgents` array.

2.  **Tool Optimization**
    -   Use paragraph-based chunking in `ingest_paper.ts` (delimited by `\n\n`) to minimize the number of embedding requests.
    -   Ensure the embedding service in `src/services/embeddings.ts` implements batching and concurrency control.

3.  **Agent Handoff Configuration**
    -   Instruct sub-agents (via their `instruction` string) to return structured results to the `root` agent using `transfer_to_agent`.
    -   Avoid direct sub-agent to sub-agent handoffs to maintain Root control.

4.  **Execution Protocol (Test Script)**
    -   Use a script that initializes an `InMemoryRunner`.
    -   Implement an autonomous loop that polls for the next agent event.
    -   **CRITICAL**: Insert a **65-second delay** between agent turns (where a turn is a complete `run_async` iteration) to allow the Gemini Free Tier quota to reset.

5.  **Verification**
    -   Monitor for `is_final_response()` to identify successful turn completion.
    -   Check for `synthesize_critical_analysis` output from the Scientist.
    -   Verify the Narrative agent generates a valid script based on the Scientist's analysis.

## Status
- [x] Implement SDK embedding batching.
- [x] Implement paragraph-based chunking for ingestion.
- [x] Implement Root-centric routing logic.
- [x] Verify Scientist analysis pipeline (end-to-end).
- [/] Verify Narrative + Designer pipeline integration (In Progress - Blocked by 429 Rate Limits).
- [/] Verify Validator feedback loop (In Progress - Blocked by 429 Rate Limits).

## Verification Notes
- **Gemini API Quota**: The Flash 2.0 Free Tier is extremely restrictive (15 RPM). Pipeline tests are currently hitting 'limit: 0' errors frequently.
- **Mitigation**: Using `scripts/test_pipeline.ts` with a 70s retry loop. Testing may require several hours of intermittent runs to complete a full pipeline turn.
