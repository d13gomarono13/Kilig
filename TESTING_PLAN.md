# 🧪 Kilig Agent Testing: Step-by-Step Guide

This document outlines the standard procedure for running weekly multi-agent tests and syncing them with the Supabase STEM Matrix.

## 1. Setup & Prerequisites (One-Time)
Before running tests, ensure your connection to the cloud is active:
- [ ] **Database Schema**: Ensure all SQL files in `supabase/migrations/` (20260109_...) have been run in the Supabase SQL Editor.
- [ ] **Environment**: Ensure `.env` has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Running a Test Cycle
To run a test, use the following one-line command pattern. Replace the variables with the specific paper and discipline you are testing this week.

### Command Pattern:
```bash
RESEARCH_AREA="[STEM_DISCIPLINE]" PAPER_URL="[ARXIV_URL]" npm run test:e2e
```

### Example (Neuroscience Week):
```bash
RESEARCH_AREA="Neuroscience" PAPER_URL="https://arxiv.org/abs/2310.00001" npm run test:e2e
```

---

## 3. What Happens During the Test?
When you run the command above, the system executes these 5 phases automatically:

1.  **Phase 1: Pipeline Execution** (`test:pipeline`)
    - The Root Agent coordinates the Scientist, Narrative, and Designer agents.
    - Generates raw JSON artifacts in `tests/artifacts/[timestamp]`.
2.  **Phase 2: Linking** (`link:latest`)
    - Creates a symlink so the system always knows which folder is the "latest" run.
3.  **Phase 3: Normalization** (`artifacts:normalize`)
    - Extracts clean `.txt` and `.json` files from the raw agent turns.
4.  **Phase 4: Evaluation** (`test:eval`)
    - `promptfoo` runs assertions (LLM Rubrics, JSON schema checks, length checks).
    - Generates a `latest.json` report in `tests/results/`.
5.  **Phase 5: Supabase Sync** (`results:sync`)
    - Uploads the quality score, the paper metadata, and the research area to your dashboard.

---

## 4. Verifying Results
After the command finishes, check your progress:

1.  **Terminal**: Look for `✅ Sync Complete!` at the end.
2.  **Supabase Dashboard**:
    - Go to the **Table Editor** -> `pipeline_runs` to see the new entry.
    - Go to the **SQL Editor** and run `SELECT * FROM stem_leaderboard;` to see the updated scores.
3.  **Promptfoo UI**:
    - Run `npm run test:view` to open the visual comparison of agent responses.

---

## 5. Troubleshooting "Headaches"
- **Rate Limit (429)**: The script has a built-in 65s wait. If it keeps failing, wait 5 minutes and try again (Gemini Free Tier limits).
- **Missing Artifacts**: Ensure `npm run link:latest` ran correctly.
- **Database Errors**: Double-check the `SUPABASE_SERVICE_ROLE_KEY` in your `.env`.
