# Kilig: The "Paper-First" Scientific Creative Platform

> **AI-powered social media for scientific disseminators.** 
> Where research papers come to life as interactive comic strips.

## 🌟 Vision

Kilig is a **professional workbench for scientific disseminators**—a platform where the user and AI agents collaborate to transform dense academic papers into accessible, visually stunning narratives.

Our core philosophy is **"Paper-First"**:
- Every content piece is anchored to a specific scientific paper.
- The "source of truth" is always one click away.
- We don't aim for fully automated "black magic". We empower the creator with intelligent tools at every step of the illustration process.

## 🧩 The "Comic" Metaphor

Current scientific communication is either too dense (the paper) or too shallow (a 15-second TikTok). Kilig finds the bridge in the **Comic Strip**.

We map the structure of a scientific paper to a **5-Panel Comic Layout**:
1.  **Panel 1 (Abstract/Hook)**: The core question or problem statement.
2.  **Panel 2 (Methodology)**: The "Design" or setup of the experiment.
3.  **Panel 3 (Data/Results)**: Interactive visualization of key findings.
4.  **Panel 4 (Discussion)**: Interpretation and nuances.
5.  **Panel 5 (Conclusion)**: The takeaway and link to the source.

Each panel is an interactive canvas where agents help "script", "layout", and "refine" the scientific accuracy.

---

## 🧠 Agentic Architecture

Kilig uses a sophisticated multi-agent system powered by the **Google Agent Development Kit (ADK)**.

### 🤖 The Agent Team
| Agent | Role | Capabilities |
|-------|------|--------------|
| **Root Agent** | **The Conductor** | Stateful orchestration, task delegation, session management, crash recovery. |
| **Scientist** | **The Researcher** | **Self-RAG Pipeline**: 6-step retrieval process (Decision → Guardrail → Search → Filter → Grade → Support Check). Uses pure deep research skills. |
| **Narrative** | **The Scripter** | semantic layout generation, "Comic Manifest" creation, pacing control, memory-aware adaptation. |
| **Validator** | **The Reviewer** | Scientific accuracy checks, "red-teaming" for hallucinations, ensuring the paper-first promise is kept. |

### 🧠 Cognitive Engine
- **Persistent Memory (Mem0)**: Agents "remember" your preferences ("I prefer concise explanations", "Use this color palette") across sessions using OpenSearch vector storage.
- **Self-Reflective RAG**: The system critiques its own retrieval quality using DeepEval metrics (Correctness, Faithfulness, Contextual Relevancy).
- **Feedback Loop**: A built-in reinforcement learning loop where user interaction (thumbs up/down) fine-tunes the search relevance in real-time.

---

## 🛠️ Technology Stack

### Backend (`packages/backend`)
- **Runtime**: Node.js / TypeScript
- **Framework**: Fastify
- **AI Core**: Google ADK, LangChain, Vercel AI SDK
- **Database**: Supabase (PostgreSQL)
- **Vector Store**: OpenSearch
- **Caching**: Redis
- **Orchestration**: Apache Airflow

### Frontend (`packages/frontend`)
- **Framework**: React + Vite
- **Canvas Engine**: **Konva.js** (The heart of the "Smart Panel")
- **Styling**: TailwindCSS + Custom "RetroUI" System
- **Layout**: "Comic" Component System (`ComicEditor`, `SmartPanel`)

### DevOps & Quality
- **Monitoring**: Grafana + Prometheus
- **Evaluation**: DeepEval (LLM-as-a-Judge)
- **Containerization**: Docker Compose

---

## 📂 Repository Structure

```
Kilig/
├── packages/
│   ├── backend/        # The Agentic Brain
│   │   ├── src/agents/       # Role-based Agent Definitions
│   │   ├── src/services/     # Memory, RAG, Indexing, Feedback
│   │   └── data/             # Evaluation Datasets (Gold Standards)
│   ├── frontend/       # The Creative Interface
│   │   ├── src/components/comic/  # The Comic Engine
│   │   ├── src/pages/Studio.tsx   # The User-in-the-Loop Workbench
│   │   └── src/pages/Gallery.tsx  # The Social Feed
│   └── shared/         # Shared Types (ComicManifest, etc.)
├── airflow/            # Data Pipelines (Ingestion, Cleanup)
├── monitoring/         # Observability Stack
└── supabase/           # Database Migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm

### Environment Setup
1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Populate keys for `GEMINI_API_KEY`, `SUPABASE_URL`, `OPENSEARCH_HOST`.

### Running the Platform
```bash
# Start Infrastructure (DB, Search, Redis, Airflow)
docker-compose up -d

# Install Dependencies
pnpm install

# Start Backend (Agents)
cd packages/backend && pnpm dev

# Start Frontend (Studio)
cd packages/frontend && pnpm dev
```

### Running Evaluations
Validate the "Scientist" agent's IQ:
```bash
cd packages/backend
# Run Agent Functionality Tests
pnpm exec tsx scripts/evaluate_agents.ts
# Run RAG Quality Metrics
pnpm exec tsx scripts/evaluate_rag.ts
```

---

## 🤝 "User-in-the-Loop"

We believe AI should propose, not impose. 
1. **Selection**: The user selects the paper.
2. **Review**: The Scientist presents findings; the user approves the "Angle".
3. **Refinement**: The Narrative agent drafts the comic; the user tweaks the layout in the **Studio**.
4. **Publication**: The user publishes to the **Gallery**, building their portfolio as a scientific communicator.

---

**License**: MIT
**Status**: Active Development (Pre-Alpha)
