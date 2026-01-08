# Track: Promptfoo Evaluation & Artifact Testing

## Objective
Implement automated quality assessment for Kilig agent artifacts using Promptfoo.

## Goals
1. **Automated Grading**: Use LLM-as-a-judge to evaluate Scientific Analysis and Comic Manifests.
2. **Regression Testing**: Ensure new agent prompts don't degrade the quality of generated media.
3. **Structured Validation**: Assert that Comic Manifests follow specific schema rules and logical flow.

## Strategy
- **Artifact Reviewer**: Use Promptfoo's file-based providers to read JSONs from `test_artifacts/`.
- **Custom Assertions**: Define Python or Javascript assertions for complex schema validation.
- **CI/CD Integration**: Run Promptfoo checks after every `test:pipeline` execution.

## Tasks
- [x] **Initial Config**: Create `promptfooconfig.yaml`.
- [x] **Artifact Provider**: Write a custom provider that pulls the latest run from `test_artifacts/`.
- [x] **Test Cases**: 
    - [x] Scientist Synthesis Quality.
    - [x] Narrative Comic Manifest Logic (Panel sequencing, layout consistency).
- [x] **Dashboard**: Setup local Promptfoo viewing for test results.

## Status
- **Completed**: Track fully implemented with advanced test cases and dashboard setup.
