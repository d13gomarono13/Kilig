# Zero-Cost AI Testing Framework (v2.0)

## Objective
Establish a systematic, zero-cost testing framework for the Kilig multi-agent pipeline that enables weekly STEM paper processing without API costs or rate limit disruptions.

## Problem Statement
- **API Costs**: LLM API calls are expensive for iterative testing
- **Rate Limits**: Free tiers have strict limits (15-20 RPM, 50 RPD per model)
- **Testing Frequency**: Need to test across 5+ research areas weekly
- **Reproducibility**: Variable LLM outputs make regression testing difficult

## Architecture Overview

Kilig testing is designed around the **Google ADK** multi-agent pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                     KILIG TESTING ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │   ADK Root   │───▶│  Scientist   │───▶│  Narrative   │      │
│   │    Agent     │    │    Agent     │    │    Agent     │      │
│   └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              RESILIENT LLM CONNECTOR                  │      │
│   │  (OpenRouter Multi-Model Rotation with Auto-Failover) │      │
│   └──────────────────────────────────────────────────────┘      │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                   COST REDUCTION LAYERS               │      │
│   │  Layer 1: Redis/File Cache  │  Layer 2: Model Rotation│      │
│   │  Layer 3: Golden Dataset    │  Layer 4: Mock Provider │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layered Defense Strategy

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Caching (Existing)                             │
│  → Redis + FileSystem eliminate repeated API calls       │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Multi-Model Rotation (Implemented)             │
│  → 5x daily request capacity via OpenRouter free models  │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Golden Dataset + Index Snapshot (Planned)      │
│  → Deterministic offline regression testing              │
│  → Includes OpenSearch index snapshots for RAG testing   │
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

- [x] FileSystemCache provider (`src/services/cache/file-system-cache.ts`)
- [x] RedisCacheClient provider (`src/services/cache/redis-client.ts`)
- [x] SHA-256 key generation (`src/services/cache/key-generator.ts`)
- [x] GeminiClient integration
- [x] Embeddings caching
- [x] `.env` configuration via Zod (`src/config/index.ts`)

### Phase 2: Multi-Model Rotation ✅ COMPLETED

- [x] Create `src/core/resilient-llm.ts` with automatic failover
- [x] Update `src/agents/config.ts` with free model stack
- [x] Implement 429 rate limit detection and rotation
- [x] Log model switching for debugging

**Free Model Stack (OpenRouter):**
1. `google/gemma-3-27b-it:free` (Primary - Fast, 128k context)
2. `deepseek/deepseek-r1:free` (Best reasoning, comparable to o1)
3. `meta-llama/llama-3.3-70b-instruct:free` (Large, reliable fallback)
4. `qwen/qwen-2.5-coder-32b-instruct:free` (JSON/code specialist)
5. `meta-llama/llama-4-maverick:free` (Newest, experimental)

**Effective Capacity**: 250+ requests/day across all models.

### Phase 3: Golden Dataset + OpenSearch Snapshot 📋 PLANNED

**Goal**: Pre-record LLM responses AND OpenSearch index state for specific papers to enable deterministic, zero-API, zero-search regression testing.

#### 3.1 Golden LLM Responses
- [ ] Create `scripts/generate_golden_dataset.ts`
  - Run pipeline with live models
  - Save all LLM responses with prompt hashes
  - Store in `tests/golden/llm/` directory

- [ ] Create `src/testing/golden-llm.ts`
  - Replay recorded responses based on prompt hash
  - Fail fast if no golden match found
  - Option to fall back to live API

#### 3.2 Golden OpenSearch Snapshots (NEW)
- [ ] Create `scripts/snapshot_opensearch_index.ts`
  - Export current OpenSearch index state to JSON
  - Store in `tests/golden/opensearch/` directory
  - Enables testing the Agentic RAG without live OpenSearch

- [ ] Create `src/testing/mock-opensearch.ts`
  - Intercepts `OpenSearchClient` calls
  - Returns pre-recorded search results
  - Supports hybrid search simulation

#### 3.3 Initial Golden Datasets
- [ ] Physics paper (e.g., gravitational waves)
- [ ] Biology paper (e.g., CRISPR)
- [ ] Computer Science paper (e.g., Attention Is All You Need)

### Phase 4: Mock LLM Provider 📋 PLANNED

**Goal**: Enable fully offline CI/CD testing with synthetic responses.

- [ ] Create `src/testing/mock-llm.ts`
  - Returns fixed responses for common patterns
  - Tool call simulation (for ADK tools)
  - Configurable latency

- [ ] Create `tests/fixtures/mock-responses.json`
  - Standard responses for each agent type (Root, Scientist, Narrative, etc.)
  - Edge cases and error scenarios

### Phase 5: GitHub Actions Automation 📋 PLANNED

**Goal**: Automated weekly testing across research areas.

- [ ] Create `.github/workflows/weekly-stem-test.yml`
  ```yaml
  name: Weekly STEM Pipeline Test
  on:
    schedule:
      - cron: '0 6 * * 1'  # Every Monday at 6 AM UTC
    workflow_dispatch:  # Manual trigger
  
  jobs:
    test:
      runs-on: ubuntu-latest
      strategy:
        matrix:
          paper:
            - https://arxiv.org/abs/1706.03762  # Transformers
            - https://arxiv.org/abs/2012.08630  # Vision Transformers
            - https://arxiv.org/abs/1602.04938  # AlphaGo
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
        - run: npm ci
        - run: npm run test:pipeline
          env:
            PAPER_URL: ${{ matrix.paper }}
            OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
            TESTING_MODE: resilient
        - uses: actions/upload-artifact@v4
          with:
            name: test-results-${{ matrix.paper }}
            path: tests/artifacts/
  ```

- [ ] Environment setup:
  - [ ] `OPENROUTER_API_KEY` GitHub secret
  - [ ] `CACHE_ENABLED=true`
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
  - Categorizes runs by STEM domain (AI, NLP, Neuroscience, etc.)
  - Displays status badges, quality scores, and links to source papers.
  - **Visual Verification**: Added 'View Comic' button linking to `/viewer`.

- [x] **Granular Evaluation**: Updated `scripts/sync_results_to_supabase.ts`
  - Stores detailed Promptfoo assertions in `pipeline_steps` table.
  - Enables "why did it fail?" drill-down in the UI.

### Phase 7: Agent Output Standardization ✅ COMPLETED

**Goal**: Ensure reproducible, high-quality visual outputs for every test run.

- [x] **Narrative Agent Strict Mode**: Updated `src/agents/narrative/index.ts`
  - **5-Panel Rule**: Enforced exact 5-panel structure.
  - **Mandatory Visuals**: Required usage of at least 2 'revideo' templates.
  - **Accessibility**: Optimized JSON output for consistent rendering.

### Phase 8: ADK DevTools Integration 📋 PLANNED (NEW)

**Goal**: Leverage `@google/adk-devtools` for native agent inspection and testing.

- [ ] Enable ADK DevTools server for local debugging
  ```bash
  npm run dev -- --devtools
  ```
- [ ] Create `scripts/adk_trace_analyzer.ts`
  - Parse ADK trace files
  - Generate regression test cases from production traces
  - Export to Golden Dataset format

- [ ] Integrate with Promptfoo for automated evaluation
  - Map ADK traces to Promptfoo assertions
  - Auto-generate `promptfooconfig.yaml` from trace data

---

## Configuration

### Required `.env` Variables
```bash
# Caching
CACHE_ENABLED=true
CACHE_PROVIDER=file           # Options: file | redis
CACHE_TTL=86400
CACHE_DIR=.cache

# Redis (if CACHE_PROVIDER=redis)
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# OpenRouter (for free multi-model)
OPENROUTER_API_KEY=sk-or-v1-your-key

# OpenSearch (for hybrid RAG)
OPENSEARCH_HOST=http://localhost:9200
OPENSEARCH_INDEX_NAME=kilig_papers_v1

# Testing Mode
TESTING_MODE=resilient        # Options: resilient | golden | mock

# Backend
VITE_API_URL=http://localhost:8080
```

### Testing Modes
| Mode | Use Case | API Calls | OpenSearch |
|------|----------|-----------|------------|
| `resilient` | Live testing with failover | Yes (free tier) | Live |
| `golden` | Regression testing | No (cached) | Snapshot |
| `mock` | CI/CD, unit tests | No | Mock |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/agents/config.ts` | ADK LLM configuration with ResilientLlm |
| `src/core/resilient-llm.ts` | OpenRouter multi-model connector |
| `src/services/cache/` | Redis + FileSystem caching |
| `src/services/opensearch/` | Hybrid search client |
| `src/routes/analytics.ts` | Analytics API endpoint |
| `web/src/pages/Laboratory.tsx` | Analytics dashboard UI |
| `scripts/test_pipeline.ts` | E2E test runner |

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

## Testing Checklists

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

### CI/CD Test Protocol (Mock)
1. [ ] Set `TESTING_MODE=mock`
2. [ ] Run `npm run test:pipeline`
3. [ ] Verify all agents complete without errors
4. [ ] Check fixture coverage

---

## Success Metrics

- [ ] Zero API cost for regression testing
- [ ] < 5 rate limit errors per weekly test run
- [ ] 5+ research areas tested per week
- [ ] < 30 min total weekly test runtime
- [ ] Automated notifications on failures
- [ ] 100% agent coverage in golden dataset
