# Standalone Agents vs. Dashboard Agents: Architecture & Input Validation

This reference defines the architectural differences, input validation rules (Step 1), and Looker MCP discovery workflows (Step 2) for building Looker Conversational Analytics (CA) **Standalone Agents** and **Dashboard Agents**.

---

## 1. Architectural Comparison (Looker API 4.0 `WriteAgent`)

| Attribute | Standalone Agent | Dashboard Agent |
| :--- | :--- | :--- |
| **API 4.0 Grounding Fields** | `"sources": [{"model": "...", "explore": "..."}]` (1 to 5 curated Explores) | `"category": "dashboard"` + `"sources": [{"model": "...", "explore": "..."}]` populated from dashboard tile Explores (no `dashboard_id` field exists on `WriteAgent`) |
| **Mandatory `WriteAgent` Fields** | `"name"`, `"description"`, `"sources"` | `"name"` (`"<instance_origin>-<dashboard_id>"` on live Looker instances so the native Dashboard CA panel binds to it—hidden from `/conversations`; or dashboard title/ID in offline fixtures without an instance URL), `"description"` (referencing dashboard title/ID), `"sources"` |
| **Target Persona** | Domain analysts, business ops, and cross-functional teams asking open-ended questions | Executives, account managers, and stakeholders exploring a curated dashboard |
| **System Instructions (`context.instructions`)** | Cross-Explore routing, semantic metric disambiguation, conditional default date/status filters (`"30 days ago for 30 days"`, `"-NULL"` syntax), and cohort rules | Dashboard tile-to-measure mappings, executive KPI definitions, dashboard default filter inheritance, and drill-down guidance |
| **Golden Queries (`golden_query_ids`)** | **Recommended (`3-5` seed queries, `< 20` cap, 1 question/entry via `POST /api/4.0/golden_queries`)** | **Omitted** (Dashboard tiles natively act as grounded query exemplars) |
| **`code_interpreter` Default** | `false` by default | `false` by default |

---

## 2. Step 1 Input Validation Checklist

If any required input below is missing, halt immediately at Step 1 and ask the user before invoking any Looker MCP tool, inspecting `~/.config/looker-cli/config.yaml`, or running any shell command (including `ls`, `which`, `env`, or `looker-cli`):

1. **Agent Goal / Intent *(Required)*:**
   - Must specify the business domain, target user persona, and primary analytical questions (for example: *"Help regional sales directors analyze pipeline velocity, win rates, and ARR churn"*).
2. **Agent Type *(Required)*:**
   - **`Standalone Agent`:** Flexible ad-hoc querying across 1 to 5 curated LookML Explores independent of a dashboard layout.
   - **`Dashboard Agent`:** Conversational experience anchored to an existing Looker Dashboard and its KPI tiles.
3. **Context & Business Rules *(Optional)*:**
   - Capture fiscal year start month, standard exclusions (`is_test_account = No`, `order_status != 'Cancelled'`), currency conventions, and default time windows (for example, last 30 complete days—always expressed in Looker filter syntax as `"30 days ago for 30 days"`, never literal `"last 30 complete days"`, which fails with `HTTP 400`). If omitted, infer baseline conventions during Step 2 and highlight them for confirmation in Step 5.
4. **Target Explores *(Optional for Standalone Agent)*:**
   - Accept 1 to 5 `model_name.explore_name` targets.
   - **Auto-Discovery Fallback:** If omitted for a `Standalone Agent`, run `get_models` followed by `get_explores` (passing `model`) in Step 2 to rank and select curated Explores matching the Agent Goal.
   - **Mega-Explore Warning:** If an Explore exposes `> 15` joined views or hundreds of uncurated fields, recommend a narrower curated Explore or scoping fields via LookML `fields:` / `hidden: yes`.
5. **Reference Dashboard URL / ID / Slug *(Required for Dashboard Agent)*:**
   - If the user requests a `Dashboard Agent` without providing a dashboard URL, ID, or title/slug, halt immediately at Step 1 and ask for it.

---

## 3. Step 2 LookML & Dashboard Inspection Workflow

Follow the parallel MCP batching and JSONL parsing rules in `looker-ca-best-practices.md` Section 5:

### Flow A: Standalone Agent Discovery
1. Reuse any Explore schema already fetched in the session. Call `get_models` (if `project_id` or target Explores are unknown) and `get_explores` (`model`) when auto-discovering 1-5 curated Explores.
2. Fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in one parallel MCP batch (never calling `get_explore` on top of `get_dimensions` + `get_measures`).
3. In a second parallel batch, read `.model.lkml` / `.view.lkml` files via `get_project_file` (checking `primary_key: yes` on joined views, missing `description:`/`label:`, unhidden technical `_id` keys, and `+view_name` refinements across `raw/` and `refined/`) alongside `get_field_value_suggestions` on categorical filter dimensions.

### Flow B: Dashboard Agent Discovery
1. Call `get_dashboard` (`dashboard_id`) directly when given an ID/slug (use `get_dashboards` only when searching by title to resolve `dashboard_id`).
2. Extract the dashboard title, description, global dashboard filters (`default_value`, `field`), and every query tile's title, `model`, `explore`, `fields`, `filters`, and `sorts` to populate `"sources"` and tile-to-measure mappings.
3. Fetch `get_dimensions` and `get_measures` in parallel on each backing `model.explore` used by the dashboard tiles to identify natural drill-down dimensions and metadata gaps.
4. When `looker-cli` is available on a live instance, run `looker-cli api conversationalanalytics search_agents --category "dashboard"` (`get_agent` returns `HTTP 404` on `"category": "dashboard"`) to check whether Looker Core already auto-created `"name": "<instance_origin>-<dashboard_id>"` so Step 5 updates it via `update_agent` instead of creating an orphaned duplicate.

---

## 4. Formulating the Baseline Eval Dataset (`3-5` Questions)

In Step 2, design **3 to 5 representative evaluation questions** paired with target Ground Truth Looker queries (verified via Looker MCP `query` in Step 4):

| Question Archetype | Purpose | Step 4 Ground Truth Verification |
| :--- | :--- | :--- |
| **1. Headline KPI + Default Filter** | Verifies conditional default time window (`"30 days ago for 30 days"`) and mandatory exclusions (`"-NULL"`) | Run via Looker MCP `query` (bare-key object `filters`, integer `limit`) |
| **2. Dimensional Breakdown / Top-N** | Verifies grouping dimension selection and sorting rules | Confirm `fields`, `sorts`, and `limit` match business expectations |
| **3. Disambiguated Metric / Ratio** | Tests selection between closely named measures (e.g., Gross vs. Net) | Confirm exact measure name from `get_measures` |
| **4. Categorical Value Mapping** | Tests inlined filter synonyms (e.g., `"Enterprise"` to `"ENT_TIER_1"`) | Verify canonical filter string via `get_field_value_suggestions` |
| **5. Multi-View Join or Cohort Filter** | Tests cross-view join integrity and symmetric aggregation | Verify zero fanout errors and valid SQL generation |
