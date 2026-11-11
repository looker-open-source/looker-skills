---
name: looker-ca-agent-optimize
description: >-
  Optimizes existing Looker Conversational Analytics (CA) Standalone and
  Dashboard Agents for accuracy and response speed. Use when asked to audit,
  troubleshoot, benchmark, or upgrade an existing Looker CA agent using two
  modes: Fast (alias Soft: fast, zero-token static and System Activity
  telemetry tune-up—default) and Advanced (alias Hard: deep live reasoning-trace
  diagnostics, Text/CSV/Google Sheets Eval Suite ingestion, and Side-by-Side
  clone testing). Checks caller permissions (Viewer, Analyst, Developer, Admin),
  automatically backs up and upgrades the agent with human-readable YAML
  instructions, and offers optional LookML metadata fixes or developer handoff
  notes. Do not use for creating a new CA agent from scratch (use
  looker-ca-agent-create) or tuning general LookML SQL, caching, or PDTs (use
  looker-performance-optimizer).
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP via looker-mcp-skill and looker-cli via installing-looker-cli / authenticating-looker-cli; MCP-only Fast fallback supported).
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

This skill upgrades existing Looker Conversational Analytics (CA) Standalone Agents and Dashboard Agents for higher **Accuracy** and faster **Response Speed** using human-readable YAML instructions, `system__activity` telemetry diagnostics (when Admin access is available), and role-aware permission checks—backing up and optimizing the assigned agent directly by default, followed by a simple **Yes / No** LookML metadata offer (for Developers) or a copy-ready **Developer Handoff note** (for non-developers).

Verify tool availability passively: if Looker MCP is unavailable, ask the user to install `looker-base` first. On MCP-only hosts without `looker-cli`, accept raw Agent JSON (running `Fast` mode) and provide the upgraded configuration cleanly alongside optional `dev_mode` LookML updates.

---

## Optimization Modes (`Fast` vs. `Advanced`)

| Mode | What It Does | Live CA Token Usage & Speed |
| :--- | :--- | :--- |
| **`Fast` *(Default — Recommended; alias: `Soft`)*** | Fast static & telemetry tune-up: checks caller permissions, queries `system__activity` (`conversations_feedback` & `history`) if Admin, inspects the agent's description, YAML instructions, latency settings (`code_interpreter`), Golden Queries, `.lkml` logic, and real data samples, then upgrades the agent directly. | **`0` live CA tokens** (`~2-3 min`) |
| **`Advanced` *(alias: `Hard`)*** | Deep live benchmark & trace optimization: ingests test questions from user Text/CSV/Google Sheets Eval Suites (or `system__activity` failures / Explore), diagnoses internal reasoning loops, validates fixes Side-by-Side on an isolated `[TMP-SXS-EVAL]` clone, cleans up test history, and applies the winning upgrade. | **Uses live CA tokens** (`~5-8 min`) |

---

## Behavioral Guardrails (Mandatory)

1. **Executive, Jargon-Free UX & Human-Readable YAML (Zero Technical Walls, XML Tags, or `&amp;` Entities):** Keep user-facing responses concise (`~10-15` lines) in plain business language. Never use `"Plan A"` / `"Plan B"` labels, 5-option menus, or dump raw YAML/XML diffs or `.lkml` code blocks into chat unless requested. Always write `context.instructions` in **4-part human-readable YAML** using natural symbols (`&`, `<`, `>`, `>=`, `<=`)—never XML wrapper tags (`<agent_instructions>`) or HTML/XML entities (`&amp;`, `&lt;`, `&gt;`).
2. **Permission Pre-Flight, Ask `Fast` vs. `Advanced` at Gate #1, Optimize by Default, Adapt LookML Gate to Caller Role:**
   - **Gate #1 (Step 1):** Confirm the target agent (if missing) and **always ask the user whether they want `Fast` *(Default)* or `Advanced` optimization** (unless already specified, accepting `"Soft"` and `"Hard"` seamlessly as aliases).
   - **Role-Aware Execution & Default Optimization (Steps 2-5):** Check `can.update`, `see_system_activity`, and `develop` permissions in Step 2. If `can.update == false` (**Viewer**), run in read-only diagnostic mode and provide a shareable report for the agent owner/Admin. Otherwise, save a rollback backup JSON first and **apply the agent improvements directly by default** (skipping writes only if the user asked for a read-only review).
   - **Gate #2 (Step 6):** Report the concise upgrade summary, `system__activity` insights (or a brief 1-line tip recommending Admin execution if `see_system_activity` was unavailable), and the `Before vs. After` table in `Advanced` mode. Then, if LookML `description:` or `label:` gaps were spotted, end with **only** a single **Yes / No** question to fix them in `dev_mode` by default (never append a developer handoff note unless `get_project_files` explicitly returned `403` / the caller lacks `develop`, in which case replace the Yes / No question with a copy-ready **Note for Your LookML Developer**).
3. **100% Technical Rigor, SxS Cleanup & Rollback Safety Under the Hood:** Internally enforce [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md): query `system__activity` opportunistically with automatic `0-row` / `403` fallback, read `.model.lkml` and core `.view.lkml` files in parallel when `develop` access exists, verify Golden Queries via `query` before `query_url`, validate 4-part human-readable YAML (`<= 4,800` chars, zero `&amp;`) inside the single Step 5 atomic update command (never spawn separate mid-workflow Python scripts), run two-step soft+hard cleanup (`{"deleted": true}` + `DELETE`) on `[TMP-SXS-EVAL]` artifacts, and validate approved `dev_mode` LookML edits via `validate_project` (`0` errors, zero auto-commits to production).
4. **Fail-Fast on Auth Errors & Zero CLI Discovery Loops:** Never run `looker-cli --help` or `session login`/`logout` loops. Halt immediately on repeated `401`, `400 invalid_grant`, or `404 login` per [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 4.

---

## Six-Step Execution Workflow

### Step 1: Confirm Target Agent & Choose `Fast` vs. `Advanced` *(Human Gate #1)*
Pause immediately at Gate #1 (do not read `references/` files yet and do not execute any `run_command`/`ls` shell calls, config reads, or Looker MCP calls before pausing at Gate #1) if the **Target CA Agent** (Name, ID, URL, or JSON) is missing or if the user has not yet chosen between **`Fast` *(Default — fast, `0` live tokens; alias: `Soft`)*** and **`Advanced` *(deep live test & Side-by-Side trace optimization, uses tokens; alias: `Hard`)***. If the user picks `Advanced`, accept an optional **Eval Suite** via **inline text**, **local `.csv`/`.tsv` file**, or **Google Sheets** (`question`, `ground_truth`, `issue_description`), or offer to pull real failing questions from `system__activity` / auto-generate `3-4` realistic questions from the Explore.

### Step 2: Parallel Agent, Permissions, System Activity & LookML Inspection
Follow [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md):
1. Load the agent via `get_agent "<id>"` or `search_agents` (`--limit 50` and `--category "dashboard" --limit 50`, required for Dashboard Agents where `get_agent` returns `404`), check `can.update` (switching to Read-Only Viewer Mode if `false`), check `is_lookml` (`lookml_agent_id` / `lookml_edit_uri`), and resolve `project_id` via `get_models` if needed.
2. In parallel, query `model: "system__activity"` (`explore: "conversations_feedback"` and `explore: "history"` filtered by `query_api_client_context.name: "Conversational Analytics"`) to surface historical `Thumbs down` feedback, `Timeout`/`Error` turns, slow SQL queries, and token usage (gracefully falling back if `0` rows exist or if `403` indicates the caller is not an Admin).
3. Run **Batch 1** (`get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files`, plus `get_dashboard` if Dashboard Agent; setting `has_develop_permission = false` if `get_project_files` returns `403`/empty) and **Batch 2** (`<= 8` calls: `.model.lkml`/core `.view.lkml` files via `get_project_file` when `has_develop_permission` is true + `get_field_value_suggestions` + `1-2` quick `query` checks on date coverage and real category/status values).

### Step 3: Static & Telemetry Diagnosis & Upgrade Drafting *(`Fast` & `Advanced`)*
Evaluate description clarity, 4-part human-readable YAML instructions (natural `&`/`<`/`>` symbols, zero `&amp;` or XML tags, `"-NULL"`, valid `"30 days ago for 30 days"` date syntax, metric disambiguation, single-query rules), `system__activity` pain points, `code_interpreter` latency (`false` by default for standard BI Q&A), `sources`, Golden Queries (verifying new/repaired queries via `query` -> `query_url`), and LookML metadata gaps per [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md). **If `Mode == Fast` (or `Soft`), jump directly to Step 5.**

### Step 4: Live Trace Diagnosis & Side-by-Side Validation *(`Advanced` / `Hard` Mode Only)*
Ingest the `3-5` eval questions (from user inline text, `.csv`/`.tsv`, Google Sheets, `system__activity` failures, or Explore auto-generation), run them against Ground Truth `query` results and the current agent, classify reasoning loops via [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md), test the upgraded config on an isolated `[TMP-SXS-EVAL]` clone (1 clean round; Round 2 cap only if a question still fails), and immediately execute the mandatory **two-step soft+hard cleanup** per [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md).

### Step 5: Default Atomic Backup & Agent Upgrade
If `can.update` is `true` and `is_lookml` is `false`/absent, execute one atomic command (`set -euo pipefail` / heredoc) per [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) that saves `/tmp/ca_agent_backup_<id>_<ts>.json` first (when local writes are available), validates human-readable YAML (`len <= 4800`, all 4 sections present, zero `&amp;`/`&lt;`/`&gt;`), updates existing Golden Queries in place (`update_golden_query`) or registers new ones (`create_golden_query`), and updates the live agent via `update_agent "<id>" -`. If `is_lookml` is `true`, skip `PATCH /agents/{id}` and route the agent's instruction/golden-query updates into its LookML file (`lookml_edit_uri`) during Step 6 `dev_mode`.

### Step 6: Concise Summary & Role-Aware LookML Gate *(Human Gate #2)*
1. Present a clear, business-friendly summary (`~10-15` lines) per [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md): **Agent Name & ID**, **What Improved** in plain language, **System Activity Status** (insights applied, `0` prior rows, or the 1-line Admin tip if `see_system_activity` was unavailable), the compact `Before vs. After` table if `Advanced` mode ran, and confirmation of the saved rollback backup.
2. If Step 2 spotted missing LookML `description:` or `label:` fields: when `has_develop_permission` is `true` *(the default unless `get_project_files` explicitly returned `403` or the caller lacks `develop`)*, end Step 6 with **only** one simple **Yes / No** question to apply surgical additive edits in `dev_mode` (`validate_project` `0` errors, saving `/tmp/ca_lookml_patch_<id>.diff`; do not append a developer handoff note when `has_develop_permission` is `true`). Only when `has_develop_permission` is explicitly `false`, replace the Yes/No question with a concise copy-ready **Note for Your LookML Developer**.

---

## Task-Gated Reference Routing

Do not read any `references/` files before pausing at Gate #1 (Step 1). Once Gate #1 is confirmed, load only the reference file (and line range) required for the active optimization mode:

| Task / Mode | Reference File to Read | Scope / Line Range |
| :--- | :--- | :--- |
| **Steps 2 & 5 (`Fast` Mode): Inspection, System Activity & Atomic Upgrade** | [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) | Lines `1-18, 40-52` only (skip Section 2 `Advanced` SxS clone recipes) |
| **Steps 2, 4 & 5 (`Advanced` Mode): Full SxS Clone, Trace Eval & Cleanup** | [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) | Full file (`52` lines) |
| **Steps 3 & 6: Upgrade Hierarchy & Executive Summary Template** | [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md) | Full file (`47` lines) |
| **Step 4 (`Advanced` Mode Only): Live Reasoning-Trace Loop Taxonomy** | [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md) | Read **only** in `Advanced` (`Hard`) mode (`49` lines; never load in `Fast` mode) |
| **YAML Guardrails, API 4.0 Schema & Auth Fail-Fast** | [looker-ca-best-practices.md](references/looker-ca-best-practices.md) | Read once during Step 3 (`73` lines) |
| **Step 2 & Step 6: LookML Refinement Audit & `dev_mode` Edits** | [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) | Read only when `has_develop_permission` is `true` or generating a Developer Note (`37` lines) |
