# Project Kilig: Product Strategy & Vision

## 1. Vision Statement
**Kilig** is an autonomous AI factory for scientific communication. Our mission is to bridge the gap between complex academic research and accessible visual storytelling. By transforming dense scientific papers into high-fidelity animated videos, we empower researchers to broadcast their work with clarity, speed, and aesthetic excellence.

---

## 2. Core Philosophy: "Data-Driven Scientific Rigor"
Kilig separates **Research** from **Representation** through a structured JSON intermediary (the SceneGraph).
- **No Hallucinations**: Every visual frame is grounded in a "Graded Document" retrieved from the OpenSearch hybrid knowledge base.
- **Scientific Critical Thinking**: We don't just summarize; we perform agentic analysis of methodology, validity, and strengths/weaknesses.
- **Visual-First Logic**: Our agents are trained to identify "Visualizable Data" (Flowcharts, Benchmarks, Scopes) over generic text-to-video narration.

---

## 3. Product Architecture (The Pipeline)
Kilig operates as a multi-stage autonomous pipeline powered by **Google ADK**:

1.  **Ingestion & Memory**: ArXiv integration + Hybrid Indexing (OpenSearch).
2.  **Scientific Analysis (Scientist Agent)**: Agentic RAG protocol (Scope → Search → Grade → Rewrite).
3.  **Narrative Architecture (Scripting Agent)**: Distilling analysis into engaging, academic voiceovers.
4.  **SceneGraph Design (Designer Agent)**: Translating scripts into structured JSON for rendering.
5.  **QC & Validation (Validator Agent)**: Final verification of scientific accuracy and visual logic.

---

## 4. Visual Identity: "Digital Museum"
Our aesthetic is **Neo-Brutalist** with a refined, "Digital Museum" touch.
- **Vibrant & Bold**: High-contrast color palettes and thick borders.
- **Precision Typography**: Space Grotesk and Space Mono for a technical, authoritative feel.
- **Motion with Purpose**: Narrative-driven transitions managed programmatically via Revideo and KiligCanvas.

---

## 5. Implementation Roadmap Highlights (Current)
- [x] **Migration to Google ADK**: Fully autonomous multi-agent orchestration.
- [x] **Hybrid Search Infrastructure**: OpenSearch + RRF for production-grade retrieval.
- [x] **Agentic RAG Guardrails**: Automated scope and relevance grading.
- [x] **KiligCanvas Engine**: Data-driven preview system (Konva-enabled).
- [ ] **Interactive Feed**: Platform transformation into a social-media discovery engine.
- [ ] **E2E Automation**: Weekly automated testing of the full paper-to-video pipeline.

---

## 6. Future-Proofing for AI Agents
This repository is optimized for **Agentic Development**:
- **Strictly Typed**: TypeScript end-to-end for clear contract definition.
- **Modular Services**: Decoupled Search, Cache, and Indexing layers.
- **Structured Artifacts**: Every agent stage produces a JSON artifact stored in Supabase for auditability.