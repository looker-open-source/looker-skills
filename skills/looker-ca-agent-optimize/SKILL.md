---
name: looker-ca-agent-optimize
description: >-
  Audits, troubleshoots, evaluates, and optimizes existing Looker
  Conversational Analytics (CA) Standalone Agents for accuracy and response
  speed. Use when upgrading system instructions, adding or fixing golden
  queries, diagnosing timeouts, wrong answers, or reasoning traces, or running
  static audits or Side-by-Side clone evals on a Standalone CA agent. Don't use
  for creating or setting up a new CA agent (use looker-ca-agent-create),
  dashboard agents (deferred to a follow-up), or tuning LookML SQL/PDTs.
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP and looker-cli v1.2.1+; MCP-only Audit/Fast fallback supported).
metadata:
  version: "0.1.0"
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Optimizer

Audits, benchmarks, and upgrades existing Looker Conversational Analytics (CA) **Standalone Agents** for higher **Accuracy** and faster **Response Speed**. If Looker MCP is unavailable, ask the user to install `looker-base`. On MCP-only hosts without `looker-cli`, accept raw Agent JSON in `Audit` (`Fast`/`Soft`) mode and output the recommended specification.

## Optimization Modes (`Audit` / `Fast` vs. `Optimize` / `Advanced`)

| Mode & Accepted Aliases | Basis & Execution Behavior | Live CA Tokens |
| :--- | :--- | :--- |
| **`Audit` *(Default; aliases: `Fast`, `Soft`)*** | Checks permissions, queries `system__activity` (`conversations_feedback` & `history`) if Admin, audits YAML instructions, `code_interpreter`, Golden Queries, `.lkml` logic, and live data samples against best practices, marks findings `"Not validated"`, and presents ranked recommendations at Gate #2 before applying approved changes. | **`0` live CA tokens** (`~2-3 min`) |
| **`Optimize` *(aliases: `Advanced`, `Hard`)*** | Runs all `Audit` checks **plus** live reasoning-trace diagnostics on `3-5` eval questions (from user Text, `.csv`/`.tsv`, Google Sheets, `system__activity` failures, or Explore), validates fixes Side-by-Side on an isolated `[TMP-SXS-EVAL]` draft clone (max 2 rounds) with guaranteed `try/finally` cleanup, and presents the SxS scorecard at Gate #2 before applying approved changes. | **Uses live CA tokens** (`2` eval runs, `~5-8 min`) |

## Core Guardrails

1. **Concise Business UX & Root-Level YAML:** Keep user messages to `~10-15` lines in plain business language (zero `"Plan A / Plan B"` menus, raw YAML/XML diffs, or `.lkml` blocks unless requested). Author `context.instructions` in **4-part root-level YAML** (`3,200-4,200` chars target, `<= 4,800` cap, natural `&`/`<`/`>` symbols, zero XML tags or `&amp;` entities) per [looker-ca-best-practices.md](references/looker-ca-best-practices.md).
2. **Mandatory Zero-Tool Gate #1 Pause:** If the target agent or mode (`Audit`/`Fast`/`Soft` vs. `Optimize`/`Advanced`/`Hard`) is unspecified, pause immediately at Gate #1 before reading `references/` or running any shell/MCP calls.
3. **Human-in-the-Loop Gate #2 Approval, SxS Cleanup & Rollback Safety:** Never mutate the live target agent before user approval at Gate #2 (unless the user's prompt explicitly requested immediate application). Always purge `[TMP-SXS-EVAL]` conversations and clone agents via two-step soft+hard cleanup and temporary Golden Queries directly via `delete_golden_query` inside `try/finally`. Report the verdict (`Improved` / `Partial` / `No further optimization` / `Audit only`) and Ranked Changes table at Gate #2, save `/tmp/ca_agent_backup_<id>_<ts>.json` before applying approved changes, and gate `dev_mode` LookML edits strictly on `has_develop_permission` (verified via `user_roles`, never inferred from `get_project_files`).
4. **Fail-Fast Auth:** Never loop on `looker-cli --help` or `session login`/`logout`; halt on repeated `401` / `400 invalid_grant` / `404 login`.

## Six-Step Workflow (State Machine)

1. **Step 1 — Confirm Target Agent & Mode *(Human Gate #1)*:** Pause immediately (0 tool calls) if **Target CA Agent** or **Mode** (`Audit` [aliases: `Fast`, `Soft`] vs. `Optimize` [aliases: `Advanced`, `Hard`]) is unconfirmed. In `Optimize` (`Advanced`/`Hard`) mode, accept an optional **Eval Suite** (`question`, `ground_truth`, `issue_description`) via inline text, local `.csv`/`.tsv`, or Google Sheets, or offer to pull from `system__activity` / Explore.
2. **Step 2 — Parallel Agent, Telemetry & Schema Inspection:** Read [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) (`Lines 1-12`). In **Turn 1**, concurrently load the agent via `search_agents --limit 50` / `get_agent`, verify the explicit **`develop`** role permission (`api user me` -> `api user user_roles`), write `/tmp/ca_agent_backup_<id>_<ts>.json`, check `can.update` and `is_lookml`, and run parallel MCP `get_models` + `system__activity` (`conversations_feedback` and `history`). In **Turn 2**, fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_explore` (every role, for `always_filter` / `conditionally_filter`), and `get_project_files` (sets `can_read_lookml = true` on success or `false` on `403`; requires only `see_lookml`, never sets `has_develop_permission`). In **Turn 3**, run `get_field_value_suggestions` + `1-2` exploratory `query` calls that include the Turn 2 mandatory filters, reading core `.lkml` files when `can_read_lookml == true` per [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) (`Lines 1-18`).
3. **Step 3 — Best-Practice Checks & Candidate Drafting *(`Audit` & `Optimize`)*:** Read [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md). Draft upgraded 4-part root-level YAML, disable unnecessary `code_interpreter: true`, and verify candidate Golden Queries via parallel `query` -> `query_url`. **If `Audit` (`Fast`/`Soft`) mode: mark findings `"Not validated"` (or exit early if 0 gaps exist) and jump to Step 5 (Gate #2 Recommendations).**
4. **Step 4 — Baseline Trace Analysis & `[TMP-SXS-EVAL]` SxS Self-Check *(`Optimize` / `Advanced` / `Hard` Only)*:** Read [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) (`Lines 23-32`) and [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md). Run the `3-5` eval questions against Ground Truth `query` results and the current agent, test the draft config without publishing on an isolated `[TMP-SXS-EVAL]` clone (max 2 rounds), and execute `try/finally` cleanup (two-step soft+hard delete for conversations/clone; direct `delete_golden_query` for temporary Golden Queries).
5. **Step 5 — Recommendations, SxS Scorecard & Approval Gate *(Human Gate #2)*:** Follow [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md) (`Lines 18-27`). Present the `~10-15` line summary: **Verdict** (`Improved` / `Partial` / `No further optimization` / `Audit only`), **Ranked Changes Table** (`#`, `Change`, `Type`, `Expected Impact`, `Measured in SxS`), `system__activity` status, and **SxS Scorecard** (in `Optimize` mode, with directional P50/P90 latency and Metric Trade-off Alert if applicable). Ask the user to **Approve all / select changes X-Y / keep printed output only** (unless `can.update == false` [Viewer] or already approved in prompt), alongside a **Yes / No** `dev_mode` LookML question when `has_develop_permission == true` or a **Note for Your LookML Developer** when `false`.
6. **Step 6 — Apply Approved Changes (Atomic Agent Update & Optional `dev_mode` Patch):** Follow [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) (`Lines 14-21`). Once approved, if `can.update == true` and `is_lookml == false`, run one atomic Python command that verifies `/tmp/ca_agent_backup_<id>_<ts>.json`, validates YAML, syncs modified/new Golden Queries concurrently (`update_golden_query` / `create_golden_query` with `created_gq_ids` rollback on failure), calls `update_agent "<id>" -`, and deletes obsolete Golden Queries via `delete_golden_query` only *after* `update_agent` succeeds. If `dev_mode` LookML changes (or `is_lookml == true` agent updates) were approved, read [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) (`Lines 20-28`) and apply the surgical `.lkml` patch (`validate_project` `0` errors, saving `/tmp/ca_lookml_patch_<id>.diff`, never auto-committing to production).

## Task-Gated Reference Routing (Single Contiguous Slices)

| Workflow Step & Mode | Reference File | Contiguous Line Range |
| :--- | :--- | :--- |
| **Steps 2 & 6 (`Audit` / `Fast` / `Soft` Mode): Inspection, Telemetry & Approved Apply** | [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) | `Lines 1-21` |
| **Steps 2, 4 & 6 (`Optimize` / `Advanced` / `Hard` Mode): Full SxS Clone & Cleanup** | [ca_api_and_mcp_workflow.md](references/ca_api_and_mcp_workflow.md) | `Lines 1-32` (full file) |
| **Steps 3 & 5: Upgrade Hierarchy, Verdicts, Ranked Table & Gate #2 Prompt** | [sxs_evaluation_workflow.md](references/sxs_evaluation_workflow.md) | `Lines 1-27` (full file) |
| **Step 4 (`Optimize` / `Advanced` Mode Only): Live Reasoning-Trace Loop Taxonomy** | [reasoning_trace_diagnostics.md](references/reasoning_trace_diagnostics.md) | `Lines 1-29` (never load in `Audit`/`Fast` mode) |
| **Step 3: API 4.0 Schema, Role Matrix & Filter Contracts** | [looker-ca-best-practices.md](references/looker-ca-best-practices.md) | `Lines 1-43` (full file) |
| **Step 2 (`can_read_lookml == true`) / Step 6 (`has_develop_permission == true` + `Yes`)** | [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) | `Lines 1-18` (Step 2) / `Lines 20-28` (Step 6 `Yes` only) |
