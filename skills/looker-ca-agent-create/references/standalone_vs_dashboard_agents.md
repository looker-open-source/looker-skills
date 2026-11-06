# Standalone Agents vs. Dashboard Agents: Existing-Agent Discovery, Scoping & Inspection

This reference defines Step 1 (Existing Similar Agent Discovery & Gate #1 Scoping) and Step 2 (Parallel LookML & Live Data Inspection) for `looker-ca-agent-create`.

---

## 1. Architectural Comparison (Internal API 4.0 Mapping)

| Attribute | Standalone Agent | Dashboard Agent |
| :--- | :--- | :--- |
| **When to Choose** | Open-ended Q&A across 1 to 5 LookML Explores | Guided Q&A inside Looker's native Dashboard CA panel |
| **API 4.0 Grounding Fields** | `"sources": [{"model": "...", "explore": "..."}]` | `"category": "dashboard"` + `"name": "<instance_origin>-<dashboard_id>"` + `"sources"` from tile Explores |
| **Golden Queries (`golden_query_ids`)** | `3-5` verified seed queries (`< 20` cap, 1 question/entry) | Omitted (Dashboard tiles act as native exemplars) |
| **`code_interpreter` Default** | `false` (avoids `+15-20s` latency overhead) | `false` |

---

## 2. Step 1: Check Existing Agents First & Confirm Scope *(Human Gate #1)*

### A. Always Check for Similar Existing CA Agents on the Instance First
Before creating any new agent, inspect the CA agents that already exist on the Looker instance so the user does not accidentally duplicate an existing agent they did not know about:
1. **Fetch Active Agents (1 Fast Read-Only Check):**
   - When `looker-cli` is available, fetch both Standalone and Dashboard agents (filtering out `"deleted": true`):
     - `looker-cli api conversationalanalytics search_agents --limit 50` (returns Standalone agents including `id`, `name`, `description`, `sources`, and `context.instructions` inline)
     - `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50` (returns Dashboard agents inline)
   - On MCP-only hosts without `looker-cli`, query Looker MCP `query` (`model: "system__activity"`, `explore: "agent"`, `fields: ["agent.guid", "agent.name", "agent.description", "agent.category", "agent.dashboard_title"]`).
   - *(Offline Fixture Exception: Skip this network check only if the user's prompt provides an offline mock/fixture without a live Looker connection).*
2. **Evaluate Similarity & Ask the User in Plain Language:**
   - Compare existing non-deleted agents against the user's requested topic, model, Explore, or Dashboard.
   - **If one or more similar existing agents are found:** Pause at Gate #1, present a concise, non-technical summary of each matching agent:
     - **Agent Name** (and ID / Looker link)
     - **Who It Is For (Target Audience):** Extracted from its description and instructions
     - **Description & Data Scope:** Which Explore/Dashboard and business metrics it covers
     - **Summary of Current Instructions:** 2-3 plain-language bullets on how it behaves
     Then ask clearly whether **that existing agent already meets their needs** (or if they want to optimize it instead), **or if they still want to continue creating a new agent** (collecting any missing scoping inputs below in the same prompt).

### B. Concise Scoping Inputs (Ask Plainly Only What Is Missing)
Keep Gate #1 questions short, friendly, and free of Looker API jargon:
1. **Purpose & Target Audience *(Required)*:** Who will use this agent and what business questions should it answer?
2. **Agent Type *(Required)*:** `Standalone Agent` (explore data freely) or `Dashboard Agent` (attached to a specific Looker Dashboard).
3. **Data Target:**
   - For a `Dashboard Agent`: **Dashboard URL, ID, or Title** *(Required)*.
   - For a `Standalone Agent`: **Target Model / Explore(s)** *(Optional—if omitted, auto-discover the best curated 1-5 Explores in Step 2)*.
4. **Default Business Preferences *(Optional)*:** Preferred default time window (e.g., last 30 days), geographic scope, or Top-N limit (offer sensible defaults if unspecified).

---

## 3. Step 2: Parallel LookML & Live Data Profiling (Preserving 100% Agent Quality)

Once Gate #1 is confirmed to create a new agent, execute Step 2 automatically in **two fast parallel MCP batches** (`<= 8` calls per batch) so the agent understands both the LookML business logic and the real underlying data:

### Flow A: Standalone Agent Inspection & Data Profiling
1. **Batch 1 — Compiled Schema & File Index:**
   - Call `get_models` / `get_explores` first only if `project_id` or target Explores are not yet known.
   - Run `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in **one parallel MCP batch** (never call `get_explore` on top of `get_dimensions` + `get_measures`). Note any key exposed fields missing `description:` or clear `label:` for the optional Step 5 Yes/No offer.
2. **Batch 2 — Core `.lkml` Semantics + Live Data Queries (`<= 8` Calls):**
   - Read the `.model.lkml` / `.explore.lkml` file and the **core Explore `.view.lkml` files** (`views/refined/` and primary joined views—skipping unrelated models or dashboards) via `get_project_file` to understand `join:` relationships, `sql:` measure formulas, currency fields, `filter_only` fields, BigQuery partition/regex constraints, and `+view_name` refinements.
   - In the **same parallel batch**, run `get_field_value_suggestions` on key categorical dimensions plus **`1 to 2` exploratory Looker MCP `query` calls** (checking exact `MIN`/`MAX` date coverage, total row volume, and top categorical values) so the agent's description, instructions, and `3-5` Seed Golden Queries reflect real data rather than guesses.

### Flow B: Dashboard Agent Inspection & Data Profiling
1. Call `get_dashboard` (`dashboard_id`, using `get_dashboards` only if searching by title) to extract dashboard title, default filters, and every query tile's title, `model`, `explore`, `fields`, and `filters`.
2. In parallel, fetch `get_dimensions`, `get_measures`, and core `.model.lkml` / `.view.lkml` definitions for the backing tile Explores alongside `get_field_value_suggestions` and a quick date-coverage `query` check.
3. Check the Step 1 `search_agents --category "dashboard"` list for any pre-existing auto-created `"name": "<instance_origin>-<dashboard_id>"` record so Step 4 updates it cleanly via `update_agent` instead of creating a duplicate.
