---
name: looker-ca-agent-optimize
description: >-
  Optimizes existing Looker Conversational Analytics (CA) Standalone and
  Dashboard Agents for accuracy and response speed. Use when asked to audit,
  troubleshoot, benchmark, or upgrade an existing Looker CA agent using two
  modes: Soft (fast, zero-token static tune-up—default) and Hard (deep live
  reasoning-trace diagnostics and Side-by-Side clone testing). Automatically
  backs up and upgrades the agent, then offers optional LookML metadata fixes.
  Do not use for creating a new CA agent from scratch (use
  looker-ca-agent-create) or tuning general LookML SQL, caching, or PDTs (use
  looker-performance-optimizer).
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP via looker-mcp-skill and looker-cli via installing-looker-cli / authenticating-looker-cli; MCP-only Soft fallback supported).
metadata:
  version: "0.1.0"
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Optimizer

## Overview

This skill upgrades existing Looker Conversational Analytics (CA) Standalone Agents and Dashboard Agents for higher **Accuracy** and faster **Response Speed**, backing up and optimizing the assigned agent directly by default, then offering a simple **Yes / No** choice to fix any missing LookML descriptions or labels.

Verify tool availability passively: if Looker MCP is unavailable, ask the user to install `looker-base` first. On MCP-only hosts without `looker-cli`, accept raw Agent JSON (running `Soft` mode) and provide the upgraded configuration cleanly alongside optional `dev_mode` LookML updates.

---

## Optimization Modes (`Soft` vs. `Hard`)

| Mode | What It Does | Live CA Token Usage & Speed |
| :--- | :--- | :--- |
| **`Soft` *(Default — Recommended)*** | Fast static tune-up: inspects the agent's description, instructions, latency settings (`code_interpreter`), Golden Queries, `.lkml` logic, and real data samples, then upgrades the agent directly. | **`0` live CA tokens** (`~2-3 min`) |
| **`Hard`** | Deep live benchmark & trace optimization: runs real test questions against the agent, diagnoses internal reasoning loops, validates fixes Side-by-Side on an isolated `[TMP-SXS-EVAL]` clone, cleans up test history, and applies the winning upgrade. | **Uses live CA tokens** (`~5-8 min`) |

---

## Behavioral Guardrails (Mandatory)

1. **Executive, Jargon-Free UX (Zero Technical Walls or `Plan A / Plan B` Menus):** Keep user-facing responses concise (`~10-15` lines) and easy for any business user to read. Never use `"Plan A"` / `"Plan B"` labels, 5-option menus, or dump raw XML/YAML diffs or `.lkml` code blocks into chat unless the user explicitly asks to see technical details.
2. **Ask `Soft` vs. `Hard` at Gate #1, Optimize Agent by Default, Ask Yes/No for LookML Last:**
   - **Gate #1 (Step 1):** Confirm the target agent (if missing) and **always ask the user whether they want `Soft` *(Default)* or `Hard` optimization** (unless already explicitly specified in their prompt).
   - **Default Optimization (Steps 2-5):** Automatically save a rollback backup JSON first and **apply the agent improvements directly by default** (skipping writes only if the user explicitly asked for a read-only review without modifying the agent).
   - **Gate #2 (Step 6):** Report the concise upgrade summary (and `Before vs. After` table in `Hard` mode), then ask a single **Yes / No** question offering to fix spotted LookML `description:` or `label:` gaps in `dev_mode`.
3. **100% Technical Rigor, SxS Cleanup & Rollback Safety Under the Hood:** Internally enforce [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md): read `.model.lkml` and core `.view.lkml` files (`raw/` and `refined/`) in parallel, verify Golden Queries via `query` before `query_url`, validate 4-part XML/YAML (`<= 4,800` chars) inside the single Step 5 atomic update command (never spawn separate mid-workflow Python scripts), run two-step soft+hard cleanup (`{"deleted": true}` + `DELETE`) on `[TMP-SXS-EVAL]` artifacts, and validate approved `dev_mode` LookML edits via `validate_project` (`0` errors, zero auto-commits to production).
4. **Fail-Fast on Auth / `403` Errors & Zero CLI Discovery Loops:** Never run `looker-cli --help` or `session login`/`logout` loops. Halt immediately on `403`, repeated `401`, or `400 invalid_grant` per [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 4.

---

## Six-Step Execution Workflow

### Step 1: Confirm Target Agent & Choose `Soft` vs. `Hard` *(Human Gate #1)*
Pause immediately at Gate #1 (do not read `references/` files yet and do not execute any `run_command`/`ls` shell calls, config reads, or Looker MCP calls before pausing at Gate #1) if the **Target CA Agent** (Name, ID, URL, or JSON) is missing or if the user has not yet chosen between **`Soft` *(Default — fast, `0` live tokens)*** and **`Hard` *(deep live test & Side-by-Side trace optimization, uses tokens; requires `looker-cli`)***. If the user picks `Hard` without supplying test questions, accept theirs or offer to generate `3-4` realistic questions from the Explore.

### Step 2: Parallel Agent, LookML & Live Data Inspection
Follow [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md):
1. Load the agent via `get_agent "<id>"` or `search_agents` (`--limit 50` and `--category "dashboard" --limit 50`, required for Dashboard Agents where `get_agent` returns `404`), and resolve `project_id` via `get_models` if needed.
2. Run **Batch 1** (`get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files`, plus `get_dashboard` if Dashboard Agent) and **Batch 2** (`<= 8` calls: `.model.lkml`/core `.view.lkml` files via `get_project_file` + `get_field_value_suggestions` + `1-2` quick `query` checks on date coverage and real category/status values).

### Step 3: Static Best-Practice Diagnosis & Upgrade Drafting *(`Soft` & `Hard`)*
Evaluate description clarity, 4-part XML/YAML instructions (`"-NULL"`, valid date syntax, metric disambiguation, single-query rules), `code_interpreter` latency (`false` by default for standard BI Q&A), `sources`, Golden Queries (verifying new/repaired queries via `query` -> `query_url`), and LookML metadata gaps per [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md). **If `Mode == Soft`, jump directly to Step 5.**

### Step 4: Live Trace Diagnosis & Side-by-Side Validation *(`Hard` Mode Only)*
Run the `3-5` eval questions against Ground Truth `query` results and the current agent, classify reasoning loops via [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md), test the upgraded config on an isolated `[TMP-SXS-EVAL]` clone (1 clean round; Round 2 cap only if a question still fails), and immediately execute the mandatory **two-step soft+hard cleanup** per [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md).

### Step 5: Default Atomic Backup & Agent Upgrade
Execute one atomic command (`set -euo pipefail` / heredoc) per [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) that saves `/tmp/ca_agent_backup_<id>_<ts>.json` first (when local writes are available), validates strict XML 1.0 + `len <= 4800`, syncs verified Golden Queries, and updates the live agent via `update_agent "<id>" -`.

### Step 6: Concise Summary & Optional LookML Gate *(Human Gate #2 — Yes / No)*
1. Present a clear, business-friendly summary (`~10-15` lines) per [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md): **Agent Name & ID**, **What Improved** in plain language (plus the compact `Before vs. After` table if `Hard` mode ran), and confirmation of the saved rollback backup.
2. If Step 2 spotted missing LookML `description:` or `label:` fields, ask one simple question: whether they want those LookML gaps fixed in development mode (**Yes / No**). Only if the user replies **Yes**, enable `dev_mode` (`{"devMode": true}`), apply surgical additive edits via `get_project_file` + `update_project_file` (targeting `views/refined/` when present), confirm `0` errors via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<id>.diff` (when local writes are available), and confirm concisely.
