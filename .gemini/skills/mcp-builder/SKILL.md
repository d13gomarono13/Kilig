---
name: mcp-builder
description: Create MCP (Model Context Protocol) servers enabling LLMs to interact with external services. Use for building tool integrations, API wrappers, or database connectors. Triggers on requests to "build MCP server", "create integration", or "make tools available to LLM".
---

# MCP Server Development

Create MCP servers that enable LLMs to interact with external services.

## Four-Phase Workflow

### Phase 1: Research & Planning
1. Study MCP protocol docs (modelcontextprotocol.io)
2. Load framework docs (TypeScript recommended)
3. Understand the API to integrate
4. Plan tool selection (prioritize comprehensive coverage)

### Phase 2: Implementation
1. Set up project structure
2. Create API client with authentication
3. Implement tools with:
   - Input schema (Zod/Pydantic)
   - Output schema where possible
   - Annotations (readOnlyHint, destructiveHint, etc.)

### Phase 3: Review & Test
1. Code quality review (DRY, consistent error handling)
2. Build verification
3. Test with MCP Inspector

### Phase 4: Create Evaluations
Create 10 evaluation questions:
- Independent, read-only, complex, realistic
- Single verifiable answer
- Output as XML with qa_pair elements

## Reference Files

Load as needed:
- `reference/mcp_best_practices.md` - Universal guidelines
- `reference/node_mcp_server.md` - TypeScript patterns
- `reference/python_mcp_server.md` - Python patterns
- `reference/evaluation.md` - Evaluation guidelines
