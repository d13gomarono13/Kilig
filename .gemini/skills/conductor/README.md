# Conductor: AI Product Management & Architecture

This folder contains the master documentation for **Project Kilig**, designed to provide high-fidelity context for AI agents and developers.

## 📂 Structure

- **[product.md](product.md)**: Main vision, strategy, and autonomous factory philosophy.
- **[tech-stack.md](tech-stack.md)**: Production infrastructure details (Google ADK, OpenSearch, Redis).
- **[frontend_prd.md](frontend_prd.md)**: UI/UX requirements, design system, and KiligCanvas integration.
- **[product-guidelines.md](product-guidelines.md)**: Brand voice, tone, and interaction principles.
- **[tracks.md](tracks.md)**: Current roadmap and feature implementation status.

---

## 🚀 High-Level Architecture

Kilig uses a **Multi-Agentic Factory** approach:

1.  **Research**: **Scientist Agent** uses Agentic RAG (Verify → Search → Grade → Refine).
2.  **Synthesis**: Findings are mapped to the **Kilig Analysis Format**.
3.  **Visualization**: Results are distilled into a **SceneGraph JSON**.
4.  **Rendering**: **KiligCanvas** (React + Konva) and **Revideo** render the data in real-time.

## 🛠️ Key Conventions

- **Data-Driven**: Representation is strictly decoupled from LLM generation via JSON.
- **Resilient**: Multi-model rotation via OpenRouter ensures high availability.
- **Optimized**: Redis caching and OpenSearch RRF for low latency and cost efficiency.
- **Observable**: Full tracing via Langfuse.
