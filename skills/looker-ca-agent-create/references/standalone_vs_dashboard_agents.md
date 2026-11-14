# Standalone vs. Dashboard Agents: Pre-Flight, Gate #1 Scoping & Parallel Profiling

## 1. Architectural Comparison & Step 1 Pre-Flight *(Human Gate #1 — Lines 1-29)*

| Attribute | Standalone Agent | Dashboard Agent |
| :--- | :--- | :--- |
| **When to Choose** | Open-ended Q&A across `1-5` LookML Explores | Guided Q&A inside Looker's native Dashboard CA panel |
| **API 4.0 Grounding** | `"sources": [{"model": "...", "explore": "..."}]` | `"category": "dashboard"` + `"name": "<instance_origin>-<dashboard_id>"` + tile `"sources"` |
| **Golden Queries (`golden_query_ids`)** | `3-5` verified seed queries (`< 20` cap, 1 question/entry) | Omitted (Dashboard tiles act as native exemplars) |
| **Access & Sharing** | Creator-private (`content_metadata_id` supports Group `View` share) | Inherits folder/content access from parent Looker Dashboard |

### A. Single-Turn Parallel Pre-Flight: Caller Permissions, Existing Agents & Dashboards
Execute existing-agent checks and candidate dashboard/model discovery in **one parallel tool turn** (skip shell/network calls only in offline fixtures):
1. **Concurrent `search_agents` Python Pre-Flight (`~2s`, Zero Raw JSON Dump):**
   - When `looker-cli` is available, run one `python3 - <<'PY'` script using `concurrent.futures.ThreadPoolExecutor(max_workers=2)` to execute `looker-cli api conversationalanalytics search_agents --limit 50` and `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50` in parallel, parsing `"can": {"create", "update", "share", "chat"}` and filtering out `"deleted": true` in memory (never use single-line `python3 -c` or call `looker-cli api user me` unless extra profile fields are needed).
   - On MCP-only hosts without `looker-cli`, run Looker MCP `query` (`model: "system__activity"`, `explore: "agent"`, `fields: ["agent.guid", "agent.name", "agent.description", "agent.category", "agent.dashboard_title"]`).
   - In the **same parallel tool turn**, call Looker MCP `get_models` and `get_dashboards` so candidate Explores and matching Dashboard titles are ready before Gate #1.
2. **Viewer Permission Pre-Flight (`can.create == false` / `403`):**
   - If `can.create == false` (Viewer lacking `save_agents`), halt before Step 2. Explain that creating a CA agent requires the **Conversational Analytics Agent Manager** role (`save_agents` permission on the model) and list existing agents where `can.chat == true`.
3. **Duplicate / Similar Agent Check:**
   - If one or more non-deleted agents match the user's topic, model, Explore, or Dashboard, pause at Gate #1, present a concise plain-language summary (**Agent Name & Link**, **Target Audience**, **Description & Data Scope**, and **2-3 key behavior rules**), and ask whether to use/optimize that existing agent or create a new one.

### B. Mandatory Gate #1 Scoping Pause (Never Auto-Confirm Assistant Suggestions)
**Assistant suggestions from a prior inventory or brainstorming turn NEVER count as user-confirmed scoping.** Unless the user's own prompt explicitly states `"Gate #1 is already confirmed"` or specifies both **(1) Agent Type (`Standalone Agent` vs. `Dashboard Agent`)** and **(2) Target Audience & Core Questions**, **pause at Gate #1** and ask the user to confirm:
- **Agent Type *(Required)*:** **`Standalone Agent`** (across target Explores) vs. **`Dashboard Agent`** (listing matching dashboard titles discovered via `get_dashboards`; never ask the user for a raw Dashboard ID manually).
- **Purpose & Target Audience *(Required)*:** Who will use the agent and what core business questions it should prioritize (you may propose a tailored default scope they can confirm in one reply).
- **Default Business Preferences *(Optional)*:** Preferred default date window, entity/origin filter, or Top-N limit.

---

## 2. Step 2 Flow A: Standalone Agent Parallel Profiling *(Lines 31-42)*

Once Gate #1 is confirmed for a **Standalone Agent**, execute two parallel Looker MCP batches (`<= 8` calls/batch):
1. **Batch 1 — Compiled Schema & Project File Index:**
   - Call `get_explores(model)` first only if target Explores are not yet resolved from Step 1 `get_models`.
   - In one parallel batch, call `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files(project_id)`. Track exposed fields missing `description:` or clear `label:` for Step 5.
   - **Non-Developer Fallback (`403` on `get_project_files`):** If `get_project_files` returns `403` / empty because the caller is an **Agent Creator / Business Analyst** without `develop` permission, set `has_develop_permission = false`. Do not call `get_explore` on top of `get_dimensions` + `get_measures` when `has_develop_permission == true`; however, when `has_develop_permission == false`, call `get_explore(model, explore)` (if available on the MCP server) to inspect Explore-level `always_filter` and `conditionally_filter` (`< 1 KB`).
2. **Batch 2 — Core `.lkml` Semantics + Live Data Profiling (`<= 8` Calls):**
   - When `has_develop_permission == true`, read `.model.lkml` / `.explore.lkml` and core `.view.lkml` files (`views/refined/` and `views/raw/`) via `get_project_file` (following [lookml-ca-modeling-standards.md](lookml-ca-modeling-standards.md) `Lines 1-18`) to check `join:` cardinality, `sql:` measure formulas (`type: sum` density fractions vs. `type: average`), currency normalization, `always_filter` / `sql_always_where`, `filter_only` parameters, and **Liquid SQL guards** (`{% if view.field._is_filtered == false %} ERROR('ERROR NEED FILTER BY ...') {% endif %}`).
   - In parallel, run `get_field_value_suggestions` on key categorical dimensions and **`1-2` exploratory `query` calls** (date range `MIN`/`MAX`, row counts, top categories), always including any required `always_filter` / Liquid parameter filters discovered in `.lkml` or `get_explore`.

---

## 3. Step 2 Flow B: Dashboard Agent Parallel Profiling *(Lines 44-48)*

Once Gate #1 is confirmed for a **Dashboard Agent**, execute two parallel Looker MCP batches (`<= 8` calls/batch):
1. **Batch 1:** Call `get_dashboard(dashboard_id)` (resolved from Step 1 `get_dashboards`) to extract dashboard title, default dashboard filters, and every query tile's title, `model`, `explore`, `fields`, and `filters`, alongside `get_project_files(project_id)` (setting `has_develop_permission = false` on `403`).
2. **Batch 2:** In parallel, fetch `get_dimensions` and `get_measures` for the backing tile Explores, core `.model.lkml` / `.view.lkml` files via `get_project_file` (when `has_develop_permission == true`), `get_field_value_suggestions`, and a quick date-coverage `query` check. Check the Step 1 `search_agents --category "dashboard"` result for any existing `"name": "<instance_origin>-<dashboard_id>"` record so Step 4 updates it via `update_agent` instead of creating a duplicate.
