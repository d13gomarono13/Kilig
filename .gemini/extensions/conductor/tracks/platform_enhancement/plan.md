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
| 1 | Claude Skills Integration | Weeks 1-3 | 📋 PLANNED |
| 2 | PNPM Workspaces Migration | Week 4 | 📋 PLANNED |
| 3 | Langfuse Observability | Week 4 | 📋 PLANNED |
| 4 | MCP Server Dockerization | Week 5 | 📋 PLANNED |
| 5 | Docling Figure Extraction | Week 6 | 📋 PLANNED |
| 6 | Testing Infrastructure | Weeks 7-8 | 📋 PLANNED |
| 7 | Production Deployment | Weeks 9-10 | 📋 PLANNED |

---

## Phase 1: Claude Skills Integration (Weeks 1-3)
**STATUS: ✅ COMPLETE**

> **Approach**: Skills accessed via Gemini memory injection, NOT MCP toolset.
> Skills content is injected as `<MEMORY[GEMINI.md]>` blocks in system context.
> Agents apply skill methodologies through their detailed instructions.

### 1.1 Verify Skills Setup
- [x] Confirm skills in `.gemini/claude skills/`:
  - `scientific-critical-thinking/`
  - `scientific-writing/`
  - `literature-review/`
  - `scientific-brainstorming/`
- [x] Skills use Gemini format (GEMINI.md), loaded via memory injection

### 1.2 Scientist Agent Enhancement
- [x] Update agent instructions to use skill methodologies
- [x] Add `scientific-critical-thinking` workflow for paper analysis
- [x] Add `literature-review` instructions for multi-paper synthesis
- [x] Removed unused claudeSkillsToolset (MCP not needed)

### 1.3 Narrative Agent Enhancement
- [x] Add `scientific-writing` methodology for structured narratives
- [x] Add `scientific-brainstorming` for creative angles
- [x] Removed unused claudeSkillsToolset (MCP not needed)

### 1.4 Testing
- [x] Create `scripts/test_skills_integration.ts`
- [x] Add `npm run test:skills` script
- [x] Verified skills directory and agent initialization

---

## Phase 2: PNPM Workspaces Migration (Week 4)

### 2.1 Setup
- [ ] Install pnpm globally
- [ ] Create `pnpm-workspace.yaml`

### 2.2 Restructure
- [ ] Create `packages/` directory
- [ ] Move `src/` → `packages/backend/src/`
- [ ] Move `web/` → `packages/frontend/`
- [ ] Create `packages/shared/`

### 2.3 Shared Types Package
- [ ] Create `@kilig/shared` package
- [ ] Add agent types (`AgentMessage`, `PipelineState`)
- [ ] Add Zod schemas (`SceneGraphSchema`, `ComicManifestSchema`)
- [ ] Export from `packages/shared/src/index.ts`

### 2.4 Update Dependencies
- [ ] Update root `package.json` for workspaces
- [ ] Add `@kilig/shared` to backend/frontend
- [ ] Run `pnpm install`
- [ ] Verify builds

---

## Phase 3: Langfuse Observability (Week 4)

### 3.1 Enable by Default
- [ ] Set `LANGFUSE_ENABLED=true` in `.env`
- [ ] Remove `profiles` section from docker-compose.yml
- [ ] Langfuse starts with `docker compose up`

### 3.2 Tracing Integration
- [ ] Install `langfuse` in backend
- [ ] Create `src/services/observability/langfuse.ts`
- [ ] Add `createAgentTrace()` helper
- [ ] Integrate traces in all agents

### 3.3 Documentation
- [ ] Document Langfuse UI access (localhost:3001)
- [ ] Create debugging guide

---

## Phase 4: MCP Server Dockerization (Week 5)

### 4.1 ArXiv MCP Docker
- [ ] Create `docker/arxiv-mcp/Dockerfile`
- [ ] Add volume for papers storage
- [ ] Test container

### 4.2 Docling MCP Docker
- [ ] Create `docker/docling-mcp/Dockerfile`
- [ ] Install system dependencies (libgl, glib)
- [ ] Test container

### 4.3 Docker Compose
- [ ] Add `mcp-arxiv` service
- [ ] Add `mcp-docling` service
- [ ] Configure `kilig-network`
- [ ] Add volumes

### 4.4 Agent Configuration
- [ ] Update `arxivToolset` to use Docker exec
- [ ] Update `doclingToolset` to use Docker exec
- [ ] Test MCP calls through containers

---

## Phase 5: Docling Figure Extraction (Week 6)
**VERY IMPORTANT**

### 5.1 Create Figure Analysis Tool
- [ ] Create `src/agents/scientist/tools/analyze-figures.ts`
- [ ] Implement `analyze_paper_figures` FunctionTool
- [ ] Extract charts, diagrams, tables
- [ ] Return structured data

### 5.2 Scientist Integration
- [ ] Add tool to scientistAgent
- [ ] Update instructions for figure workflow
- [ ] Add "Visual Data" output section

### 5.3 Narrative Integration
- [ ] Use figure data for scene creation
- [ ] Recreate key figures in visuals
- [ ] Reference metrics in narration

### 5.4 Testing
- [ ] Create `scripts/test_e2e_with_figures.ts`
- [ ] Test with figure-rich papers

---

## Phase 6: Testing Infrastructure (Weeks 7-8)

### 6.1 Unit Testing
- [ ] Install Vitest
- [ ] Create tests for agent tools
- [ ] Create tests for services
- [ ] Target >60% coverage

### 6.2 CI/CD Pipeline
- [ ] Create `.github/workflows/ci.yml`
- [ ] Automate test runs
- [ ] Docker image builds
- [ ] Lint and type checks

### 6.3 Documentation
- [ ] Architecture docs
- [ ] API documentation
- [ ] Deployment guide

---

## Phase 7: Production Deployment (Weeks 9-10)

### 7.1 Security
- [ ] Tighten CORS policy
- [ ] Implement rate limiting
- [ ] API authentication
- [ ] Input sanitization

### 7.2 Production Configuration
- [ ] Production Dockerfiles
- [ ] Environment management
- [ ] Health checks
- [ ] Monitoring setup

### 7.3 Deployment
- [ ] Deploy to cloud provider
- [ ] Configure CDN for frontend
- [ ] Set up managed services
- [ ] Final testing

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

- [ ] All agents using Claude Skills effectively
- [ ] >60% test coverage for critical paths
- [ ] CI/CD pipeline running on every PR
- [ ] All services containerized
- [ ] Langfuse traces visible and actionable
- [ ] <5 min average pipeline execution
- [ ] Complete documentation
- [ ] Production deployment stable
