---
name: looker-ca-agent-create
description: >-
  Builds and deploys Looker Conversational Analytics (CA) Standalone Agents and
  Dashboard Agents from scratch. Use when asked to create, build, scaffold, or
  deploy a new Looker CA or Dashboard agent. Checks existing CA agents first to
  avoid duplicates, profiles live LookML and Explore data, creates the agent
  automatically by default with verified sample questions, and offers optional
  LookML description and label improvements afterward. Do not use for optimizing
  or evaluating an existing CA agent (use looker-ca-agent-optimize) or tuning
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

This skill checks whether a suitable Conversational Analytics (CA) agent already exists on your Looker instance, and when a new one is needed, designs, validates against live data, and **deploys a production-ready Standalone Agent or Dashboard Agent directly by default**, followed by a simple optional **Yes / No** offer to enrich missing LookML descriptions and labels.

Verify tool availability passively: if Looker MCP is unavailable, ask the user to install `looker-base` first. On MCP-only hosts without `looker-cli`, run discovery, data verification, and optional `dev_mode` LookML updates via Looker MCP and provide the ready-to-import agent configuration cleanly.

---

## Behavioral Guardrails (Mandatory)

1. **Concise, Business-Friendly UX (Zero Technical Walls or `Plan A / Plan B` Jargon):** Keep user-facing messages concise (`~10-15` lines) and written in plain business language. Never use `"Plan A"` / `"Plan B"` labels, multi-option technical menus, or dump raw XML/YAML code blocks, `/x/<slug>` internals, or `.lkml` diffs into chat unless the user explicitly asks to inspect technical details.
2. **Check Existing Agents First, Create by Default, Ask Yes/No for LookML Last:**
   - **Gate #1 (Step 1):** Always check existing CA agents on the instance first; if a similar agent exists, summarize who it serves, its description, and its instructions in plain language and ask if the user wants to use it or continue creating a new one. Ask only concise scoping questions if required inputs are missing.
   - **Default Creation (Steps 2-4):** Once Gate #1 is confirmed, inspect LookML + live data, verify sample Golden Queries, and **create the CA Agent automatically by default** without stopping beforehand for pre-deployment approval menus (unless the user explicitly asked for a dry-run preview without creating).
   - **Gate #2 (Step 5):** Confirm the newly created agent (Name, ID, link, plain-language summary, and sample questions), then ask a single **Yes / No** question offering to fix any missing LookML `description:` or `label:` fields in `dev_mode`.
3. **100% Technical Rigor Under the Hood & Refinement Safety:** Internally enforce all standards in [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md): read `.model.lkml` and core `.view.lkml` files (`raw/` and `refined/`) in parallel to understand SQL formulas and joins, profile real data via `query`, verify `3-5` Golden Queries via `query` before `query_url`, enforce 4-part XML/YAML (`<= 4,800` chars, `"-NULL"`, `"30 days ago for 30 days"`, `code_interpreter: false`) validated inside the single Step 4 deployment command (never spawn separate mid-workflow Python scripts), and apply approved LookML edits surgically in `dev_mode` with `0` errors on `validate_project` and zero auto-commits to production.
4. **Fail-Fast on Auth / `403` Errors & Zero CLI Discovery Loops:** Never run `looker-cli --help` or `session login`/`logout` loops. Halt immediately on `403 Forbidden`, repeated `401`, or `400 invalid_grant` per [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 4 and report the missing permission or credential refresh needed.

---

## Five-Step `build_agent` Workflow

### Step 1: Check Existing Agents & Confirm Scope *(Human Gate #1)*
Follow [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md):
1. **Check Existing Agents on the Instance First:** Run `looker-cli api conversationalanalytics search_agents --limit 50` and `search_agents --category "dashboard" --limit 50` (filtering out `"deleted": true`; or MCP `system__activity.agent` fallback when `looker-cli` is absent; skip only in offline fixtures). If one or more similar agents match the user's topic, model, Explore, or Dashboard, present a concise plain-language summary (**Name**, **Target Audience**, **Description**, and **Key Instruction Rules**) and ask whether that existing agent works for them or if they still want to create a new one.
2. **Collect Missing Scoping Inputs Plainly:** Ensure **Goal / Target Audience**, **Agent Type** (`Standalone Agent` vs. `Dashboard Agent`), and **Dashboard URL/ID/Title** (if Dashboard Agent; Standalone Explores can be auto-discovered in Step 2 if omitted) are clear—asking concise, jargon-free questions at Gate #1 if any are missing (and when no live Looker connection exists, pause immediately at Gate #1 without running any `run_command`/`ls` shell calls).

### Step 2: Parallel LookML & Live Data Profiling
Execute two fast parallel MCP batches (`<= 8` calls/batch) per [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md):
1. **Batch 1:** Resolve `get_models` (for `project_id` and candidate models) / `get_explores` (or `get_dashboard` for Dashboard Agents) first when needed, then fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in parallel (noting any exposed fields missing `description:` or clear `label:` for Step 5).
2. **Batch 2:** Read `.model.lkml` / `.explore.lkml` and core Explore `.view.lkml` files (`views/refined/` and joined views) via `get_project_file` alongside `get_field_value_suggestions` and `1-2` exploratory `query` calls (date coverage, row counts, top categories) to ground the agent in real SQL semantics and live data.

### Step 3: Author Agent Specification & Verify Golden Queries
1. Draft the agent's business-friendly `"name"`, `"description"`, `"sources"` (`"category": "dashboard"` and `"name": "<instance_origin>-<dashboard_id>"` for live Dashboard Agents), `"code_interpreter": false`, and internal 4-part XML/YAML `context.instructions` (`<= 4,800` chars) per [system_instructions_template.md](references/system_instructions_template.md).
2. For **Standalone Agents**, formulate **`3 to 5` Seed Golden Queries** and verify all of them via one parallel Looker MCP `query` batch (`0` SQL errors, `> 0` rows, repairing any filter/partition issue) **before** generating `/x/<slug>` URLs in one parallel `query_url` batch per [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md).

### Step 4: Default Atomic Agent Creation
Execute one self-contained atomic command (`set -euo pipefail` / heredoc) per [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) that validates strict XML 1.0 + `len <= 4800`, registers the `3-5` verified Golden Queries (`create_golden_query -`), creates or binds the CA Agent (`create_agent -` or `update_agent "<existing_dashboard_agent_id>" -`), and saves `/tmp/ca_agent_created_<id>.json` (when local writes are available).

### Step 5: Concise Confirmation & Optional LookML Gate *(Human Gate #2 — Yes / No)*
1. Present a crisp, jargon-free confirmation (`~10-15` lines) showing the created **Agent Name**, **Agent ID**, **Looker URL**, **Description & Audience**, **Key Rules**, and **Sample Questions**.
2. If Step 2 spotted missing LookML `description:` or `label:` metadata on important fields, ask a single simple question: whether the user also wants those LookML improvements applied in development mode (**Yes / No**). Only if the user replies **Yes**, enable `dev_mode` (`{"devMode": true}`), apply surgical additive edits via `get_project_file` + `update_project_file` (targeting `views/refined/` when present), confirm `0` errors via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<id>.diff` (when local writes are available), and confirm briefly.
