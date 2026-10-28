---
type: Reference
title: "Recipe: Content Validator CI/CD Pre-Deployment Check"
description: Automated pre-deployment validation workflow using local Git and looker-cli content validator.
tags: [looker-cli, content-validator, ci-cd, pre-deployment]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: spectacles-setup
    resource: /skills/custom/refactoring/references/spectacles_ci_setup.md
    title: Spectacles CI Setup
---

# Recipe 2: Content Validator CI/CD Pre-Deployment Check

This playbook guides the automated pre-deployment validation workflow using local Git and `looker-cli`.

---

## Workflow Steps

| Step | Action Type | Execution Details | Target Outcome |
| :--- | :--- | :--- | :--- |
| **1. Create Dev Branch** | **Deterministic Tool** | Creates and checks out a clean git branch (e.g. `pso-refactor-cleanup`). | Isolates changes from production. |
| **2. Run LookML Validator** | **`looker-cli`** | Executes `looker-cli project validate <project_id> --verify-ssl=false`. | Verifies syntax and compile validity. |
| **3. Run Content Validator** | **`looker-cli`** | Executes `looker-cli api content_validator run_content_validation --verify-ssl=false`. | Compares active development branch against production dashboards and catches broken tiles. |
| **4. Report Broken Tiles** | **LLM (Markdown)** | Lists any broken dashboard tile IDs, look IDs, and specific missing field names. | Clear pre-merge diagnostic report. |
