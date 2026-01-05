# Track: Agent Implementation

## Objective
Implement the logical structure of the Kilig platform agents using Google ADK for TypeScript, ensuring specialized roles and robust orchestration.

## Status
- **Current State**: Agents implemented (Root, Scientist, Narrative, Designer, Validator).
- **Orchestration**: Root agent uses `subAgents` and `transfer_to_agent` for coordination.
- **Models**: Unified on `gemini-2.0-flash`.

## Tasks
- [x] Define Root Agent (Coordinator).
- [x] Define Scientist Agent (Research & Analysis).
- [x] Define Narrative Architect Agent (Scripting).
- [x] Define SceneGraph Designer Agent (Visual Design).
- [x] Define QC & Validator Agent (Quality Control).
- [x] Fix cross-agent handoff logic (Sub-agents return to Root).
- [x] Register sub-agents in Root for Auto Flow.
- [ ] Implement SceneGraph persistence logic.
- [ ] Implement final Revideo export tool in Designer.

## Architecture Notes
- **Root Agent**: Acts as the central hub.
- **Handoffs**: Sub-agents perform their specialized task and then use `transfer_to_agent` to send findings back to Root.
- **MCP Tools**: Scientist uses ArXiv and Claude Skills MCP servers.
- **RAG**: Scientist uses a custom knowledge base (Supabase/Embeddings).
