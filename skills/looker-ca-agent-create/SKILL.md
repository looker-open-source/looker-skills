---
name: looker-ca-agent-create
description: >-
  Builds and deploys Looker Conversational Analytics (CA) Standalone Agents and
  Dashboard Agents from scratch. Use when asked to create, build, scaffold, or
  deploy a new Looker CA or Dashboard agent. Checks caller permissions and
  existing CA agents first to avoid duplicates, auto-discovers model dashboards,
  profiles live LookML and Explore data, creates the agent with human-readable
  YAML instructions and default least-privilege access, and offers optional
  group sharing and LookML metadata improvements. Do not use for optimizing or
  evaluating an existing CA agent (use looker-ca-agent-optimize) or tuning
  general LookML SQL, caching, or PDTs (use looker-performance-optimizer).
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP via looker-mcp-skill and looker-cli via installing-looker-cli / authenticating-looker-cli; MCP-only fallback supported).
metadata:
  version: "0.1.0"
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Creator

## Overview

This skill verifies caller permissions, checks whether a suitable Conversational Analytics (CA) agent already exists on your Looker instance, and when a new one is needed, designs, validates against live data, and **deploys a production-ready Standalone Agent or Dashboard Agent directly by default** with human-readable YAML instructions and least-privilege access, followed by optional group sharing (`View` access) and LookML metadata improvements.

Verify tool availability passively: if Looker MCP is unavailable, ask the user to install `looker-base` first. On MCP-only hosts without `looker-cli`, run discovery, data verification, and optional `dev_mode` LookML updates via Looker MCP and provide the ready-to-import agent configuration cleanly.

---

## Behavioral Guardrails (Mandatory)

1. **Concise, Business-Friendly UX & Human-Readable YAML (Zero Technical Walls, XML Tags, or `&amp;` Entities):** Keep user-facing messages concise (`~10-15` lines) in plain business language. Never use `"Plan A"` / `"Plan B"` labels, multi-option technical menus, or dump raw YAML code blocks, `/x/<slug>` internals, or `.lkml` diffs into chat unless requested. Author `context.instructions` in **4-part human-readable YAML** using natural symbols (`&`, `<`, `>`, `>=`, `<=`)—never XML tags (`<agent_instructions>`) or HTML/XML entities (`&amp;`, `&lt;`, `&gt;`).
2. **Permission Pre-Flight, Check Existing Agents First, Auto-List Dashboards, Always Confirm Gate #1 Scope:**
   - **Gate #1 (Step 1):** Check existing CA agents and caller permissions first. If the caller is a **Viewer** (`can.create == false` / lacks `save_agents`), explain that *Conversational Analytics Agent Manager* (`save_agents`) is required and list existing agents they can chat with (`can.chat == true`). If a similar agent already exists, summarize who it serves, its description, and its rules and ask whether to use it or create a new one. **Never treat your own suggestions from a prior inventory/brainstorming turn as user-confirmed scoping:** unless the user's prompt explicitly confirms `Gate #1` or explicitly states both **(a) Agent Type (`Standalone Agent` vs. `Dashboard Agent`)** and **(b) Target Audience / Core Questions**, pause at Gate #1, auto-list any matching dashboards via `get_dashboards`, and ask the user to confirm before running Step 2.
   - **Default Creation (Steps 2-4):** Once Gate #1 scope is confirmed by the user, inspect LookML + live data (gracefully skipping `get_project_file` if the caller lacks `develop` permission), verify sample Golden Queries, and **create the CA Agent automatically by default**.
   - **Gate #2 (Step 5):** Confirm the created agent and its default **Least Privilege** access (private to creator), offer optional **Group Sharing (`View` access)**, and—if missing LookML descriptions/labels were spotted—either ask a **Yes / No** question to apply them in `dev_mode` (when the caller has `develop` permission) or provide a copy-ready **Note for Your LookML Developer** (when the caller lacks `develop`).
3. **100% Technical Rigor Under the Hood & Refinement Safety:** Internally enforce all standards in [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md): read `.model.lkml` and core `.view.lkml` files (`views/refined/` and `views/raw/`) in parallel when `develop` access exists, profile real data via `query`, verify `3-5` Golden Queries via `query` before `query_url`, enforce 4-part root-level human-readable YAML (**drafting target `3,200-4,200` chars**, hard cap `<= 4,800` chars, zero `&amp;`, `"-NULL"`, `"30 days ago for 30 days"`, `code_interpreter: false`) validated inside the single Step 4 deployment command (never spawn separate mid-workflow Python scripts), and apply approved LookML edits surgically in `dev_mode` with `0` errors on `validate_project` and zero auto-commits to production.
4. **Fail-Fast on Auth Errors & Zero CLI Discovery Loops:** Never run `looker-cli --help` or `session login`/`logout` loops. Halt immediately on repeated `401`, `400 invalid_grant`, or `404 login` per [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 4 and report the credential refresh needed.

---

## Five-Step `build_agent` Workflow

### Step 1: Permission Pre-Flight, Check Existing Agents & Confirm Scope *(Human Gate #1)*
Follow [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md):
1. **Check Permissions & Existing Agents First:** Run `looker-cli api conversationalanalytics search_agents --limit 50` and `search_agents --category "dashboard" --limit 50` inside a single `python3 - <<'PY'` summary block (filtering out `"deleted": true`; never dump `100+ KB` raw JSON to stdout or use `python3 -c` with escaped quotes; use MCP `system__activity.agent` fallback when `looker-cli` is absent; skip only in offline fixtures). If `can.create == false` (Viewer without `save_agents`), inform the user and list existing agents where `can.chat == true`. If one or more similar agents match the user's topic, model, Explore, or Dashboard, present a concise plain-language summary (**Name**, **Target Audience**, **Description**, and **Key Instruction Rules**) and ask whether that existing agent works for them or if they still want to create a new one.
2. **Confirm Scoping Inputs & Auto-Discover Dashboards (Mandatory Gate #1 Pause When Unspecified):** Ensure **Goal / Target Audience**, **Agent Type** (`Standalone Agent` vs. `Dashboard Agent`), and **Data Target** are explicitly confirmed by the user. **Assistant-suggested proposals from an earlier inventory turn do NOT count as user confirmation:** if the user only says *"help me create an agent for X"*, call `get_dashboards` to check for matching dashboards, then **pause at Gate #1** and ask the user to confirm (a) **Standalone Agent** (across target Explores) vs. **Dashboard Agent** (listing matching dashboard titles) and (b) **Target Audience & Core Questions** before moving to Step 2. (When no live Looker connection exists, pause immediately at Gate #1 without running any `run_command`/`ls` shell calls).

### Step 2: Parallel LookML & Live Data Profiling
Execute two fast parallel MCP batches (`<= 8` calls/batch, never calling `get_explore`) per [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md):
1. **Batch 1:** Resolve `get_models` (for `project_id` and candidate models) / `get_explores` (or `get_dashboard` / `get_dashboards` for Dashboard Agents) first when needed, then fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in parallel (noting any exposed fields missing `description:` or clear `label:` for Step 5; if `get_project_files` returns `403`/empty because the caller lacks `develop` permission, record `has_develop_permission = false` and continue using compiled Explore metadata).
2. **Batch 2:** Read `.model.lkml` / `.explore.lkml` and core Explore `.view.lkml` files (`views/refined/` and `views/raw/`) via `get_project_file` (when `has_develop_permission` is true) alongside `get_field_value_suggestions` and `1-2` exploratory `query` calls (date coverage, row counts, top categories). **Always check `views/refined/*.view.lkml` and `.explore.lkml` for `always_filter`, `sql_always_where`, `parameter` filters, and Liquid `_is_filtered` / `ERROR('ERROR NEED FILTER BY ...')` SQL guards before firing unfiltered `query` calls.**

### Step 3: Author Agent Specification & Verify Golden Queries
1. Draft the agent's business-friendly `"name"`, `"description"`, `"sources"` (`"category": "dashboard"` and `"name": "<instance_origin>-<dashboard_id>"` for live Dashboard Agents), `"code_interpreter": false`, and internal 4-part root-level human-readable YAML `context.instructions` (**drafting target `3,200-4,200` chars**, hard cap `<= 4,800` chars, top-level keys `role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, `presentation_and_analysis_rules:` with zero root wrapper indent, natural `&`/`<`/`>` symbols, zero `&amp;` or XML tags) per [system_instructions_template.md](references/system_instructions_template.md).
2. For **Standalone Agents**, formulate **`3 to 5` Seed Golden Queries** (ensuring every filter declared mandatory in `mandatory_base_and_null_filters` for an Explore is included in that Explore's Golden Query `filters` map) and verify all of them via one parallel Looker MCP `query` batch (`0` SQL errors, `> 0` rows) **before** generating `/x/<slug>` URLs in one parallel `query_url` batch per [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md).

### Step 4: Default Atomic Agent Creation
Execute one self-contained atomic command (`set -euo pipefail` / heredoc) per [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) that validates human-readable YAML (`len <= 4800`, all 4 sections present, zero `&amp;`/`&lt;`/`&gt;`), registers the `3-5` verified Golden Queries (`create_golden_query -`), creates or binds the CA Agent (`create_agent -` or `update_agent "<existing_dashboard_agent_id>" -`), and saves `/tmp/ca_agent_created_<id>.json` (when local writes are available).

### Step 5: Concise Confirmation, Least-Privilege Sharing & LookML Gate *(Human Gate #2)*
1. Present a crisp, jargon-free confirmation (`~10-15` lines) showing the created **Agent Name**, **Agent ID**, **Looker URL**, **Least-Privilege Access Confirmation** (private to creator by default), **Description & Audience**, **Key Rules**, and **Sample Questions**.
2. Offer optional **Group Sharing (`View` access)** (granting `permission_type: "view"` on `content_metadata_id` via `create_content_metadata_access` if requested) and handle spotted LookML `description:` / `label:` gaps per caller role: if `has_develop_permission` is true, ask a single **Yes / No** question to apply surgical additive edits in `dev_mode` (`validate_project` `0` errors); if `has_develop_permission` is false, provide a concise copy-ready **Note for Your LookML Developer**.

---

## Task-Gated Reference Routing

Load only the reference file (and line range) required for the current step and agent type:

| Task / Step | Reference File to Read | Scope / Line Range |
| :--- | :--- | :--- |
| **Steps 1-2: Pre-Flight, Gate #1 Scoping & Parallel Profiling** | [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) | Lines `1-58` (`Standalone Agent`) or `1-49, 59-62` (`Dashboard Agent`) |
| **Step 3: Authoring `Standalone Agent` YAML Instructions** | [system_instructions_template.md](references/system_instructions_template.md) | Lines `1-59` only (skip Dashboard template) |
| **Step 3: Authoring `Dashboard Agent` YAML Instructions** | [system_instructions_template.md](references/system_instructions_template.md) | Lines `1-8, 60-99` only (skip Standalone template) |
| **Steps 3-5: Golden Queries, Atomic Deployment & Gate #2 Sharing** | [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) | Full file (`53` lines; skip Section 1 for `Dashboard Agent`) |
| **YAML Guardrails, API 4.0 Schema & Auth Fail-Fast** | [looker-ca-best-practices.md](references/looker-ca-best-practices.md) | Read once during Step 3/4 (`73` lines) |
| **Step 2 & Step 5: LookML Refinement Audit & `dev_mode` Edits** | [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md) | Read only when `has_develop_permission` is `true` or generating a Developer Note (`37` lines) |
