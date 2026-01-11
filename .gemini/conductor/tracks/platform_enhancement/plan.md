# Kilig Platform Enhancement Track (v1.0)

**Team**: 2 people  
**Timeline**: January 10 - March 21, 2026 (10 weeks)  
**Target**: Production-ready platform with enhanced agent capabilities

## Objective

Transform Kilig from a working prototype to a production-grade platform with:
- Claude Skills integration for scientific agents
- Monorepo architecture with shared types
- Full observability via Langfuse
- Containerized infrastructure
- Advanced document processing (Docling)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  KILIG ENHANCED ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │  Root Agent  │───▶│  Scientist   │───▶│  Narrative   │      │
│   │ (Coordinator)│    │   + Skills   │    │   + Skills   │      │
│   └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              CLAUDE SKILLS INTEGRATION                │      │
│   │  scientific-critical-thinking │ literature-review    │      │
│   │  scientific-writing           │ scientific-brainstorm│      │
│   └──────────────────────────────────────────────────────┘      │
│                              │                                   │
│                              ▼                                   │
│   ┌──────────────────────────────────────────────────────┐      │
│   │              CONTAINERIZED INFRASTRUCTURE             │      │
│   │  OpenSearch │ Redis │ Langfuse │ ArXiv MCP │ Docling │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phases Overview

| Phase | Focus | Timeline | Status |
|-------|-------|----------|--------|
| 1 | Claude Skills Integration | Weeks 1-3 | ✅ COMPLETED |
| 2 | PNPM Workspaces Migration | Week 4 | ✅ COMPLETED |
| 3 | Langfuse Observability | Week 4 | ✅ COMPLETED |
| 4 | MCP Server Dockerization | Week 5 | ✅ COMPLETED |
| 5 | Docling Figure Extraction | Week 6 | ✅ COMPLETED |
| 6 | Testing Infrastructure | Weeks 7-8 | ✅ COMPLETED |
| 7 | Production Deployment | Weeks 9-10 | ✅ COMPLETED |

---

## Phase 1: Claude Skills Integration (Weeks 1-3)
**STATUS: ✅ COMPLETE**

> **Approach**: Progressive Disclosure with SKILL.md
> Skills converted from GEMINI.md (always loaded) to SKILL.md (on-demand loading).
> Token optimization: ~80KB → ~400 tokens (metadata only until activated).

### 1.1 Convert to Gemini Skills Format
- [x] Create `~/.gemini/skills/` directory
- [x] Convert scientific skills to SKILL.md format:
  - `scientific-critical-thinking/SKILL.md` (53 lines vs 564 original)
  - `scientific-writing/SKILL.md`
  - `literature-review/SKILL.md`
  - `scientific-brainstorming/SKILL.md`
- [x] Add YAML frontmatter (`name:`, `description:`) for discovery

### 1.2 Agent Updates
- [x] Scientist: skill methodology instructions added
- [x] Narrative: skill methodology instructions added
- [x] Removed unused `claudeSkillsToolset` (no MCP needed)

### 1.3 Testing
- [x] Create `scripts/test_skills_integration.ts`
- [x] Add `npm run test:skills` script

---

## Phase 2: PNPM Workspaces Migration (Week 4)

### 2.1 Setup
- [x] Install pnpm globally
- [x] Create `pnpm-workspace.yaml`

### 2.2 Restructure
- [x] Create `packages/` directory
- [x] Move `src/` → `packages/backend/src/`
- [x] Move `web/` → `packages/frontend/`
- [x] Create `packages/shared/`

### 2.3 Shared Types Package
- [x] Create `@kilig/shared` package
- [x] Add agent types (`AgentMessage`, `PipelineState`)
- [x] Add Zod schemas (`SceneGraphSchema`, `ComicManifestSchema`)
- [x] Export from `packages/shared/src/index.ts`

### 2.4 Update Dependencies
- [x] Update root `package.json` for workspaces
- [x] Add `@kilig/shared` to backend/frontend
- [x] Run `pnpm install`
- [x] Verify builds

---

## Phase 3: Langfuse Observability (Week 4)

### 3.1 Enable by Default
- [x] Set `LANGFUSE_ENABLED=true` in `.env`
- [x] Remove `profiles` section from docker-compose.yml
- [x] Langfuse starts with `docker compose up`

### 3.2 Tracing Integration
- [x] Install `langfuse` in backend
- [x] Create `src/services/observability/langfuse.ts`
- [x] Add `createAgentTrace()` helper
- [x] Integrate traces in all agents

### 3.3 Documentation
- [x] Document Langfuse UI access (localhost:3001)
- [x] Create debugging guide

---

## Phase 4: MCP Server Dockerization (Week 5)

### 4.1 ArXiv MCP Docker
- [x] Create `docker/arxiv-mcp/Dockerfile`
- [x] Add volume for papers storage
- [x] Test container

### 4.2 Docling MCP Docker
- [x] Create `docker/docling-mcp/Dockerfile`
- [x] Install system dependencies (libgl, glib)
- [x] Test container

### 4.3 Docker Compose
- [x] Add `mcp-arxiv` service
- [x] Add `mcp-docling` service
- [x] Configure `kilig-network`
- [x] Add volumes

### 4.4 Agent Configuration
- [x] Update `arxivToolset` to use Docker exec
- [x] Update `doclingToolset` to use Docker exec
- [x] Test MCP calls through containers

---

## Phase 5: Docling Figure Extraction (Week 6)
**VERY IMPORTANT**

### 5.1 Create Figure Analysis Tool
- [x] Create `src/agents/scientist/tools/analyze-figures.ts`
- [x] Implement `analyze_paper_figures` FunctionTool
- [x] Extract charts, diagrams, tables
- [x] Return structured data

### 5.2 Scientist Integration
- [x] Add tool to scientistAgent
- [x] Update instructions for figure workflow
- [x] Add "Visual Data" output section

### 5.3 Narrative Integration
- [x] Use figure data for scene creation
- [x] Recreate key figures in visuals
- [x] Reference metrics in narration

### 5.4 Testing
- [x] Create `scripts/test_e2e_with_figures.ts`
- [x] Test with figure-rich papers

---

## Phase 6: Testing Infrastructure (Weeks 7-8)

### 6.1 Unit Testing
- [x] Install Vitest
- [x] Create tests for agent tools
- [x] Create tests for services
- [x] Target >60% coverage

### 6.2 CI/CD Pipeline
- [x] Create `.github/workflows/ci.yml`
- [x] Automate test runs
- [x] Docker image builds
- [x] Lint and type checks

### 6.3 Documentation
- [x] Architecture docs
- [x] API documentation
- [x] Deployment guide

---

## Phase 7: Production Deployment (Weeks 9-10)

### 7.1 Security
- [x] Tighten CORS policy
- [x] Implement rate limiting
- [x] API authentication
- [x] Input sanitization

### 7.2 Production Configuration
- [x] Production Dockerfiles
- [x] Environment management
- [x] Health checks
- [x] Monitoring setup

### 7.3 Deployment
- [x] Deploy to cloud provider
- [x] Configure CDN for frontend
- [x] Set up managed services
- [x] Final testing

---

## Key Files

| File | Purpose |
|------|---------|
| `.gemini/claude skills/` | Local Claude Skills (Gemini format) |
| `src/agents/scientist/index.ts` | Scientist agent with skill workflows |
| `src/agents/narrative/index.ts` | Narrative agent with skill workflows |
| `docker-compose.yml` | Infrastructure containers |
| `packages/shared/` | Shared types (after migration) |

---

## Budget Estimation (Monthly Production)

| Service | Cost |
|---------|------|
| Backend compute | ~$40 |
| Frontend CDN | ~$10 |
| Supabase Pro | $25 |
| OpenSearch | ~$150 |
| Redis | ~$15 |
| Gemini API (usage) | $50-500 |
| **Total** | **$290-750** |

---

## Success Metrics

- [x] All agents using Claude Skills effectively
- [x] >60% test coverage for critical paths
- [x] CI/CD pipeline running on every PR
- [x] All services containerized
- [x] Langfuse traces visible and actionable
- [x] <5 min average pipeline execution
- [x] Complete documentation
- [x] Production deployment stable
