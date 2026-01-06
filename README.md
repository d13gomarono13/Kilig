# 🎬 Kilig

**Kilig** is an advanced AI-driven platform that transforms scientific papers into professional animated videos. By orchestrating a specialized pipeline of AI agents, Kilig automates the entire process: from paper ingestion and deep scientific analysis to narrative scripting and final video rendering using **Revideo (Motion Canvas)**.

---

## 🏗 System Architecture

Kilig operates on a multi-agent orchestration layer powered by **Google ADK** (Agent Development Kit). Each agent follows the **SPARC** (Specification, Pseudocode, Architecture, Refinement, Completion) methodology.

### The Agent Pipeline
1.  **Root Agent (Coordinator):** Orchestrates the task queue and manages state across the pipeline.
2.  **Ingestor:** Fetches and parses scientific papers (e.g., from ArXiv or local PDFs).
3.  **Scientific Analyzer:** Extracts core methodologies, data points, and key findings.
4.  **Narrative Architect:** Translates dense scientific data into engaging, educational scripts.
5.  **SceneGraph Designer:** Generates the Motion Canvas/Revideo JSON definitions for the visual timeline.
6.  **QC & Validator:** Ensures schema compliance and design system integrity before rendering.

---

## 🚀 Tech Stack

### Backend & AI
- **Runtime:** Node.js with TypeScript (using `tsx`)
- **Framework:** Fastify
- **Orchestration:** Google ADK
- **AI Models:** Gemini 2.0 (Flash/Pro)
- **Database:** Supabase (PostgreSQL) + Vector Store for RAG

### Frontend
- **Framework:** React 18 + Vite
- **Video Engine:** Revideo (Motion Canvas) for 2D programmatic animation
- **Styling:** Tailwind CSS 4 + Shadcn UI
- **Animations:** Framer Motion + Lucide Icons

---

## 📁 Project Structure

```text
├── src/                # Backend Source
│   ├── agents/         # Agent definitions (Root, Scientist, etc.)
│   ├── core/           # Orchestrator, Gemini client, & Memory Management
│   ├── routes/         # Fastify API endpoints
│   ├── services/       # Database & Embedding services
│   └── utils/          # Supabase & Logger helpers
├── web/                # Frontend Application (React + Vite)
│   ├── src/pages/      # Studio, Workbench, Gallery, Dashboard
│   ├── src/components/ # Shadcn & Custom UI components
│   └── src/lib/        # Revideo rendering & API integration
├── supabase/           # Database migrations & configuration
├── scripts/            # Testing protocols & pipeline triggers
└── prompts/            # System instructions for AI agents
```

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v20+)
- PNPM or NPM
- Supabase CLI (for local DB management)

### Environment Setup
Create a `.env` file in the root and `web/` directory:

```env
# Backend
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Frontend
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Installation
```bash
# Install root dependencies
pnpm install

# Install frontend dependencies
cd web && pnpm install
```

### Running the Platform
**1. Start the Backend Orchestrator:**
```bash
pnpm dev
```

**2. Start the Frontend Studio:**
```bash
cd web
pnpm dev
```

---

## 🧪 Development & Testing

Kilig includes specialized scripts to test the pipeline without running the full UI:

- **Full Pipeline Test:** `npx tsx scripts/test_pipeline.ts`
- **Comic Pipeline Test:** `npx tsx scripts/test_comic_pipeline.ts`
- **Clear Agent Cache:** `pnpm cache:clear`

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.