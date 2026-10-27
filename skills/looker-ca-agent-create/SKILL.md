---
name: looker-ca-agent-create
description: >-
  Builds and configures brand-new Looker Conversational Analytics (CA)
  Standalone Agents and Dashboard Agents from scratch. Use when the user asks to
  create, scaffold, or design a new Looker CA agent, author initial 4-part
  XML/YAML system instructions, curate seed golden queries, configure Dashboard
  Agent context, or enrich LookML metadata for a new CA agent deployment. Do not
  use for auditing, diagnosing reasoning traces, or running Side-by-Side (SxS)
  optimizations on an existing CA agent (use looker-ca-agent-optimize) or
  optimizing general LookML SQL, caching, or PDT queries (use
  looker-performance-optimizer).
license: Apache-2.0
compatibility: Requires looker-base (Looker MCP via looker-mcp-skill and looker-cli via installing-looker-cli / authenticating-looker-cli; MCP-only fallback supported).
metadata:
  version: 0.1.0
  domain: looker-analytics-agents
  status: preview
  usage-interface: looker-mcp looker-cli
  publisher: google
  shared-refs: looker-ca-best-practices lookml-ca-modeling-standards
---

# Looker Conversational Analytics (CA) Agent Creator

## Overview

This skill designs, validates, and deploys production-ready Looker Conversational Analytics (CA) **Standalone Agents** (Explore-backed) and **Dashboard Agents** (Dashboard-backed) from the ground up using the five-step `build_agent` workflow.

Verify tool availability passively from declared tools: if Looker MCP is unavailable, ask the user to install `looker-base` (`looker-mcp-skill` and `authenticating-looker-cli`) first. In MCP-only cloud or chat environments without `looker-cli` shell access, subagent spawning, or local file writes, execute Steps 1-4 and `Plan B` via Looker MCP and render `Plan A` payloads and LookML diffs inline.

---

## Agent Architecture Matrix

| Dimension | Standalone Agent | Dashboard Agent |
| :--- | :--- | :--- |
| **Grounding Target** | 1 to 5 curated Explores (`sources: [{"model", "explore"}]`) | `"category": "dashboard"` + `"name": "<instance_origin>-<dashboard_id>"` (live native panel) + `sources` from tile Explores |
| **Primary Use Case** | Multi-Explore ad-hoc Q&A and deep domain exploration | Guided Q&A in Looker's native Dashboard CA panel (hidden from `/conversations`) |
| **Golden Queries** | Recommended (`3-5` seed archetypes, `< 20` cap, `golden_query_ids`) | Omitted (Dashboard tiles natively act as grounded query exemplars) |
| **Discovery Path** | `get_models` + `get_explores` if target Explores omitted | `get_dashboard` (`dashboard_id`) or `get_dashboards` title search + `search_agents --category "dashboard"` |

See [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md) for complete schema differences and selection criteria.

---

## Behavioral Guardrails (Mandatory)

1. **Two Human-in-the-Loop Gates Only (Non-Waivable Step 5 Review):** Prompt the user strictly at **Step 1** (Input Validation) and **Step 5** (Interactive Review of **Plan A: New CA Agent Deployment** and **Plan B: LookML `dev_mode` Enrichments**). Execute Steps 2, 3, and 4 automatically. Human Gate #2 (Step 5) cannot be pre-waived in the user's initial prompt (even if asked to `"skip review"` or `"deploy immediately"`).
2. **Zero Hallucinated Schema & Surgical LookML Refinement Safety:** Verify every model, Explore, field, and dashboard via Looker MCP before generating instructions or golden queries. Never mistake **LookML Refinements (`view: +view_name` across `raw/` and `refined/` layers)** for duplicate fields. When patching LookML via `update_project_file`, always read the full file via `get_project_file` first and apply surgical, additive field-level edits—never perform destructive full-file rewrites that strip existing fields, joins, or developer comments.
3. **Safe Deployment & Dev-Branch Isolation:** Never invoke or simulate `POST /api/4.0/agents` (`create_agent`), `PATCH /api/4.0/agents/{id}` (`update_agent`), `POST /api/4.0/golden_queries` (`create_golden_query`), or LookML write tools prior to presenting the full drafted plans in Step 5 and receiving explicit post-review user approval. Apply LookML edits strictly in `dev_mode` (`{"devMode": true}`), confirm `0` compilation errors via `validate_project` (auto-reverting on any error), and never auto-commit to production.
4. **Fail-Fast on Auth / `403` Permission Errors & Zero CLI Discovery Loops:** Never run exploratory `looker-cli --help` chains or loop on authentication failures (`session login`/`logout`). Follow [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 5: on Looker MCP or API `403 Forbidden`, **halt immediately** without inventing model, Explore, or field names and report the missing Looker role, model-set permission, or GCP IAM access; on Looker MCP `401` / `oauth2` errors, try at most **one** `get_models` re-handshake; if it still fails, or if `looker-cli` returns `400 invalid_grant` without `LOOKERSDK_CLIENT_ID`/`LOOKERSDK_CLIENT_SECRET` (or `LOOKER_CLIENT_ID`/`LOOKER_CLIENT_SECRET`) in the environment, **halt immediately** and ask the user to refresh their Looker API 4.0 credentials.

---

## Five-Step `build_agent` Execution Workflow

### Step 1: Validate Inputs *(Human Gate #1)*
If any required input below is missing from the user's prompt, **STOP IMMEDIATELY** and ask the user—never run any shell command (including `ls` even on the skill's own directory, `which`, `env`, or `looker-cli`), inspect `~/.config/looker-cli/config.yaml`, or call any Looker MCP tool during Step 1 (see [standalone_vs_dashboard_agents.md](references/standalone_vs_dashboard_agents.md)):
- **Agent Goal / Intent** *(Required)*: Target persona, business domain, and primary questions the agent must answer.
- **Agent Type** *(Required)*: `Standalone Agent` or `Dashboard Agent`.
- **Context & Business Rules** *(Optional)*: Fiscal calendar conventions, mandatory exclusions, metric disambiguation rules, and default time windows.
- **Target Explores** *(Optional for Standalone Agent)*: Specific `model.explore` targets. If omitted, discover candidate Explores automatically in Step 2.
- **Reference Dashboard URL / ID / Slug** *(Required for Dashboard Agent)*: The target dashboard backing the agent.

### Step 2: Inspect LookML & Determine Eval Dataset
1. **Inspect Semantic Metadata via Parallel Looker MCP Batches:**
   - Reuse any Explore schema or date-coverage context already fetched in the session (see [looker-ca-best-practices.md](references/looker-ca-best-practices.md) Section 5; note multi-record MCP outputs use JSONL).
   - For **Standalone Agents**, run `get_models` (resolving `project_id` if unknown) and `get_explores` when discovery is needed, then fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in one parallel batch (without calling `get_explore`), followed by a parallel batch of `get_project_file` + `get_field_value_suggestions`.
   - For **Dashboard Agents**, call `get_dashboard` (`dashboard_id`, using `get_dashboards` only if searching by title) to extract tile titles, backing `model.explore` targets, default dashboard filters, and KPI definitions, inspect the backing Explores with `get_dimensions` and `get_measures` in parallel, and when `looker-cli` is available check `search_agents --category "dashboard"` (`get_agent` returns `404` on Dashboard Agents) to detect any pre-existing auto-created `<instance_origin>-<dashboard_id>` record.
   - If access is blocked (`403 Forbidden`) or credentials are expired (`401` / `400 invalid_grant`), halt immediately without fabricating schema metadata and report the exact missing Looker role, model-set permission, or Looker API 4.0 credential refresh required.
2. **Establish Baseline Eval Dataset (`3-5` Test Questions):**
   - Formulate **3 to 5 representative natural-language test questions** paired with target Ground Truth Looker query definitions covering core KPIs, time-series breakdowns, and categorical filters (to be verified together with the seed Golden Queries in Step 4).

### Step 3: Develop Agent Configurations (`Plan A` & `Plan B`)
Author the complete agent package adhering to [looker-ca-best-practices.md](references/looker-ca-best-practices.md) and [lookml-ca-modeling-standards.md](references/lookml-ca-modeling-standards.md):
1. **Plan A — CA Agent Package (`A1..A3` — Target: Looker API 4.0 `POST /api/4.0/agents` or `PATCH /api/4.0/agents/{id}`):**
   - **`A1` (Four-Part XML/YAML System Instructions — `context.instructions`):** Draft concise instructions (`< 1,200` tokens / `<= 4,800` chars via `len()`) following [system_instructions_template.md](references/system_instructions_template.md) with explicit `<role_and_tone>`, `<explore_and_filtering_rules>`, `<semantic_and_execution_rules>`, and `<presentation_and_analysis_rules>` blocks (enforcing strict XML 1.0 escaping with `&amp;` and zero raw `<`/`>` inside element bodies). Inline verified filter values, document dataset date coverage and any `filter_only` fields, use valid Looker complete-day date syntax (`"30 days ago for 30 days"`, never `"last 30 complete days"` in Looker filter maps) and native `"-NULL"` string filter syntax (never `"not null"`), and enforce single-query consolidation.
   - **`A2` (Agent Metadata & Settings):** Define mandatory `"name"`, `"description"`, and `"sources": [{"model": "...", "explore": "..."}]` (for Dashboard Agents, set `"category": "dashboard"` and use `"name": "<instance_origin>-<dashboard_id>"` on live instances so the native Dashboard panel binds cleanly—never `"dashboard_id"`), and set `"code_interpreter": false` by default (`true` adds `+15s to +20s` per query via `python_and_chart_agent`).
   - **`A3` (Seed Golden Queries — `Standalone Agent` Only):** Create **3 to 5 seed Golden Queries** (strictly `< 20` total, `<= 50%` overlap with the Step 2 Baseline Eval Dataset) following [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md).
2. **Plan B — Safe LookML Metadata Enrichments (`B1..Bn` — Target: Looker `dev_mode`):** Prepare surgical, additive LookML patches (`description:`, `label:`, `primary_key: yes`, safe `hidden: yes`) targeting `views/refined/` when refinements exist, each with a **`[LookML Safety & Impact Check]`**.

### Step 4: Run Pre-Presentation Quality Checks (Parallel Verification Batching)
1. **Zero Schema Errors & Short URLs:** Consolidate Baseline Eval `query` calls and Standalone Seed Golden Query `query` + `query_url` calls (passing `filters` as a bare-key JSON object map with `"-NULL"` on strings—never `null`—and `limit` as an integer) **into parallel Looker MCP batching** capped at `<= 8` calls per batch (running `query` checks before `query_url` when total calls exceed `8`, omitting `query_url` for Dashboard Agents, and never registering a `query_url` slug whose `query` check failed or returned `0 rows`).
2. **Instructions & LookML Safety Check:** Confirm all four XML/YAML sections are well-formed (strict XML 1.0 escaping, `< 1,200` tokens / `<= 4,800` chars via `len()`, `"-NULL"` syntax, zero raw field dumps, `<= 50%` golden-query overlap) and confirm `Plan B` edits preserve all existing `.view.lkml` fields, joins, and comments.

### Step 5: Interactive Plan Review & Authorized Deployment *(Human Gate #2 — Non-Waivable)*
Always pause here—even if the user's initial prompt asked to `"skip review"` or `"deploy immediately"`—to present the full drafted **Plan A** (`A1..A3` + Baseline Eval pairs) and **Plan B** (`B1..Bn` LookML diffs with `[LookML Safety & Impact Check]`) and wait for explicit post-review user authorization via the 4 execution options in [golden_queries_and_deployment.md](references/golden_queries_and_deployment.md) (**Execute Plan A Only** via one atomic CLI script, **Execute Plan B Only in `dev_mode`**, **Execute Both Plan A & Plan B** in parallel or sequentially, or **Customize / Export Inline Only**).
