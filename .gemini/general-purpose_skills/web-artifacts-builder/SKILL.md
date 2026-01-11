---
name: web-artifacts-builder
description: Build frontend React artifacts with TypeScript, Tailwind, and shadcn/ui. Use for creating interactive web components, demos, or applications. Triggers on requests to "build web artifact", "create React component", or "make interactive demo".
---

# Web Artifacts Builder

Build powerful frontend claude.ai artifacts.

## Workflow

1. Initialize with `scripts/init-artifact.sh <project-name>`
2. Develop by editing generated code
3. Bundle with `scripts/bundle-artifact.sh`
4. Display artifact to user

## Stack

- React 18 + TypeScript
- Vite + Parcel (bundling)
- Tailwind CSS + shadcn/ui
- 40+ pre-installed components

## Design Guidelines

**AVOID "AI slop":**
- No excessive centered layouts
- No purple gradients on white
- No uniform rounded corners
- No default Inter font

**DO:**
- Rich, curated aesthetics
- Dynamic, responsive designs
- Proper visual hierarchy

## Quick Start

```bash
# Initialize
bash scripts/init-artifact.sh my-app
cd my-app

# Develop
# Edit src/App.tsx

# Bundle to single HTML
bash scripts/bundle-artifact.sh
# Creates bundle.html - self-contained artifact
```

## Reference

- shadcn/ui components: https://ui.shadcn.com/docs/components
