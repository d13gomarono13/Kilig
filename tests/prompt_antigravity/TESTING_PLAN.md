> "I want you to take ownership of the **'Weekly STEM Testing'** protocol.
>
> **Your Goal:** Ensure our multi-agent framework is tested against a new scientific paper every week and the results are logged to Supabase.
>
> **The Workflow:**
> 1. **Select a Paper:** Ask me for a paper URL and a STEM Domain (e.g., 'Neuroscience'), or pick one from `papers_to_test.md` if it exists.
> 2. **Execute:** Run this command in the terminal:
>    `RESEARCH_AREA='[Domain]' PAPER_URL='[URL]' npm run test:e2e`
> 3. **Verify:** Check that the command outputs `✅ Sync Complete!`.
> 4. **Report:** Summarize the `tests/results/latest.html` visual report for me.
>
> Please set this up as a recurring task or a one-click action I can trigger."

---

## 🔐 Final Security Step
To secure your Supabase Views and remove the yellow dashboard warnings:

1.  Open `supabase/migrations/20260109_secure_views.sql`.
2.  **Copy** the entire content.
3.  **Paste & Run** it in your **Supabase SQL Editor**.