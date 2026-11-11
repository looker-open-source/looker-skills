# Standalone Agents vs. Dashboard Agents: Permission Pre-Flight, Discovery & Inspection

This reference defines Step 1 (Caller Permission Pre-Flight, Existing Agent Discovery, Auto-Dashboard Listing & Gate #1 Scoping) and Step 2 (Parallel LookML & Live Data Inspection) for `looker-ca-agent-create`.

---

## 1. Architectural Comparison (Internal API 4.0 Mapping)

| Attribute | Standalone Agent | Dashboard Agent |
| :--- | :--- | :--- |
| **When to Choose** | Open-ended Q&A across 1 to 5 LookML Explores | Guided Q&A inside Looker's native Dashboard CA panel |
| **API 4.0 Grounding Fields** | `"sources": [{"model": "...", "explore": "..."}]` | `"category": "dashboard"` + `"name": "<instance_origin>-<dashboard_id>"` + `"sources"` from tile Explores |
| **Golden Queries (`golden_query_ids`)** | `3-5` verified seed queries (`< 20` cap, 1 question/entry) | Omitted (Dashboard tiles act as native exemplars) |
| **`code_interpreter` Default** | `false` (avoids `+15-20s` latency overhead) | `false` |

---

## 2. Step 1: Permission Pre-Flight, Existing Agents Check & Scope *(Human Gate #1)*

### A. Check Caller Permissions & Existing CA Agents on the Instance First
Before creating any new agent, verify that the user has permission to create agents (`save_agents`) and inspect existing CA agents so they do not accidentally duplicate an agent they did not know about:
1. **Fetch Active Agents & Verify `can.create` (1 Fast Read-Only Check):**
   - When `looker-cli` is available, fetch both Standalone and Dashboard agents (filtering out `"deleted": true`) and caller permissions inside a single `python3 - <<'PY'` block using `subprocess.check_output` so large `search_agents` payloads (`100+ KB`) are parsed in memory and never truncated into `.system_generated/steps/*/output.txt` (never use single-line `python3 -c "..."` with escaped quotes):
     - `looker-cli api conversationalanalytics search_agents --limit 50` (returns `id`, `name`, `description`, `sources`, `context.instructions`, and `"can": {"create", "update", "share", "chat"}` inline)
     - `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50` (returns Dashboard agents inline)
     - `looker-cli api user me --fields "id,display_name,email,role_ids,group_ids,can"` (when caller profile details are needed)
   - On MCP-only hosts without `looker-cli`, query Looker MCP `query` (`model: "system__activity"`, `explore: "agent"`, `fields: ["agent.guid", "agent.name", "agent.description", "agent.category", "agent.dashboard_title"]`).
   - *(Offline Fixture Exception: Skip this network check only if the user's prompt provides an offline mock/fixture without a live Looker connection).*
2. **Viewer Permission Pre-Flight (`can.create == false` / `403`):**
   - If the returned `"can"` object shows `"create": false` (or `search_agents` / `create_agent` returns `403 Forbidden` because the caller is a **Viewer** without `save_agents`), halt creation immediately before running data profiling.
   - Politely explain that creating a CA agent requires the **Conversational Analytics Agent Manager** role (`save_agents` permission on the target model), and list the existing agents from `search_agents` where `"can.chat": true` so they can start chatting right away.
3. **Evaluate Similarity & Ask the User in Plain Language:**
   - Compare existing non-deleted agents against the user's requested topic, model, Explore, or Dashboard.
   - **If one or more similar existing agents are found:** Pause at Gate #1, present a concise, non-technical summary of each matching agent (**Agent Name & Link**, **Who It Is For**, **Description & Data Scope**, and **2-3 plain-language bullets on its behavior**), and ask clearly whether **that existing agent already meets their needs** (or if they want to optimize it instead), **or if they still want to continue creating a new agent**.

### B. Concise Scoping Inputs & Automatic Dashboard Listing (Mandatory Gate #1 Pause When Unspecified)
Keep Gate #1 questions short, friendly, and free of Looker API jargon. **CRITICAL RULE: Assistant-generated suggestions from a prior inventory or brainstorming turn NEVER count as user-confirmed scoping.** Unless the user's own prompt explicitly states `"Gate #1 is already confirmed"` or explicitly specifies both **(1) Purpose & Target Audience** and **(2) Agent Type (`Standalone Agent` vs. `Dashboard Agent`)**, you **MUST pause at Gate #1** before running Step 2:
1. **Auto-Check Candidate Dashboards First (`get_dashboards`):** Whenever the user requests an agent for a topic or LookML model without specifying a Dashboard ID or explicitly choosing `Standalone Agent` vs. `Dashboard Agent`, call Looker MCP `get_dashboards` first (never ask the user for a raw Dashboard ID manually). If matching dashboards exist for that topic/model (e.g., `"Core Web Vitals"`), list their titles alongside the candidate Explore(s) in your Gate #1 question.
2. **Ask the User to Confirm the Required Scoping Inputs at Gate #1:**
   - **Agent Type *(Required)*:** Do they want a **`Standalone Agent`** (open-ended exploration across the model's Explore(s)) or a **`Dashboard Agent`** anchored to one of the discovered dashboards?
   - **Purpose & Target Audience *(Required)*:** Who will use this agent (e.g., frontend engineers, product managers, finance analysts) and what core business questions should it prioritize? *(You may suggest a tailored default audience and scope that the user can confirm or adjust in one reply).*
   - **Default Business Preferences *(Optional)*:** Preferred default time window (e.g., latest available month or last 30 complete days), default entity/origin filter, or Top-N limit.

---

## 3. Step 2: Parallel LookML & Live Data Profiling (Adapting to Developer vs. Analyst Roles)

Once the user confirms Gate #1 to create a new agent, execute Step 2 automatically in **two fast parallel MCP batches** (`<= 8` calls per batch, never calling `get_explore`):

### Flow A: Standalone Agent Inspection & Data Profiling
1. **Batch 1 — Compiled Schema & File Index:**
   - Call `get_models` (resolving both candidate models and each model's `project_name` for `project_id`) / `get_explores` first only if `project_id` or target Explores are not yet known.
   - Run `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in **one parallel MCP batch** (never call `get_explore` on top of `get_dimensions` + `get_measures`). Note any key exposed fields missing `description:` or clear `label:` for Step 5, and inspect returned `parameters` / `filters` for required Explore filter parameters.
   - **Non-Developer Graceful Fallback (Caller Lacks `develop` Permission):** If `get_project_files` or `get_project_file` returns `403` / empty because the user is an **Agent Creator / Business Analyst** without LookML `develop` permissions, record `has_develop_permission = false` and continue seamlessly using compiled Explore metadata (`get_dimensions`, `get_measures`, `get_filters`, `get_parameters`) and live `query` profiling without failing.
2. **Batch 2 — Core `.lkml` Semantics + Live Data Queries (`<= 8` Calls):**
   - When `has_develop_permission` is true, read `.model.lkml` / `.explore.lkml` and **core Explore `.view.lkml` files** (`views/refined/` and `views/raw/`) via `get_project_file` to understand `join:` relationships, `sql:` measure formulas (`type: sum` density fractions vs. `type: average`), currency fields, `filter_only` parameters, `always_filter` / `sql_always_where`, and **Liquid SQL guardrails** (`{% if view.field._is_filtered == false %} ERROR('ERROR NEED FILTER BY ...') {% endif %}`).
   - Run `get_field_value_suggestions` on key categorical dimensions plus **`1 to 2` exploratory Looker MCP `query` calls** (checking exact `MIN`/`MAX` date coverage, total row volume, and top categorical values). **Always read `views/refined/*.view.lkml` and `.explore.lkml` before firing unfiltered `query` calls on Explores with mandatory Liquid/SQL guards so exploratory queries include required filter values from the first attempt.**

### Flow B: Dashboard Agent Inspection & Data Profiling
1. Call `get_dashboard` (`dashboard_id`, or resolve by title via `get_dashboards`) to extract dashboard title, default filters, and every query tile's title, `model`, `explore`, `fields`, and `filters`.
2. In parallel, fetch `get_dimensions`, `get_measures`, and (when the caller has `develop` permission) core `.model.lkml` / `.view.lkml` definitions for the backing tile Explores alongside `get_field_value_suggestions` and a quick date-coverage `query` check.
3. Check the Step 1 `search_agents --category "dashboard"` list for any pre-existing auto-created `"name": "<instance_origin>-<dashboard_id>"` record so Step 4 updates it cleanly via `update_agent` instead of creating a duplicate.
