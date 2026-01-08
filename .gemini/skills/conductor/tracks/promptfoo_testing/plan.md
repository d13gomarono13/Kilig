# Track: Promptfoo Testing - Workshop Workflow Optimization

This track defines the protocol for verifying the optimized Kilig pipeline, specifically focused on **Groq Prompt Caching** and **Full-Text Paper Analysis**.

## Objectives
- **Verify 80% Token Reduction**: Ensure `cached_tokens` are correctly utilized after the first turn.
- **Validate Static Prefix Integrity**: Confirm the full paper content is correctly injected into all agent system instructions.
- **Ensure Semantic Continuity**: Verify that agents can retrieve specific details from the cached paper without data loss.

## Testing Protocol

### Step 1: Initialization & Prefix Population
Run the pipeline with a target paper URL.
```bash
PAPER_URL=https://arxiv.org/abs/1706.03762 npm run test:pipeline
```
**Expected Outcome**:
- `test_pipeline.ts` fetches full paper.
- LOG: `[Caching] Injected static prefix into 5 agents.`
- LOG (GroqLlm): `Usage RAW` shows high `prompt_tokens` (uncached).

### Step 2: Handoff Caching Verification
Monitor Turn 2 (usually a handoff to `narrative` or `scientist`).
**Expected Outcome**:
- LOG (GroqLlm): `Usage RAW` must contain `"cached_tokens"` within `prompt_tokens_details`.
- **Success Metric**: `cached_tokens` should equal or closely match the Turn 1 `prompt_tokens`.

### Step 3: Semantic Content Check
Inspect the `turn-*-*-text.json` artifacts in `tests/artifacts/`.
**Expected Outcome**:
- Agent responses should contain specific, non-hallucinated details from the paper's Methodology or Results sections.

## Promptfoo Integration
Use `promptfooconfig.yaml` to automate assertions on resulting artifacts.

### Key Assertions
- **LLM-based Rubric**: "The response accurately cites findings from the supplied REFERENCE DOCUMENT."
- **JSON Structure**: (For Designer Agent) "Ensure SceneGraph contains no more than 5 scenes."
- **Performance**: "Prompt tokens in Turn 2+ are < 20% of Turn 1 tokens."

## Troubleshooting
- **Cache Miss**: Check the `[GroqLlm] Sending Payload` logs to ensure the system instruction prefix is EXACTLY identical between agents.
- **Rate Limits**: If hitting 429s, ensure the 65s delay between turns is active in the test script.
