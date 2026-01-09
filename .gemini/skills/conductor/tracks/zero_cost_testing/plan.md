# Zero-Cost AI Testing Framework

## Objective
Establish a systematic, zero-cost testing framework for the Kilig multi-agent pipeline that enables weekly STEM paper processing without API costs or rate limit disruptions.

## Problem Statement
- **API Costs**: Gemini/GPT API calls are expensive for iterative testing
- **Rate Limits**: Free tiers have strict limits (15-20 RPM, 50 RPD)
- **Testing Frequency**: Need to test across 5+ research areas weekly
- **Reproducibility**: Variable LLM outputs make regression testing difficult

## Strategy
A **layered defense** approach combining multiple cost-saving techniques:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Caching (Existing)                             │
│  → Eliminate repeated API calls                          │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Multi-Model Rotation (Implemented)             │
│  → 5x daily request capacity via free model rotation     │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Golden Dataset (Planned)                       │
│  → Deterministic offline regression testing              │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Mock Provider (Planned)                        │
│  → CI/CD testing without any API calls                   │
├─────────────────────────────────────────────────────────┤
│  Layer 5: GitHub Actions Automation (Planned)            │
│  → Weekly automated STEM testing                         │
└─────────────────────────────────────────────────────────┘
```

---

## Phases

### Phase 1: Caching Layer ✅ COMPLETED
*See: `tracks/caching_system/plan.md`*

- [x] FileSystemCache provider
- [x] SHA-256 key generation
- [x] GeminiClient integration
- [x] Embeddings caching
- [x] `.env` configuration

### Phase 2: Multi-Model Rotation ✅ COMPLETED

- [x] Create `src/core/resilient-llm.ts` with automatic failover
- [x] Update `src/agents/config.ts` with free model stack
- [x] Implement 429 rate limit detection and rotation
- [x] Log model switching for debugging

**Free Model Stack:**
1. `google/gemma-3-27b-it:free` (Primary)
2. `deepseek/deepseek-r1:free` (Best reasoning)
3. `meta-llama/llama-3.3-70b-instruct:free` (Large fallback)
4. `qwen/qwen-2.5-coder-32b-instruct:free` (JSON specialist)
5. `meta-llama/llama-4-maverick:free` (Newest)

### Phase 3: Golden Dataset Framework 📋 PLANNED

**Goal**: Pre-record LLM responses for specific papers to enable deterministic, zero-API regression testing.

- [ ] Create `scripts/generate_golden_dataset.ts`
  - Run pipeline with live models
  - Save all LLM responses with prompt hashes
  - Store in `tests/golden/` directory

- [ ] Create `src/core/golden-llm.ts`
  - Replay recorded responses based on prompt hash
  - Fail fast if no golden match found
  - Option to fall back to live API

- [ ] Create initial golden datasets:
  - [ ] Physics paper (e.g., gravitational waves)
  - [ ] Biology paper (e.g., CRISPR)
  - [ ] Computer Science paper (e.g., Transformers)

### Phase 4: Mock LLM Provider 📋 PLANNED

**Goal**: Enable fully offline CI/CD testing with synthetic responses.

- [ ] Create `src/core/mock-llm.ts`
  - Returns fixed responses for common patterns
  - Tool call simulation
  - Configurable latency

- [ ] Create `tests/fixtures/mock-responses.json`
  - Standard responses for each agent type
  - Edge cases and error scenarios

### Phase 5: GitHub Actions Automation 📋 PLANNED

**Goal**: Automated weekly testing across research areas.

- [ ] Create `.github/workflows/weekly-stem-test.yml`
  ```yaml
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6 AM
  ```
  
- [ ] Environment setup:
  - [ ] OPENROUTER_API_KEY secret
  - [ ] CACHE_ENABLED=true
  - [ ] Paper URL matrix for 5 research areas

- [ ] Artifact reporting:
  - [ ] Upload test results to GitHub artifacts
  - [ ] Slack/Discord notification on failure

### Phase 6: Frontend Analytics Integration ✅ COMPLETED

**Goal**: Visualize test results and agent performance directly in the Laboratory dashboard.

- [x] **Backend API**: Created `src/routes/analytics.ts`
  - Endpoint: `GET /api/analytics/runs`
  - Fetches latest execution data from `pipeline_runs` Supabase table.
  - Returns structured data including status, quality scores, and durations.

- [x] **Frontend Dashboard**: Updated `web/src/pages/Laboratory.tsx`
  - Implemented "Recent Experiments" section.
  - Categorizes runs by STEM domain (AI, NLP, Neuroscience, etc.).
  - Displays status badges, quality scores, and links to source papers.
  - **Visual Verification**: Added 'View Comic' button linking to `/viewer` for immediate visual inspection.

- [x] **Granular Evaluation**: Updated `scripts/sync_results_to_supabase.ts`
  - Stores detailed Promptfoo assertions in `pipeline_steps` table.
  - Enables "why did it fail?" drill-down in the UI.

### Phase 7: Agent Output Standardization ✅ COMPLETED

**Goal**: Ensure reproducible, high-quality visual outputs for every test run.

- [x] **Narrative Agent Strict Mode**: Updated `src/agents/narrative/index.ts`
  - **5-Panel Rule**: Enforced exact 5-panel structure (Intro -> Methodology -> Results -> Deep Dive -> Conclusion).
  - **Mandatory Visuals**: Required usage of at least 2 'revideo' templates (Process Flow, Bar Chart) per comic.
  - **Accessibility**: Optimized JSON output for consistent rendering in the Viewer.

---

## Configuration

### Required `.env` Variables
```bash
# Caching
CACHE_ENABLED=true
CACHE_PROVIDER=file
CACHE_TTL=86400
CACHE_DIR=.cache

# OpenRouter (for free multi-model)
OPENROUTER_API_KEY=sk-or-v1-your-key

# Testing Mode
TESTING_MODE=resilient  # Options: resilient | golden | mock

# Backend
VITE_API_URL=http://localhost:8080 # For frontend to fetch analytics
```

### Testing Modes
| Mode | Use Case | API Calls |
|------|----------|-----------|
| `resilient` | Live testing with failover | Yes (free tier) |
| `golden` | Regression testing | No (cached) |
| `mock` | CI/CD, unit tests | No |

---

## Capacity Estimates

| Layer Active | Papers/Day | Papers/Week | Cost |
|--------------|------------|-------------|------|
| None | 3-5 | 21-35 | Gemini quota |
| Caching only | 5-10 | 35-70 | Free |
| + Multi-model | 15-25 | 100-175 | **$0** |
| + Golden dataset | ∞ (cached) | ∞ | $0 |
| + Mock provider | ∞ | ∞ | $0 |

---

## Testing Checklist

### Weekly STEM Test Protocol
1. [ ] Select paper from each research area
2. [ ] Ensure `OPENROUTER_API_KEY` is set
3. [ ] Run `npm run test:e2e` with `PAPER_URL` env var
4. [ ] Verify artifacts in `tests/results/`
5. [ ] **Verify results in Laboratory Dashboard** (http://localhost:5173/laboratory)
6. [ ] Archive results

### Regression Test Protocol (Golden)
1. [ ] Set `TESTING_MODE=golden`
2. [ ] Run `npm run test:pipeline`
3. [ ] Compare output against expected golden output
4. [ ] Report any deviations

---

## Key Files

| File | Purpose |
|------|---------|
| `src/core/resilient-llm.ts` | Multi-model rotation |
| `src/routes/analytics.ts` | Analytics API Endpoint |
| `web/src/pages/Laboratory.tsx` | Analytics Dashboard UI |
| `src/services/cache/` | Caching system |
| `scripts/test_pipeline.ts` | E2E test runner |

---

## Success Metrics

- [ ] Zero API cost for regression testing
- [ ] < 5 rate limit errors per weekly test run  
- [ ] 5+ research areas tested per week
- [ ] < 30 min total weekly test runtime
- [ ] Automated notifications on failures
