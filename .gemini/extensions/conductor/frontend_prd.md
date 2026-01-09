# Product Requirement Document (PRD): Kilig Frontend v2.0

## 1. Product Overview
**Kilig** is a production-grade AI platform that transforms scientific papers into high-impact animated videos. It uses a **Multi-Agentic Framework (Google ADK)** to automate the entire scientific communication lifecycle: from deep research and critical analysis to narrative scripting and visual design.

---

## 2. Design System: "Digital Museum" Neo-Brutalism
Kilig rejects standard SaaS aesthetics in favor of a sophisticated, high-energy "Digital Museum" style.
- **Aesthetic**: Bold lines, hard shadows, vibrant accents, and high-quality typography.
- **Typography**:
  - **Headers**: `Space Grotesk` (Technical yet expressive)
  - **Body/JSON**: `Space Mono` (Precision and clarity)
- **Design Tokens**:
  - **Borders**: 2px-4px "Steel" Black on all cards and containers.
  - **Shadows**: Sharp, offset drop shadows (no blur) for a tiered depth effect.
  - **Motion**: Micro-animations for agent transitions and layout shifts.

---

## 3. Core Functional Modules

### 3.1 The Agentic Workspace (Left Panel)
Real-time visibility into the **Google ADK Pipeline**.
- **Live Stream**: SSE-powered log showing agent turns (Root, Scientist, Narrative, Designer).
- **Protocol Visualization**:
  - **Guardrail Monitor**: Displays the scope validation score.
  - **Search Status**: Shows hybrid search progress (OpenSearch hits + RRF scores).
  - **Document Grader**: Visual feedback on why specific chunks were accepted or rejected.
  - **Query Refiner**: Tracks retrieval attempts (Max 3) and query evolution.

### 3.2 KiligCanvas & Studio (Center & Right)
The "Source of Truth" for the scientific representation.
- **KiligCanvas (React + Konva)**: A dynamic, interactive preview of the SceneGraph JSON.
- **Visualizable Data Focus**:
  - **Process Flows**: Automapped to interactive flowcharts.
  - **Comparative Data**: Logic for bar/line chart rendering from agent results.
  - **Key Quotes**: Stylized speech bubbles for significant research statements.
- **Inspector**: Real-time SceneGraph editing and global style overrides.

---

## 4. Technical Architecture

### 4.1 Integration Layer
- **ADK Runner**: Interfaces with the backend ADK `InMemoryRunner`.
- **Session Persistence**: Sessions preserved via Supabase and local storage.
- **Event Bus**: Global event system to sync Agent findings with Canvas updates.

### 4.2 State Management
- **TanStack Query**: For metadata and project fetching.
- **Context API**: For managing the active SceneGraph state.
- **Server-Sent Events (SSE)**: For progressive, multi-turn agent feedback.

---

## 5. Key User Flows

1. **Initiate Research**: User provides a topic or URL.
2. **Autonomous Research**: Scientist Agent performs agentic RAG (Verify Scope → Hybrid Search → Grade → Refine).
3. **Synthesis**: Agent synthesizes findings into the **Kilig Analysis Format**.
4. **Scene Generation**: Designer Agent maps findings to the SceneGraph JSON.
5. **Real-time Preview**: KiligCanvas renders the data-driven visualization.
6. **Validation**: Validator Agent performs QC on the final logic.

---

## 6. Success Metrics
- **Scientific Fidelity**: Accuracy of visual representations relative to source paper metrics.
- **Latency-to-First-Frame**: Speed of generating the initial SceneGraph from research.
- **System Stability**: Resilience to rate limits via OpenRouter rotation.
