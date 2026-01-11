# Full Stack Pipeline Validation & Visualization

This track explains how to validate the Kilig agent pipeline (`Root` -> `Ingestor` -> `Scientist` -> `Narrative` -> `Designer` -> `Validator`) and visualize the results on the Frontend.

## 1. Automated Verification (Headless)
Use the `test_full_stack_flow.ts` script to verify the orchestration logic, tool execution, and database persistence *without* running the full frontend.

### Prerequisites
- Docker running (`docker-compose up -d`) to provide Redis, Postgres, and MCP Servers.
- `.env` configured in `packages/backend/`.

### Execution
Run the following command from the root or `packages/backend/`:

```bash
pnpm exec tsx scripts/test_full_stack_flow.ts
```

### What it does
1.  **Simulates** a specific user prompt (e.g., "Analyze ArXiv Paper X").
2.  **In-Process Server**: Starts a Fastify instance in the script.
3.  **Mocks/Spies**:
    - Spies on `dbService` to verify persistence calls.
    - *Note*: By default, this script mocks the final DB write to avoid cluttering the dev database. To enable real persistence, comment out the mock in the script.
4.  **Verifies**:
    - Project creation.
    - Agent handoffs (Root -> ... -> Validator).
    - Artifact generation (Analysis, Script, SceneGraph).

---

## 2. Live Visualization (Frontend + Backend)
To see the results in the UI, you must run the full application stack.

### Step 1: Start Infrastructure
Ensure all backing services (DB, Redis, MCPs) are running:

```bash
docker-compose up -d
```

### Step 2: Start Backend
In a terminal, start the backend server (Port 8000):

```bash
pnpm --filter @kilig/backend dev
```
*Wait for "Server listening on http://127.0.0.1:8000"*

### Step 3: Start Frontend
In a **new terminal**, start the frontend (Port 8080):

```bash
pnpm --filter @kilig/frontend dev
```

### Step 4: Start ReVideo Renderer (Optional)
If you want to render the actual video output:

```bash
pnpm --filter @kilig/revideo dev
```

### Step 5: Visualize
1.  Open **http://localhost:8080** in your browser.
2.  **Trigger the Flow**:
    - Enter a prompt in the creation input (e.g., "Explain the paper https://arxiv.org/pdf/2403.05530.pdf").
    - Click **Generate**.
3.  **Observe**:
    - The UI should show the "Project Created" state.
    - **Live Logs**: Watch the backend terminal. You will see colored logs for each agent:
        - `[Ingestor]`: "Ingesting..."
        - `[Scientist]`: "Analyzing..."
        - `[Narrative]`: "Writing Script..."
    - **Artifacts**: As agents finish, the UI should update (if implemented) or you can check the "History" / "Projects" tab.

## Troubleshooting

### "Tool execution failed"
- Check that `docker-compose` is running.
- Ensure `kilig-mcp-docling` container is healthy (`docker ps`).
- Run `pnpm exec tsx scripts/check_docling_tools.ts` to verify MCP connectivity.

### "Database error"
- Ensure migrations are applied.
- Check Supabase credentials in `.env`.
