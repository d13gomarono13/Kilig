---
name: doc-coauthoring
description: Guide users through collaborative document creation with three stages - Context Gathering, Refinement, and Reader Testing. Use for PRDs, design docs, decision docs, RFCs, or any substantial writing. Triggers on requests to "write a doc", "draft a proposal", "create a spec".
---

# Doc Co-Authoring Workflow

Structured workflow for collaborative document creation.

## Three Stages

### Stage 1: Context Gathering
Ask meta-context questions:
1. Document type? (technical spec, decision doc, proposal)
2. Primary audience?
3. Desired impact?
4. Template to follow?
5. Constraints?

Then encourage information dumping:
- Background, discussions, org context
- Alternative solutions considered
- Timeline pressures, stakeholder concerns

### Stage 2: Refinement & Structure
Build section by section:
1. Clarifying questions (5-10 per section)
2. Brainstorm options (5-20 items)
3. User curates (keep/remove/combine)
4. Draft the section
5. Iterative refinement via surgical edits

**Key rule**: User indicates changes rather than editing directly - helps learn their style.

### Stage 3: Reader Testing
Test with fresh Claude (no context bleed):
1. Predict reader questions
2. Test each question
3. Check for ambiguity, assumptions, contradictions
4. Fix gaps found

## Guidelines

- User talks 50%+ - this is a conversation
- Use `str_replace` for edits, never reprint whole doc
- After 3 iterations with no changes, ask what can be removed
- Final review: Check flow, redundancy, ensure every sentence carries weight
