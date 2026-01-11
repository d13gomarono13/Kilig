---
name: skill-creator
description: Create effective skills for extending Claude/Gemini capabilities. Use for packaging workflows, tool integrations, or domain expertise into reusable skills. Triggers on requests to "create a skill", "package workflow", or "build extension".
---

# Skill Creator

Create modular, self-contained skills that extend AI capabilities.

## Skill Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    # Executable code
    ├── references/ # Documentation for context
    └── assets/     # Templates, icons, fonts
```

## Creation Process

### Step 1: Understand with Examples
- Get concrete usage examples from user
- Clarify functionality scope

### Step 2: Plan Contents
- Identify reusable scripts/references/assets
- What would help with repeated execution?

### Step 3: Initialize
```bash
scripts/init_skill.py <skill-name> --path <output>
```

### Step 4: Edit
- Write SKILL.md with concise instructions
- Add reusable resources
- Test scripts

### Step 5: Package
```bash
scripts/package_skill.py <path/to/skill>
```

## Key Principles

- **Concise is key** - Context window is shared
- **Progressive disclosure** - Metadata loads first, body on trigger
- **Set appropriate freedom** - Match specificity to task fragility
- **Imperative form** - Use command language

## Reference Files

- `references/workflows.md` - Multi-step process patterns
- `references/output-patterns.md` - Template and example patterns
