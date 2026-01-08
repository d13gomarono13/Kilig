# Track: Weekly End-to-End Pipeline Testing

## Objective
Establish a robust, automated weekly testing protocol to ensure the Kilig video generation pipeline remains stable, performant, and regression-free as the codebase evolves.

## Goals
1.  **Automated Execution**: Run the full end-to-end pipeline (Scientist -> Narrative -> Designer -> Validator) on a weekly schedule.
2.  **Regression Detection**: Identify breaking changes in agent handoffs, prompt logic, or tool integrations.
3.  **Performance Monitoring**: Track latency and token usage (via Groq/Gemini logs) to optimize cost/speed.
4.  **Artifact Validation**: Ensure generated artifacts (Scientific Analysis, Scripts, SceneGraphs, Comic Manifests) meet schema requirements.

## Strategy
-   **Test Script**: Maintain and enhance `scripts/test_pipeline.ts` as the canonical "Golden Path" test.
-   **CI/CD Integration**: (Future) Integrate with GitHub Actions or a Cron job.
-   **Reporting**: Log execution results to a local file or dashboard.

## Tasks
- [x] **Stabilize Test Script**: Ensure `scripts/test_pipeline.ts` handles all agent turns reliably without manual intervention.
- [x] **Artifact Logging**: Update the runner to save intermediate artifacts (JSONs) to a `test_artifacts/{timestamp}/` folder for inspection.
- [x] **Schedule**: Manual for now (run `npm run test:pipeline` every Monday morning).
- [x] **Alerting**: Basic exit code strategy implemented (exit 1 on failure).

## Status
- **Completed**: Stabilization, Logging, and manual schedule defined.
