---
name: looker-ca-agent-optimize
description: >-
  Audits and optimizes Looker Conversational Analytics (CA) Standalone and
  Dashboard Agents for accuracy and latency. Use when the user asks to audit a
  Looker CA agent against best practices, diagnose thought loops, field-sampling
  loops, or data-hunting loops in CA reasoning traces, optimize CA system
  instructions and golden queries, or run Side-by-Side (SxS) agent evaluations.
  Do not use for creating a brand-new CA agent from scratch (use
  looker-ca-agent-create) or optimizing general LookML SQL, caching, or PDT
  queries (use looker-performance-optimizer).
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP via looker-mcp-skill and looker-cli via installing-looker-cli / authenticating-looker-cli; MCP-only Audit fallback supported).
metadata:
  version: 0.1.0
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Performance Optimizer

## Overview

This skill audits and optimizes existing Looker Conversational Analytics (CA) Standalone Agents and Dashboard Agents to improve **Accuracy** (matching ground-truth query results) and reduce **Latency** (P50/P90 response time).

Verify tool availability passively from declared tools: if Looker MCP is unavailable, ask the user to install `looker-base` (`looker-mcp-skill` and `authenticating-looker-cli`) first. In MCP-only cloud or chat environments without `looker-cli` shell access, ask the user for raw Agent configuration JSON (downgrading `Optimize` requests to static `Audit` mode) and execute `Audit` + `Plan B` LookML `dev_mode` updates via Looker MCP with inline diff/payload output.

---

## Operating Modes

Because running live evaluations consumes Conversational Analytics tokens, this skill supports two explicit modes:

| Mode | Basis | Live CA Eval Runs / Token Usage? | Execution Path |
| :--- | :--- | :--- | :--- |
| **`Audit`** *(Default)* | Static adherence check of instructions, settings, golden queries, and LookML against best practices. | **None** (`0` CA runs) | Steps 1 -> 2 -> 3 -> 6 -> 7 |
| **`Optimize`** | Live CA Agent reasoning-trace analysis + up to 2 rounds of Side-by-Side (SxS) validation. | **Yes** (Baseline + up to 2 SxS rounds) | Steps 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 |

---

## Behavioral Guardrails (Mandatory)

1. **Two Interactive Human Gates Only:** Pause for user input strictly at **Step 1** (Input Validation) and **Step 6** (Interactive Review & Authorization of **Plan A: CA Agent** and **Plan B: LookML `dev_mode`**, which directly authorizes **Step 7** execution). Execute Steps 2 through 5 automatically.
2. **Reality Mapping & Surgical LookML Refinement Safety:** Never invent Explore names, field names, or agent settings. Never mistake **LookML Refinements (`view: +view_name` across `raw/` and `refined/` layers)** for duplicate fields. When patching LookML via `update_project_file`, always read the complete file via `get_project_file` first and apply surgical, additive field-level edits—never perform destructive full-file rewrites that strip existing fields, joins, or developer comments, and never add `hidden: yes` without verifying zero impact on Explores or dashboards.
3. **SxS Isolation, Two-Step Cleanup & Rollback Safety:** Never overwrite an existing agent in place during SxS testing (clone a temporary `[TMP-SXS-EVAL]` agent with mandatory `"name"`, `"description"`, and `"sources"`, then run the two-step soft+hard cleanup afterward so no test entries remain in the Looker UI `Recent` sidebar). Always snapshot the prior agent config to `/tmp/` (or inline) before patching, validate LookML edits in `dev_mode` (`{"devMode": true}`) via `validate_project` (auto-reverting on any error), and never auto-commit LookML changes to production.
4. **Fail-Fast on Authentication Errors & Zero CLI Discovery Loops:** Never run exploratory `looker-cli --help` chains or loop on authentication failures (`session login`/`logout`). Follow [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 5: on Looker MCP `401` / `oauth2` errors, try at most **one** `get_models` re-handshake; if it still fails, or if `looker-cli` returns `400 invalid_grant` without `LOOKERSDK_CLIENT_ID`/`LOOKERSDK_CLIENT_SECRET` (or `LOOKER_CLIENT_ID`/`LOOKER_CLIENT_SECRET`) in the environment, **halt immediately** and ask the user to refresh their Looker API 4.0 credentials.

---

## Seven-Step Execution Workflow

### Step 1: Collect & Validate User Inputs *(Human Gate #1)*
If any required input below (`Looker Instance URL / Connection`, `CA Agent Identifier`, or `Eval Suite` when `Mode == Optimize`) is missing from the user's prompt, **STOP IMMEDIATELY** and ask the user—never run any shell command (including `ls` even on the skill's own directory, `which`, `env`, or `looker-cli`), inspect `~/.config/looker-cli/config.yaml`, or call any Looker MCP tool during Step 1:
- **Looker Instance URL / Connection** *(Required)*
- **CA Agent Identifier** *(Required)*: Agent ID/GUID, Agent Name, Agent URL, or raw Agent configuration JSON (infer Standalone vs. `"category": "dashboard"` Dashboard Agent).
- **Mode** *(Optional, default: `Audit`)*: `Audit` or `Optimize`.
- **Target Metric** *(Optional, `Optimize` mode only, default: `All`)*: `Accuracy`, `Latency`, or `All`.
- **Eval Suite** *(Required for `Optimize`, optional for `Audit`)*: Text, CSV, or Sheet containing `(User Question, Ground Truth Query/Tile, Issue Description)`.

### Step 2: Automatic Looker & Agent Connection Setup (Parallel MCP Batch)
1. Reuse any Explore schema or agent metadata already fetched in the session. If raw Agent configuration JSON was supplied in Step 1, parse it directly without calling `looker-cli`; otherwise resolve the GUID if given a display name (`query` on `system__activity.agent` or `search_agents --name`) and load `get_agent "<agent_id>"` (`GET /api/4.0/agents/{agent_id}`, falling back to `search_agents --category "dashboard"` for `"category": "dashboard"` agents where `get_agent` returns `HTTP 404`) per [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md). Resolve `project_id` via `get_models`/`get_projects` if unknown, then fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in **one parallel MCP batch** (never calling `get_explore` on top of `get_dimensions` + `get_measures`; note multi-record MCP outputs use JSONL), followed by a parallel batch of `get_project_file` + `get_field_value_suggestions` (and `get_dashboard` for Dashboard Agents).
2. If access is blocked (`403`) or credentials are expired (`401` / `400 invalid_grant`), halt immediately and report the exact missing Looker role, GCP IAM permission, or Looker API 4.0 credential refresh required.
3. Output a concise one-line setup summary (for example: `"Connected: Standalone Agent with 2 Explores and 6 golden queries."`).

### Step 3: Static Best-Practice Audit *(Both Modes)*
Evaluate the loaded agent and LookML against [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md):
- **Instructions & Filter Syntax:** Check 4-part XML/YAML structure (`<role_and_tone>`, `<explore_and_filtering_rules>`, `<semantic_and_execution_rules>`, `<presentation_and_analysis_rules>`), strict XML 1.0 escaping (`&amp;`, no raw `<`/`>` inside element bodies), token/character budget (`< 1,200` tokens / `<= 4,800` chars via `len()`), field validity against live LookML, Looker native string filter syntax (`"-NULL"` rather than `"not null"`) and valid date syntax (`"30 days ago for 30 days"`), and Dashboard Agent `"<instance_origin>-<dashboard_id>"` binding + tile-to-measure mappings / filter inheritance when `"category": "dashboard"`.
- **Explore Scoping, Settings & Golden Queries:** Check for noisy mega-explores in `sources`, `code_interpreter` latency overhead (`false` by default unless Python statistical modeling is required), golden query count (`< 20` on Standalone Agents; omitted on Dashboard Agents), 1-question-per-entry compliance, and `<= 50%` overlap.
- **LookML Metadata (With Refinement & Safety Check):** Identify exposed fields missing `description:`/`label:`, safe `hidden: yes` candidates on technical keys, or joined views missing `primary_key: yes`. Never flag `+view_name` refinements as duplicates; prefer disambiguating agent-specific fields in `Plan A` over hiding fields in `Plan B`.
- **Routing Rule:** If `Mode == Audit`:
  - If zero gaps are found, output: `"No best-practice gaps found. Run Optimize mode to analyze live CA agent behavior."` and stop.
  - Otherwise, mark all findings as `"Not validated in SxS"` and jump directly to **Step 6**.

### Step 4: Baseline Run & Reasoning-Trace Diagnosis *(`Optimize` Mode Only)*
1. Execute Ground Truth queries in capped parallel batches (`<= 8` calls/batch) via Looker MCP `query` (bare-key object `filters` with `"-NULL"` on strings—never `null`—and integer `limit`), run the Eval Suite against the current CA Agent (`create_conversation` + `conversational_analytics_chat`), and record baseline **Accuracy** and directional **P50 / P90 Latency**.
2. Classify trace failures (`thoughts` and tool calls) using [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md) into **Thought Loops / Multi-Query Stacking** (or `code_interpreter: true` `python_and_chart_agent` overhead), **Field-Sampling Loops**, **Data-Hunting Loops** (guessed narrow date filters or literal `"not null"`), and **Semantic & Filter Ambiguity**, merging them with Step 3 findings.

### Step 5: Cheapest-First Drafting & 2-Round SxS Self-Check *(`Optimize` Mode Only)*
Follow [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md) and [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md):
1. Draft fixes cheapest-first: **(1) Prune/simplify instructions -> (2) Metadata settings (`sources`, `code_interpreter`) -> (3) Targeted instruction rules -> (4) Golden queries (`< 20`, verified via `query` before `query_url` + `create_golden_query`) -> (5) Safe LookML metadata**.
2. Run **Round 1 SxS** on a temporary draft clone (`[TMP-SXS-EVAL]`, including mandatory `"name"`, `"description"`, `"sources"`). If the target metric improves with zero regressions, proceed to **Step 6**; otherwise refine from Round 1 traces and run **Round 2 SxS (Final)**.
3. Immediately after evaluation, execute the mandatory **two-step soft+hard cleanup** (`update_conversation`/`update_agent` `{"deleted": true}` followed by `delete_conversation`/`delete_agent`) on all temporary conversations and the `[TMP-SXS-EVAL]` agent.

### Step 6: Present Scorecard & Two Interactive Execution Plans *(Human Gate #2)*
Present the structured report defined in [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md):
1. **Verdict & SxS Scorecard (`Optimize` only):** `Improved` / `Partial Improvement` / `No Further Optimization Possible` / `Audit Only`, plus Baseline vs. Proposed Accuracy, P50/P90 Latency, and any **Metric Trade-off Alert**.
2. **Plan A — CA Agent Configuration Plan (`A1..An` — Target: Looker API 4.0 `PATCH /api/4.0/agents/{id}`):** Summary table (`Validation Status`: `"Validated in SxS"` in `Optimize` mode, `"Not validated in SxS"` in `Audit` mode) and full `Before -> After` diffs for `context.instructions`, settings (`sources`, `code_interpreter`), and `golden_query_ids`.
3. **Plan B — Validated LookML Dev-Branch Plan (`B1..Bn` — Target: Looker `dev_mode`):** Summary table (`Validation Status`: always `"Not validated in SxS"`) and surgical `Before -> After` LookML diffs, each with an explicit **`[LookML Safety & Impact Check]`**.
4. **Interactive Authorization Menu:** Present the 5 execution options from [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md) (**Execute Plan A Only**, **Execute Plan B Only in `dev_mode`**, **Execute Both Plan A & Plan B**, **Test Plan A First on `[TMP-SXS-EVAL]`**, or **Customize / Export Inline Only**).

### Step 7: Execute Authorized Plan(s) & Rollback Safety
Upon explicit user selection in Step 6, execute the authorized plan(s) following [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md):
1. **If Plan A is authorized:** Execute atomically in one `set -euo pipefail` CLI invocation—save and verify `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` (or inline), register/sync approved `query`-verified golden queries (`query_url` + `create_golden_query` / `delete_golden_query`), patch approved `A1..An` fields via `update_agent` (`PATCH /api/4.0/agents/{id}`), and print a complete rollback command (including recreating any deleted Golden Queries from `backup["golden_queries"]`).
2. **If Plan B is authorized:** Enable `dev_mode` (`{"devMode": true}`), read each target file via `get_project_file` (targeting `views/refined/` when refinements exist), apply surgical `B1..Bn` additions via `update_project_file` preserving all unrelated fields/comments, verify `0` errors via `validate_project` (auto-reverting on any error), export `/tmp/ca_lookml_patch_<agent_id>.diff` (or inline) + handoff note, and never auto-commit to production.
