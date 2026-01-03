# Technology Stack: Project Kilig 2.0

## Core Runtime & Language
- **Language:** TypeScript 5.8+ (Strict type safety end-to-end)
- **Runtime:** Node.js 20+ (ESM)

## Backend (Agent & Logic)
- **AI Orchestration:** Google Agent Development Kit (ADK)
- **Server Framework:** Fastify (Async, high-performance, typed)
- **Data Validation:** Zod (Shared schemas between packages for robust data integrity)

## Frontend (Body & Visualization)
- **Framework:** Next.js 15+ (App Router, Server Actions, Streaming)
- **Video Rendering:** Revideo (Programmatic video editing based on Motion Canvas)
- **State Management:** TanStack Query (Server state/caching), Zustand (Client-side canvas state)
- **AI Streaming:** Vercel AI SDK (`ai` package) for real-time JSON updates

## Infrastructure & Storage
- **Database/Vector:** Supabase (pgvector) for metadata and scientific content RAG
