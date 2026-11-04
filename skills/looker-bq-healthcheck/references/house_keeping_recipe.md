# Recipe 1: Housekeeping & Model Bloat (using Henry)

This deterministic workflow automates model bloat discovery, unused LookML view pruning, and stale dashboard metadata cleanup.

---

## Workflow Steps

```
 ┌───────────────────────┐
 │ 1. Run Henry Pulse    │ ──> Identifies Explores/Views with 0 user queries over 90 days.
 └───────────┬───────────┘
             ▼
 ┌───────────────────────┐
 │ 2. Prune LookML Code  │ ──> Safely comments out or deletes unused views & joins.
 └───────────┬───────────┘
             ▼
 ┌───────────────────────┐
 │ 3. Clean Content      │ ──> Archives unused Looks/Dashboards associated with deleted files.
 └───────────────────────┘
```

| Step | Action Type | Execution Details | Target Outcome |
| :--- | :--- | :--- | :--- |
| **1. Run Henry Pulse** | **Deterministic Tool** | Executes `run_henry_pulse()` or `henry pulse --timeframe=90` against the target model. | Produces structured list of unused Explores and Views. |
| **2. Prune LookML** | **LLM (Markdown)** | Reads Henry output, locates view files in git repo, and stages clean deletions/refactors. | Removes unused view declarations and explores from `.model.lkml`. |
| **3. Clean Content** | **Deterministic Tool** | Uses `looker-cli` or Looker API to archive stale Looks and Dashboards associated with removed files. | Reclaims clean instance metadata space. |
