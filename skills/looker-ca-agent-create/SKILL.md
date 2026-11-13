---
name: looker-ca-agent-create
description: >-
  Creates, configures, and deploys new Looker Conversational Analytics (CA)
  Standalone Agents and Dashboard Agents. Use when building, scaffolding, or
  setting up a new CA agent on LookML Explores or enabling CA on a Looker
  dashboard for the first time. Don't use for auditing, fixing slow or
  inaccurate responses on, adding golden queries to, or evaluating an existing
  CA agent (use looker-ca-agent-optimize), building dashboards, or tuning
  LookML SQL/PDTs.
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP and looker-cli >= 1.2.0; MCP-only fallback supported).
metadata:
  version: "0.1.0"
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Creator

Designs, validates against live Looker data, and deploys production-ready **Standalone Agents** or **Dashboard Agents** with 4-part human-readable YAML instructions and least-privilege access. If Looker MCP is unavailable, ask the user to install `looker-base`. On MCP-only hosts without `looker-cli`, run discovery, query verification, and optional `dev_mode` LookML updates via Looker MCP and output the ready-to-import agent payload.

---

## Core Guardrails

1. **Concise Business UX & Root-Level YAML:** Keep user messages to `~10-15` lines in plain business language (zero `"Plan A / Plan B"` menus, raw YAML/XML dumps, `/x/<slug>` links, or `.lkml` diffs unless requested). Author `context.instructions` in **4-part root-level YAML** (`3,200-4,200` chars target, `<= 4,800` cap, natural `&`/`<`/`>` symbols, zero XML tags or `&amp;` entities) per [looker-ca-best-practices.md](references/looker-ca-best-practices.md).
2. **Mandatory Gate #1 Pre-Flight & Pause:** Check caller permissions (`can.create`) and existing agents in parallel with `get_dashboards` / `get_models` first. Assistant suggestions from a prior inventory turn never count as user confirmation: pause at Gate #1 unless the user explicitly confirmed both **Agent Type (`Standalone` vs. `Dashboard`)** and **Target Audience / Core Questions**.
3. **Default Atomic Deployment & Role-Aware Gate #2:** After Gate #1 confirmation, profile schema/data in parallel, verify Golden Queries via `query` before `query_url`, and deploy automatically in one atomic Python block (zero mid-workflow validation subshells). At Gate #2, confirm least-privilege access, offer optional Group Sharing (`View`) and live smoke testing, and adapt LookML metadata offers to `has_develop_permission`.
4. **Fail-Fast Auth:** Never loop on `looker-cli --help` or `session login`/`logout`; halt on repeated `401` / `400 invalid_grant` / `404 login`.

---

## Five-Step Workflow (State Machine)

1. **Step 1 — Pre-Flight, Duplicate Check & Scope *(Human Gate #1)*:** Read [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) (`Lines 1-29`). In **1 parallel turn**, run the concurrent `search_agents` (`--limit 50` + `--category "dashboard" --limit 50`) Python check alongside MCP `get_models` + `get_dashboards` (skipping shell calls in offline fixtures). Halt with chat-ready agents if `can.create == false`; surface similar existing agents; otherwise list matching dashboards and **pause at Gate #1** to confirm **Agent Type**, **Audience/Goals**, and **Data Target**.
2. **Step 2 — Parallel Schema, LookML & Data Profiling:** Read [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) (`Lines 31-42` for Standalone; `Lines 44-48` for Dashboard). Run two parallel MCP batches (`<= 8` calls/batch): Batch 1 fetches `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files` (+ `get_dashboard` if Dashboard; if `get_project_files` returns `403`, set `has_develop_permission = false` and call `get_explore` if available for `always_filter`); Batch 2 reads core `.lkml` files (when `has_develop_permission == true` per [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) `Lines 1-18`) + `get_field_value_suggestions` + `1-2` exploratory `query` calls.
3. **Step 3 — Author YAML Instructions & Verify Golden Queries:** Read [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [system_instructions_template.md](references/system_instructions_template.md) (`Lines 1-50` for Standalone; `Lines 52-91` for Dashboard). For Standalone Agents, read [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) (`Lines 1-12`), verify `3-5` Seed Golden Queries via one parallel `query` batch (`0` errors, `> 0` rows, matching mandatory YAML filters), then generate `/x/<slug>` links in one parallel `query_url` batch.
4. **Step 4 — Default Atomic Creation:** Read [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) (`Lines 14-26`). Execute one atomic `python3 - <<'PY'` block that validates root-level YAML in memory, registers Golden Queries concurrently via `ThreadPoolExecutor` (`create_golden_query -`), calls `create_agent -` (or `update_agent "<id>" -` if `<instance_origin>-<dashboard_id>` already exists), and saves `/tmp/ca_agent_created_<id>.json`.
5. **Step 5 — Confirmation, Sharing & LookML Gate *(Human Gate #2)*:** Follow [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) (`Lines 28-35`). Present the `~10-15` line summary, confirm Least-Privilege access, offer the Group Sharing Wizard (`View` access on `content_metadata_id` for Standalone Agents) and an optional 1-question live smoke test, and either ask a **Yes / No** `dev_mode` LookML question (if `has_develop_permission == true`; read [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) `Lines 20-28` only if the user answers **Yes**) or provide a **Note for Your LookML Developer** (if `false`).

---

## Task-Gated Reference Routing (Single Contiguous Slices)

| Workflow Step & Branch | Reference File | Contiguous Line Range |
| :--- | :--- | :--- |
| **Step 1: Pre-Flight, Duplicate Check & Gate #1 Scoping** | [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) | `Lines 1-29` |
| **Step 2 (`Standalone Agent`): Parallel Profiling** | [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) | `Lines 31-42` (or `Lines 1-42` with Step 1) |
| **Step 2 (`Dashboard Agent`): Parallel Tile & Explore Profiling** | [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) | `Lines 44-48` |
| **Step 3 (`Standalone Agent`): Root-Level YAML Template** | [system_instructions_template.md](references/system_instructions_template.md) | `Lines 1-50` |
| **Step 3 (`Dashboard Agent`): Root-Level YAML Template** | [system_instructions_template.md](references/system_instructions_template.md) | `Lines 52-91` |
| **Steps 3-5 (`Standalone Agent`): Golden Queries, Atomic Deploy & Gate #2** | [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) | `Lines 1-35` (full file) |
| **Steps 4-5 (`Dashboard Agent`): Atomic Bind & Gate #2** | [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) | `Lines 14-35` |
| **Step 3/4: API 4.0 Schema, Role Matrix & Filter Contracts** | [looker-ca-best-practices.md](references/looker-ca-best-practices.md) | `Lines 1-43` (full file) |
| **Step 2 (`has_develop_permission == true`) / Gate #2 (`Yes`)** | [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) | `Lines 1-18` (Step 2) / `Lines 20-28` (Gate #2 `Yes` only) |
