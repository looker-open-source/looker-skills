# Looker Conversational Analytics (CA) Best Practices

This shared reference defines the internal grounding, API 4.0 schema, caller permission matrix, System Activity telemetry queries, Looker MCP filter/output contracts, and CLI execution standards enforced under the hood by `looker-ca-agent-create` and `looker-ca-agent-optimize` for Standalone Agents and Dashboard Agents.

> **User-Facing Communication Rule:** Apply all technical rules below internally so generated agents are production-grade, fast, and accurate, **without exposing raw YAML/XML blocks, API paths, `/x/<slug>` internals, or `"Plan A / Plan B"` jargon to the end user** unless they explicitly ask for technical details (or in MCP-only fallback mode without `looker-cli`).

---

## 1. Four-Part System Instructions Structure (Human-Readable YAML / Markdown)

System instructions (`context.instructions` in Looker API 4.0) are displayed directly as plain text in the Looker UI (**Edit Agent -> Instructions**) and forwarded to the Conversational Analytics API (`system_instruction`). Never write unstructured plain-text paragraphs, and **never use XML wrapper tags (`<agent_instructions>`) or HTML/XML entity escaping (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`)**. Always use natural, human-readable symbols (`&`, `<`, `>`, `>=`, `<=`) inside a clean **4-part root-level YAML / Markdown structure** (**drafting target: `3,200 - 4,200` characters / `~55-70` lines**; **hard cap: `<= 4,800` characters** / `< 1,200` tokens; place `role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, and `presentation_and_analysis_rules:` at column 0 without an outer `agent_instructions:` wrapper key). Validate `len() <= 4800`, absence of `&amp;`/`&lt;`/`&gt;` and tabs (`\t`), presence of all 4 sections, and valid YAML syntax **once inside the single final atomic deployment script**—never spawn separate mid-workflow Python scripts just to count characters or test syntax:

1. **Role & Tone (`role_and_tone:`):**
   - Define a clear persona, target audience, dataset date coverage, and strict domain boundary grounded in the attached Explores or Dashboard.
   - Prohibit fabricating metrics or extrapolating outside Looker query results.
2. **Explore & Filtering Rules (`explore_and_filtering_rules:`):**
   - Route question topics explicitly to designated Explores when multiple Explores are attached, and document any BigQuery partition/join guardrails discovered in `.lkml`.
   - Define conditional default date filters (applying a default window only to undated general trend/Top-N queries while exempting dataset-overview, lifetime, and specific entity/ID lookups so the agent never enters `0-row` Data-Hunting loops).
   - **Valid Looker Complete-Day Date Filter Syntax (`"30 days ago for 30 days"`):** Express complete-day windows as **`"30 days ago for 30 days"`** (or `"90 days ago for 90 days"`, `"7 days ago for 7 days"`, `"last 1 month"`). Passing `"last 30 complete days"` in a Looker `filters` map fails with **`HTTP 400 Invalid date filter syntax`** (and bare `"7 days"` includes today's partial day rather than 7 complete prior days).
   - Inline verified categorical filter value mappings sampled from live data so the agent skips Field-Sampling loops.
   - **Looker Native String Null-Exclusion Syntax (`"-NULL"` Everywhere, Never `"not null"`):** On `type: string` dimensions, Looker treats `"not null"` as literal text `= 'not null'` (`0 rows`). Always use **`"-NULL"`** (or **`"-NULL,-EMPTY"`**).
3. **Semantic Layer & Execution Rules (`semantic_and_execution_rules:`):**
   - Disambiguate closely named measures, dimensions, currency fields, and `filter_only` parameters discovered in `.lkml` and live queries.
   - Enforce single-query consolidation: retrieve all required dimensions, measures, and period comparisons in a single Looker query rather than stacking exploratory queries.
4. **Presentation & Analysis Rules (`presentation_and_analysis_rules:`):**
   - Specify default grouping granularities, Top-N limits/sorts, and currency/percentage formatting.

---

## 2. Standalone vs. Dashboard Agent API 4.0 Grounding, Least Privilege & Permissions

- **Looker API 4.0 `Agent` / `WriteAgent` Schema (`POST /api/4.0/agents` & `PATCH /api/4.0/agents/{id}`):**
  - Mandatory non-nullable fields on `create_agent`: `"name"` (string), `"description"` (string), and `"sources"` (`[{"model": "<model_name>", "explore": "<explore_name>"}]`). Looker API 4.0 defines **no `dashboard_id` field** on `Agent` or `WriteAgent`.
  - **Standalone Agents:** Ground on `1 to 5` curated Explores in `"sources"` (advise against uncurated mega-explores with `> 15` joined views, recommending curated Explores or LookML `fields:` / `hidden: yes` scoping instead), omit `"category"` (or use `"conversation"`), and link `3 to 15` verified Golden Queries via `"golden_query_ids": [<int_id_1>, ...]`.
  - **Dashboard Agents (`"category": "dashboard"` & Native Looker Core Panel Binding):**
    - Set `"category": "dashboard"`, populate `"sources"` from the dashboard tiles' backing `{"model": "...", "explore": "..."}` targets via Looker MCP `get_dashboard`, **omit `"golden_query_ids"`** (dashboard tiles act as grounded exemplars), and encode dashboard filter inheritance plus tile-to-measure mappings inside `context.instructions`.
    - **Native Panel Naming & `HTTP 404` Quirk:** Live Looker instances bind the native Dashboard CA panel strictly to `"name": "<instance_origin>-<dashboard_id>"` and hide `"category": "dashboard"` agents from `/conversations`. `GET /api/4.0/agents/{id}` (`get_agent "<id>"`) returns **`HTTP 404 Not Found`** on `"category": "dashboard"` agents—always inspect, list, and back up Dashboard Agents via `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50`, updating any existing `<instance_origin>-<dashboard_id>` record via `update_agent "<id>" -` (explicitly preserving `"name"`, `"category": "dashboard"`, `"description"`, and `"sources"` while omitting `"golden_query_ids"`) rather than creating duplicates.
- **Role-Based Permission Pre-Flight Matrix (Viewer vs. Agent Creator vs. Developer vs. Admin):**
  - **Viewer (`can.create == false` / `can.update == false`, lacks `save_agents`):** Cannot create or edit agents. In `create`, inform them immediately in Step 1 that they need the *Conversational Analytics Agent Manager* role (`save_agents` permission on the model) and list existing agents they can already chat with (`can.chat == true`). In `optimize`, offer a **read-only diagnostic summary** to share with the agent owner or Admin instead of attempting writes.
  - **Agent Creator / Business Analyst (has `save_agents`, lacks `develop`):** Can create, edit, and share agents, but cannot read `.lkml` project files (`get_project_file` returns `403` or empty) or use `dev_mode`. Skip `.lkml` file reads gracefully (relying on `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `query`), and at the final LookML step provide a **copy-ready Developer Handoff note** (`description:` / `label:` suggestions to send to a LookML Developer) instead of offering `dev_mode` edits.
  - **LookML Developer (has `save_agents` + `develop`):** Full access to `.lkml` inspection, agent creation/optimization (including `"is_lookml": true` agents via `lookml_edit_uri`), and optional `dev_mode` LookML updates.
  - **Looker Admin (or role with `see_system_activity`):** In `optimize`, also query `model: "system__activity"` (`explore: "conversations_feedback"` and `explore: "history"` filtered by `query_api_client_context.name: "Conversational Analytics"`) to diagnose real user `Thumbs down` feedback, `Timeout`/`Error` turns, slow SQL queries, and token usage (falling back cleanly if `0` rows exist). If the caller lacks `see_system_activity`, show a brief one-line tip recommending Admin execution for System Activity telemetry, and continue without blocking.
- **Default Least-Privilege Access & Optional Group Sharing (`content_metadata_id`):**
  - Newly created Standalone Agents default to **least-privilege access** (private to the creator with `Manage Access, Edit`). Confirm this explicitly upon creation and offer an optional **Sharing Wizard** step to grant `View` (chat-only) access to selected Looker user groups (`looker-cli api group all_groups` + `looker-cli api content create_content_metadata_access -` with `{"content_metadata_id": "<id>", "group_id": "<gid>", "permission_type": "view"}`), keeping `Edit` restricted to the creator/admins.
- **Avoid Duplicate Context & Default `code_interpreter: false`:** LookML field `description:` metadata and Golden Queries are injected automatically; never dump raw field catalogs inside `context.instructions`. Default to `"code_interpreter": false` (saving `+15s to +20s` per turn from `python_and_chart_agent`); enable `true` only when Python statistical modeling or forecasting is explicitly required.

---

## 3. Golden Query Curation, MCP `filters` Contract & API 4.0 Registration

- **Quantity Cap (`< 20` Total) & Anti-Overfitting (`<= 50%` Overlap):** Maintain `3 to 5` high-value seed Golden Queries when creating an agent (`< 20` total cap, `<= 50%` overlap with any evaluation suite).
- **Mandatory Looker MCP `query` & `query_url` Input Contract:**
  - `filters` **MUST** be a flat JSON object map of bare `"view.field": "filter_expression"` strings (never `"filters": null`, never an array, never bracketed `"f[view.field]"` keys).
  - `limit` **MUST** be an integer (e.g., `10` or `500`), never a string.
  - **Execute `query` Before `query_url`:** Verify every candidate Golden Query via Looker MCP `query` first (`0` SQL errors, `> 0` sane rows). Only after `query` succeeds, call `query_url` to obtain its `/x/<slug>` short link.
- **API 4.0 `WriteGoldenQuery` Contract (`POST /api/4.0/golden_queries` & `PATCH /api/4.0/golden_queries/{id}`):**
  - Payload: `{"questions": ["<single_natural_language_question>"], "answer": "https://<looker_host>/x/<22_char_slug>"}` (**1 question per entry**, full `/x/<slug>` URL from `query_url` `.url`; omit read-only `is_active`). Update existing Golden Queries in place via `update_golden_query "<gq_id>" -` (`PATCH`) to keep IDs stable, and use `create_golden_query -` (`POST`) for net-new entries.

---

## 4. Parallel Execution, Atomic CLI Deployment & Auth Fail-Fast

1. **Capped Parallel Looker MCP Batches (`<= 8` Calls/Turn, JSONL Output):**
   - Never call `get_explore` on top of `get_dimensions` + `get_measures`. Keep parallel MCP `query` / `query_url` / `get_project_file` batches to **`<= 8` calls per turn** so the MCP transport never drops responses (`EOF`).
2. **Single Atomic `looker-cli` Deployment (Zero Mid-Workflow Python Scripts):**
   - Never run exploratory `looker-cli --help` chains. Pipe JSON via quoted heredocs (`cat <<'EOF'`) or run one self-contained `python3 - <<'PY'` deployment block that validates human-readable YAML (`<= 4,800` chars, zero `&amp;`/`&lt;`/`&gt;`), registers Golden Queries, creates/updates the agent, and saves `/tmp/` backup/snapshot JSON (wrapped in `try/except OSError` for read-only containers) in **one single command**:
     - List all agents (for duplicate/similarity check, `can` permission check & Dashboard lookup): `looker-cli api conversationalanalytics search_agents --limit 50` (Standalone) and `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50` (Dashboard; both return `id`, `name`, `description`, `sources`, `context.instructions`, `golden_queries`, `can`, `content_metadata_id`, `is_lookml`, `lookml_agent_id`, `lookml_edit_uri`, and `deleted` inline).
     - Single agent / writes: `get_agent "<id>"`, `create_agent -`, `update_agent "<id>" -`, `delete_agent "<id>"`, `create_golden_query -`, `update_golden_query "<gq_id>" -`, `delete_golden_query "<gq_id>"`.
     - Live evaluation (`Advanced` / `Hard` mode): `create_conversation -` (`{"agent_id": "<id>", "name": "<name>"}`), `conversational_analytics_chat -` (`{"conversation_id": "<conv_id>", "user_message": "<question>"}`).
     - **Two-Step Soft+Hard Cleanup:** Run `update_conversation "<conv_id>" -` with `{"deleted": true}` then `delete_conversation "<conv_id>"`, and for `[TMP-SXS-EVAL]` agents run `update_agent "<temp_id>" -` with `{"deleted": true}` then `delete_agent "<temp_id>"` so zero test clutter remains in Looker's `Recent` sidebar.
3. **Authentication & Permission Fail-Fast Protocol:**
   - **`403 Forbidden`:** Never fabricate schema metadata; adapt gracefully per the Role-Based Permission Matrix in Section 2 (offering Viewer guidance or Developer Handoff notes when appropriate).
   - **Looker MCP `401` / `oauth2` & `looker-cli` `400 invalid_grant` / `404 login`:** Try at most **1** `get_models` re-handshake; never loop on `session login`/`logout`. If credentials fail or return `404` on `/login`, halt immediately and ask the user to refresh their Looker API 4.0 credentials (`looker-cli profile add default --host "$LOOKER_HOST" --port 443 ...`, never `--base-url`) per `authenticating-looker-cli`.
