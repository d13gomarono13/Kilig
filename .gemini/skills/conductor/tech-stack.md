# Technology Stack: Project Kilig (v2.0)

## Core Runtime & Language
- **Language**: TypeScript 5.4+ (Strict type safety, ESM)
- **Runtime**: Node.js 20+ (Targeting high-performance backend execution)

---

## Backend (Agent & Orchestration)
- **AI Framework**: **Google Agent Development Kit (ADK)**
  - Orchestrates a multi-agent pipeline: Root → Scientist → Narrative → Designer → Validator.
- **Agentic RAG**: Advanced research pipeline with:
  - LLM Guardrails (Scope validation)
  - LLM Document Grading (Relevance sorting)
  - LLM Query Rewriting (Contextual expansion)
- **LLM Provider**: **OpenRouter** (Multi-model rotation with automatic failover)
  - **Free Model Stack:**
    1. `google/gemma-3-27b-it:free` (Primary)
    2. `deepseek/deepseek-r1:free` (Best reasoning)
    3. `meta-llama/llama-3.3-70b-instruct:free` (Large fallback)
    4. `qwen/qwen-2.5-coder-32b-instruct:free` (JSON specialist)
    5. `meta-llama/llama-4-maverick:free` (Newest)
- **Server Framework**: **Fastify** (Ultra-fast, typed API routes)
- **Data Integrity**: **Zod** (Comprehensive schema validation for search, indexing, and configs)

---

## Search & Indexing (The Knowledge Base)
- **Search Engine**: **OpenSearch 2.11+**
  - **Hybrid Search**: Unified BM25 (keyword) + k-NN (vector) search.
  - **RRF Pipeline**: Native Reciprocal Rank Fusion for optimized result ranking.
- **Embeddings**: **Gemini text-embedding-004** (768-dimensional vectors)
- **Text Processing**: Section-aware hybrid chunking (600 words, 100 word overlap)
- **MCP Integration**:
  - **ArXiv MCP**: Automated paper discovery and PDF-to-text ingestion.
  - **Claude Skills MCP**: Specialized scientific critical thinking and evaluation logic.

---

## Caching & Observability
- **Primary Cache**: **Redis** (TTL-based exact match caching for RAG queries)
- **Fallback Cache**: File-system based caching for local development.
- **Observability**: **Langfuse** (Tracing of agent turns, tool calls, and LLM usage)
- **Process Management**: **Docker Compose** (Containerized OpenSearch, Redis, and Langfuse)

---

## Frontend (Visualization & Canvas)
- **Framework**: **React 18+** (Vite-powered)
- **Styling**: **Tailwind CSS v3** (Custom Neo-Brutalist design system)
- **UI Components**: **shadcn/ui** (Accessible, copy-paste components)
- **Canvas Engine**: **KiligCanvas** (React + Konva)
  - Real-time data-driven visualization of SceneGraph JSON.
- **Animation**: **Revideo** (Programmatic animation rendering)

---

## Infrastructure & Database
- **Metadata Store**: **Supabase** (PostgreSQL)
  - Manages video projects, artifact history, and long-term user data.
- **Storage**: ArXiv localized storage for downloaded PDF/text content.
