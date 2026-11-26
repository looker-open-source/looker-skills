# Standalone Agent Pre-Flight, Gate #1 Scoping & Parallel Profiling

## 1. Standalone Agent Scope & Step 1 Pre-Flight *(Human Gate #1 — Lines 1-25)*

- **Grounding:** `1-5` curated LookML Explores via `"sources": [{"model": "...", "explore": "..."}]` (advise against uncurated mega-explores with `> 15` joined views).
- **Golden Queries (`golden_query_ids`):** `3-5` verified seed queries (`< 20` cap, 1 question per entry).
- **Access & Sharing:** Creator-private by default (`content_metadata_id` supports optional Group `View` share at Gate #2).

### A. Single-Turn Parallel Pre-Flight: Caller Permissions, Existing Agents & Models
Execute existing-agent checks, explicit `develop` permission verification, and candidate model discovery in **one parallel tool turn** (when live Looker CLI/MCP sessions are available):
1. **Concurrent Python Pre-Flight (`~2s`, Zero Raw JSON Dump):**
   - When `looker-cli` is available, run one `python3 - <<'PY'` script using `concurrent.futures.ThreadPoolExecutor(max_workers=2)` to execute: (a) `looker-cli api conversationalanalytics search_agents --limit 50` (parsing `"can": {"create", "update", "share", "chat"}` and filtering out `"deleted": true` in memory), and (b) `looker-cli api user me --fields "id,role_ids"` followed by `looker-cli api user user_roles <id> --fields "permission_set(permissions),model_set(models,all_access)"` to record which models grant the **`develop`** permission (`has_develop_permission = true` only when `"develop"` is in a role covering the target model or `all_access == true`; default `has_develop_permission = false` if `user_roles` returns `403`).
   - On MCP-only hosts without `looker-cli`, default `has_develop_permission = false` and run Looker MCP `query` (`model: "system__activity"`, `explore: "agent"`, `fields: ["agent.guid", "agent.name", "agent.description", "agent.category"]`).
   - In the **same parallel tool turn**, call Looker MCP `get_models` so candidate Explores are ready before Gate #1.
2. **Viewer Permission Pre-Flight (`can.create == false` / `403`):**
   - If `can.create == false` (Viewer lacking `save_agents`), halt before Step 2. Explain that creating a CA agent requires the **Conversational Analytics Agent Manager** role (`save_agents` permission on the model) and list existing agents where `can.chat == true`.
3. **Duplicate / Similar Agent Check:**
   - If one or more non-deleted agents match the user's topic, model, or Explore, pause at Gate #1, present a concise plain-language summary (**Agent Name & Link**, **Target Audience**, **Description & Data Scope**, and **2-3 key behavior rules**), and ask whether to use/optimize that existing agent or create a new one.

### B. Mandatory Gate #1 Scoping Pause (Never Auto-Confirm Assistant Suggestions)
**Assistant suggestions from a prior inventory or brainstorming turn NEVER count as user-confirmed scoping.** Unless the user's own prompt explicitly states `"Gate #1 is already confirmed"` or specifies both **(1) Target Model / Explores** and **(2) Target Audience & Core Questions**, **pause at Gate #1** and ask the user to confirm:
- **Target Explores *(Required)*:** Which `1-5` LookML Explores should ground the Standalone Agent.
- **Purpose & Target Audience *(Required)*:** Who will use the agent and what core business questions it should prioritize (you may propose a tailored default scope they can confirm in one reply).
- **Default Business Preferences *(Optional)*:** Preferred default date window, entity/origin filter, or Top-N limit.

---

## 2. Step 2: Standalone Agent Parallel Profiling *(Lines 28-37)*

Once Gate #1 is confirmed, execute two parallel Looker MCP batches (`<= 8` calls/batch):
1. **Batch 1 — Compiled Schema & Project File Index:**
   - Call `get_explores(model)` first only if target Explores are not yet resolved from Step 1 `get_models`.
   - In one parallel batch, call `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_explore(model, explore)`, and `get_project_files(project_id)`. Call `get_explore` for **every role** (`~235` bytes) so Explore-level `always_filter` and `conditionally_filter` are known before any Batch 2 exploratory `query`. Track exposed fields missing `description:` or clear `label:` for Step 5.
   - **Separate Read (`can_read_lookml`) vs. Write (`has_develop_permission`):** Set `can_read_lookml = true` if `get_project_files` returns files (`false` on `403`/empty, falling back to Batch 1 `get_explore` filters instead of `.lkml` reads). Because `get_project_files` only requires `see_lookml`, never use it to set `has_develop_permission = true`; keep `has_develop_permission` strictly from the Step 1 `user_roles` `"develop"` check.
2. **Batch 2 — Core `.lkml` Semantics + Live Data Profiling (`<= 8` Calls):**
   - When `can_read_lookml == true`, read `.model.lkml` / `.explore.lkml` and core `.view.lkml` files (`views/refined/` and `views/raw/`) via `get_project_file` (following [lookml-ca-modeling-standards.md](lookml-ca-modeling-standards.md) `Lines 1-18`) to check `join:` cardinality, `sql:` measure formulas (`type: sum` density fractions vs. `type: average`), currency normalization, `always_filter` / `sql_always_where`, `filter_only` parameters, and **Liquid SQL guards** (`{% if view.field._is_filtered == false %} ERROR('ERROR NEED FILTER BY ...') {% endif %}`).
   - In parallel, run `get_field_value_suggestions` on key categorical dimensions and **`1-2` exploratory `query` calls** (date range `MIN`/`MAX`, row counts, top categories), always including the `always_filter` / `conditionally_filter` values from Batch 1 `get_explore`. If a query still fails with a Liquid guard error (e.g., `ERROR NEED FILTER BY ORIGIN`), add the named filter and retry once.
