---
type: Reference
title: "Recipe: Legacy Runtime Migration & Symmetric Aggregates"
description: Automated migration recipe from legacy LookML syntax to modern runtime standards.
tags: [lookml, runtime-migration, symmetric-aggregates]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: legacy-checklist
    resource: /skills/custom/refactoring/references/legacy_runtime_checklist.md
    title: Legacy Runtime Checklist
---

# Recipe: Legacy Runtime Migration & Symmetric Aggregates

This playbook guides the automated migration of legacy LookML syntax to modern runtime standards.

---

## Workflow Steps

| Step | Action Type | Execution Details | Target Outcome |
| :--- | :--- | :--- | :--- |
| **1. Scan Syntax** | **Deterministic Tool** | Executes `scan_legacy_runtime_syntax()` or `scripts/runtime_migrator.py`. | Identifies missing primary keys, deprecated `sql_trigger_value`, and legacy measures. |
| **2. Refactor LookML** | **LLM (Markdown)** | Rewrites PDT triggers into datagroups and declares `primary_key: yes` on joined views. | Compliant LookML code ready for modern runtime. |
| **3. Validate LookML** | **Deterministic Tool** | Executes `looker-cli project validate <project_id>`. | Validates that the project compiles with zero legacy warnings. |
| **4. Verify Downstream Content** | **Deterministic Tool** | Runs Content Validator via `looker-cli`. | Confirms 0 broken tiles across all production dashboards. |
