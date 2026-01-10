---
name: webapp-testing
description: Test local web applications using Playwright scripts. Use for browser automation, UI testing, or web scraping. Triggers on requests to "test web app", "automate browser", or "run playwright tests".
---

# Web Application Testing

Test local web applications with Playwright.

## Decision Tree

```
Is it static HTML?
├─ Yes → Read HTML file directly for selectors
│         → Write Playwright script
└─ No (dynamic webapp) → Is server running?
    ├─ No → Use scripts/with_server.py
    └─ Yes → Reconnaissance-then-action:
        1. Navigate + wait for networkidle
        2. Take screenshot or inspect DOM
        3. Identify selectors
        4. Execute actions
```

## with_server.py Usage

```bash
# Single server
python scripts/with_server.py \
  --server "npm run dev" --port 5173 \
  -- python your_automation.py

# Multiple servers
python scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

## Playwright Script Pattern

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # CRITICAL
    # automation logic
    browser.close()
```

## Common Pitfall

❌ Don't inspect DOM before `networkidle` on dynamic apps
✅ Always `page.wait_for_load_state('networkidle')` first
