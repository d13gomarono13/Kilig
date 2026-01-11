# 🎬 Kilig: Autonomous Scientific Media Generation

**Kilig** is an advanced **Agentic AI Platform** that transforms complex scientific papers into professional, educational animated videos. By orchestrating a specialized pipeline of autonomous agents, Kilig automates the entire media production lifecycle: from deep-dive research and critical analysis to narrative scripting, storyboarding, and final programmatic video rendering.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![Google ADK](https://img.shields.io/badge/Google%20ADK-Agentic-4285F4.svg)
![OpenSearch](https://img.shields.io/badge/OpenSearch-Vector%20Store-005EB8.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)

</div>

---

## 🧠 System Architecture

Kilig operates on a robust **Multi-Agent Orchestration Layer** implemented with the **Google Agent Development Kit (ADK)**. It leverages a microservices-style architecture for scalability, observability, and specialized processing.

### The Agentic Team
Kilig is not a single model, but a collaborative team of specialized autonomous agents:

1.  **👑 Root Agent (Orchestrator)**
    *   **Role**: Project Manager & Workflow Coordinator.
    *   **Function**: Manages the task queue, delegates work to specialist agents, and maintains global state in Supabase.
    *   **Key Capability**: Stateful execution with crash recovery.

2.  **🔬 Scientist Agent (Researcher)**
    *   **Role**: Academic Expert & Critical Analyst.
    *   **Function**: Scours ArXiv/PubMed, ingests papers via Docling, and performs standard-deviating critical analysis.
    *   **Key Capability**: **Self-RAG Pipeline** (see below) for hallucination-free research.

3.  **✍️ Narrative Agent (Scriptwriter)**
    *   **Role**: Science Communicator & Storyteller.
    *   **Function**: Transforms dense technical findings into engaging scripts (Video, Comic, Thread).
    *   **Key Capability**: Utilizes **Persistent Memory** (Mem0) to learn user preferences and avoid past mistakes.

4.  **🎨 Designer Agent (Visualizer)**
    *   **Role**: Art Director & Scene Architect.
    *   **Function**: Converts narrative scripts into `SceneGraph` JSON definitions for the rendering engine.
    *   **Key Capability**: Generates asset manifests and component-level layouts.

5.  **✅ Validator Agent (QC)**
    *   **Role**: Quality Control Specialist.
    *   **Function**: Validates outputs against schema schemas, style guides, and safety guardrails.
    *   **Key Capability**: Rejects low-quality work with specific feedback loops.

---

## ⚡️ The Self-RAG Pipeline

The **Scientist Agent** utilizes a cutting-edge **Self-Reflective Retrieval-Augmented Generation (Self-RAG)** pipeline to ensure maximum accuracy:

1.  **🚦 Retrieval Decision**: Dynamic LLM evaluation to decide if external retrieval is necessary (e.g., skips search for "2+2").
2.  **🛡 Query Guardrail**: Scope validation to reject non-scientific queries before wasting compute.
3.  **🔍 Hybrid Search**: Semantic (Vector) + Keyword (BM25) search via OpenSearch.
4.  **📉 Relevance Filtering**: Automated grading of retrieved docs to remove noise.
5.  **📝 Response Generation**: Drafting the answer based on filtered context.
6.  **⚖️ Support Assessment**: Verifying every claim is grounded in the retrieved documents (Faithfulness check).
7.  **⭐ Utility Rating**: Final quality score before delivery.

> **Feedback Loop**: User feedback (👍/👎) is collected and used to fine-tune relevance scores for future queries (+10%/-10% weighting).

---

## 🛠 Tech Stack

### Backend & AI Core
*   **Runtime**: Node.js (v20+) with TypeScript
*   **Framework**: Fastify (API) + Google ADK (Agents)
*   **LLM**: Gemini 2.0 (Flash/Pro)
*   **Vector Store**: OpenSearch (KNN/HNSW indices)
*   **Database**: Supabase (PostgreSQL) for state & feedback
*   **Caching**: Redis
*   **Memory**: Mem0 (Custom Implementation)

### Frontend (Kilig Canvas)
*   **Framework**: React 18 + Vite
*   **Canvas Engine**: Konva.js (High-performance 2D)
*   **UI Library**: Shadcn/UI + Tailwind CSS 4
*   **State**: Zustand

### Infrastructure & Ops
*   **Orchestration**: Apache Airflow (Workflow DAGs)
*   **Containerization**: Docker & Docker Compose
*   **Monitoring**: Prometheus (Metrics) + Grafana (Dashboards) + Langfuse (Traces)
*   **Tools**: MCP Servers (ArXiv, Docling)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v20+
*   Docker & Docker Compose
*   PNPM (`npm install -g pnpm`)
*   Supabase Account (or local setup)

### 1. Environment Setup
Create a `.env` file in the root (see `.env.example`):
```env
# AI Models
GEMINI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here (optional backup)

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Infrastructure
OPENSEARCH_HOST=http://localhost:9200
REDIS_HOST=localhost
```

### 2. Infrastructure Launch
Start the supporting services (OpenSearch, Redis, Airflow, Observability):
```bash
docker-compose up -d
```

### 3. Database Migration
Run the SQL migrations in Supabase (found in `packages/backend/supabase/migrations/`) to create:
*   `workflow_states` (Agent State)
*   `feedback` (RAG Improvement)

### 4. Install & Run
```bash
# Install dependencies
pnpm install

# Start Backend (Port 3000)
pnpm dev:backend

# Start Frontend (Port 5173)
pnpm dev:frontend
```

---

## 🧪 Evaluation & Testing

Kilig includes a rigorous **Agent Evaluation Framework** to ensure reliability.

### Agent Evaluation (LLM-as-a-Judge)
Run the automated test harness against 11+ scenarios (Core + Red Team):
```bash
cd packages/backend
pnpm exec tsx scripts/evaluate_agents.ts
```
*   **Checks**: Tool usage, Content correctness, Safety guardrails.
*   **Output**: JSON report with pass/fail rates.

### RAG Quality Metrics
Measure the accuracy of the Scientist agent:
```bash
cd packages/backend
pnpm exec tsx scripts/evaluate_rag.ts
```
*   **Metrics**: Correctness (Answers matching ground truth), Faithfulness (Hallucination check), Contextual Relevancy.

### Feedback Table Verification
Verify the user feedback loop integration:
```bash
cd packages/backend
pnpm exec tsx scripts/test_feedback_table.ts
```

---

## 📁 Repository Structure

```text
/
├── packages/
│   ├── backend/                 # Agentic Orchestrator & API
│   │   ├── src/agents/          # Agent Definitions
│   │   ├── src/services/        # Core Services (Memory, Search, etc.)
│   │   └── data/                # Evaluation Datasets
│   └── frontend/                # React Studio App
├── docker-compose.yml           # Infrastructure Stack
├── airflow/                     # Workflow Orchestration DAGs
├── monitoring/                  # Prometheus/Grafana Configs
└── .gemini/skills/              # Scientific Skill Definitions
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
