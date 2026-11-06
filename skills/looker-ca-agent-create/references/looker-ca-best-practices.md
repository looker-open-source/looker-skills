# Looker Conversational Analytics (CA) Best Practices

This shared reference defines the internal grounding, API 4.0 schema, Looker MCP filter/output contracts, and CLI execution standards enforced under the hood by `looker-ca-agent-create` and `looker-ca-agent-optimize` for Standalone Agents and Dashboard Agents.

> **User-Facing Communication Rule:** Apply all technical rules below internally so generated agents are production-grade, fast, and accurate, **without exposing raw XML/YAML blocks, API paths, `/x/<slug>` internals, or `"Plan A / Plan B"` jargon to the end user** unless they explicitly ask for technical details (or in MCP-only fallback mode without `looker-cli`).

---

## 1. Four-Part System Instructions Structure (Strict XML 1.0 or YAML)

System instructions (`context.instructions` in Looker API 4.0) must never be written as unstructured plain-text paragraphs. Author instructions internally in four explicit sections (wrapped in `<agent_instructions>...</agent_instructions>` in XML mode, or under `agent_instructions:` in YAML mode), keeping total length concise (`< 1,200` tokens, ideally `400-800` tokens; **`<= 4,800` characters**). Validate strict XML 1.0 well-formedness (`xml.etree.ElementTree.fromstring`, escaping `&` as `&amp;` and avoiding raw `<` or `>` inside element bodies) and `len() <= 4800` **once inside the single final atomic deployment script**—never spawn separate mid-workflow Python scripts just to count characters or test XML:

1. **Role & Tone (`<role_and_tone>` / `role_and_tone`):**
   - Define a clear persona, target audience, dataset date coverage, and strict domain boundary grounded in the attached Explores or Dashboard.
   - Prohibit fabricating metrics or extrapolating outside Looker query results.
2. **Explore & Filtering Rules (`<explore_and_filtering_rules>` / `explore_and_filtering_rules`):**
   - Route question topics explicitly to designated Explores when multiple Explores are attached, and document any BigQuery partition/join guardrails discovered in `.lkml`.
   - Define conditional default date filters (applying a default window only to undated general trend/Top-N queries while exempting dataset-overview, lifetime, and specific entity/ID lookups so the agent never enters `0-row` Data-Hunting loops).
   - **Valid Looker Complete-Day Date Filter Syntax (`"30 days ago for 30 days"`):** Express complete-day windows as **`"30 days ago for 30 days"`** (or `"90 days ago for 90 days"`, `"7 days ago for 7 days"`, `"last 1 month"`). Passing `"last 30 complete days"` in a Looker `filters` map fails with **`HTTP 400 Invalid date filter syntax`** (and bare `"7 days"` includes today's partial day rather than 7 complete prior days).
   - Inline verified categorical filter value mappings sampled from live data so the agent skips Field-Sampling loops.
   - **Looker Native String Null-Exclusion Syntax (`"-NULL"` Everywhere, Never `"not null"`):** On `type: string` dimensions, Looker treats `"not null"` as literal text `= 'not null'` (`0 rows`). Always use **`"-NULL"`** (or **`"-NULL,-EMPTY"`**).
3. **Semantic Layer & Execution Rules (`<semantic_and_execution_rules>` / `semantic_and_execution_rules`):**
   - Disambiguate closely named measures, dimensions, currency fields, and `filter_only` parameters discovered in `.lkml` and live queries.
   - Enforce single-query consolidation: retrieve all required dimensions, measures, and period comparisons in a single Looker query rather than stacking exploratory queries.
4. **Presentation & Analysis Rules (`<presentation_and_analysis_rules>` / `presentation_and_analysis_rules`):**
   - Specify default grouping granularities, Top-N limits/sorts, and currency/percentage formatting.

---

## 2. Standalone vs. Dashboard Agent API 4.0 Grounding & Settings

- **Looker API 4.0 `Agent` / `WriteAgent` Schema (`POST /api/4.0/agents` & `PATCH /api/4.0/agents/{id}`):**
  - Mandatory non-nullable fields on `create_agent`: `"name"` (string), `"description"` (string), and `"sources"` (`[{"model": "<model_name>", "explore": "<explore_name>"}]`). Looker API 4.0 defines **no `dashboard_id` field** on `Agent` or `WriteAgent`.
  - **Standalone Agents:** Ground on `1 to 5` curated Explores in `"sources"` (advise against uncurated mega-explores with `> 15` joined views, recommending curated Explores or LookML `fields:` / `hidden: yes` scoping instead), omit `"category"` (or use `"conversation"`), and link `3 to 15` verified Golden Queries via `"golden_query_ids": [<int_id_1>, ...]`.
  - **Dashboard Agents (`"category": "dashboard"` & Native Looker Core Panel Binding):**
    - Set `"category": "dashboard"`, populate `"sources"` from the dashboard tiles' backing `{"model": "...", "explore": "..."}` targets via Looker MCP `get_dashboard`, **omit `"golden_query_ids"`** (dashboard tiles act as grounded exemplars), and encode dashboard filter inheritance plus tile-to-measure mappings inside `context.instructions`.
    - **Native Panel Naming & `HTTP 404` Quirk:** Live Looker instances bind the native Dashboard CA panel strictly to `"name": "<instance_origin>-<dashboard_id>"` and hide `"category": "dashboard"` agents from `/conversations`. `GET /api/4.0/agents/{id}` (`get_agent "<id>"`) returns **`HTTP 404 Not Found`** on `"category": "dashboard"` agents—always inspect, list, and back up Dashboard Agents via `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50`, updating any existing `<instance_origin>-<dashboard_id>` record via `update_agent "<id>" -` (explicitly preserving `"name"`, `"category": "dashboard"`, `"description"`, and `"sources"` while omitting `"golden_query_ids"`) rather than creating duplicates.
- **Avoid Duplicate Context:** LookML field `description:` metadata and Golden Queries are injected automatically; never dump raw field catalogs inside `context.instructions`.
- **`code_interpreter` Latency Default (`false`):** Enabling `"code_interpreter": true` invokes `python_and_chart_agent` even on simple queries, adding **`+15s to +20s`** per turn. Default to `"code_interpreter": false`; enable `true` only when Python statistical modeling or forecasting is explicitly required.

---

## 3. Golden Query Curation, MCP `filters` Contract & API 4.0 Registration

- **Quantity Cap (`< 20` Total) & Anti-Overfitting (`<= 50%` Overlap):** Maintain `3 to 5` high-value seed Golden Queries when creating an agent (`< 20` total cap, `<= 50%` overlap with any evaluation suite).
- **Looker MCP `query` Before `query_url` Contract:** Verify every Golden Query via Looker MCP `query` (`0` SQL/filter errors and `> 0` sane rows) **before** generating its shareable short URL (`https://<host>/x/<slug>`) via **`query_url`** (`query_url` does not validate SQL or filter syntax). Both MCP tools require:
  - `filters`: **JSON object map with bare unquoted `"view.field"` keys** (`{"view.field": "-NULL"}`; omit `filters` or pass `{}` when unfiltered—**never `"filters": null`**).
  - `limit`: **Integer** (`10`, never `"10"`).
- **API 4.0 Single-Question Rule (`POST /api/4.0/golden_queries` & `PATCH /api/4.0/golden_queries/{id}`):** `WriteGoldenQuery` accepts only `{"questions": ["<single_question_string>"], "answer": "https://<host>/x/<slug>"}` (`is_active` is read-only, and `> 1` string in `questions` fails with `HTTP 422`). Update existing Golden Queries in place via `update_golden_query "<gq_id>" -` to keep IDs stable, or collect new integer `"id"` values from `create_golden_query -` into `"golden_query_ids"`.

---

## 4. Looker API 4.0 CLI Contract, Parallel MCP Batching & Auth Fail-Fast

1. **Smart Parallel LookML + Live Data Inspection (`<= 8` Calls/Batch, Zero Mid-Workflow Python Loops):**
   - Reuse any schema or agent metadata already fetched in the session.
   - Fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in **one parallel MCP batch** (never call `get_explore` on top of `get_dimensions` + `get_measures`).
   - In the **second parallel MCP batch** (`<= 8` calls), read the `.model.lkml` / `.explore.lkml` file and the **core Explore `.view.lkml` files** (`views/refined/` and primary joined views—skipping unrelated models/dashboards) alongside `get_field_value_suggestions` and `1-2` lightweight exploratory `query` calls (date min/max coverage, row volume, key category distributions) so the agent description, business rules, and Golden Queries reflect real SQL semantics and live data.
   - Multi-record Looker MCP outputs (`get_dimensions`, `get_measures`, `query`) use **JSONL** (one JSON object per line). Read tool outputs directly without spawning extra Python scripts during inspection.
2. **Verified `looker-cli` Commands & Single Atomic Deployment:**
   - Never run exploratory `looker-cli --help` chains. Pipe JSON via quoted heredocs (`cat <<'EOF'`) or run one self-contained `python3 - <<'PY'` deployment block that validates XML + `len <= 4800`, registers Golden Queries, creates/updates the agent, and saves `/tmp/` backup/snapshot JSON in **one single command**:
     - List all agents (for duplicate/similarity check & Dashboard lookup): `looker-cli api conversationalanalytics search_agents --limit 50` (Standalone) and `looker-cli api conversationalanalytics search_agents --category "dashboard" --limit 50` (Dashboard; both return `id`, `name`, `description`, `sources`, `context.instructions`, `golden_queries`, and `deleted` inline).
     - Single agent / writes: `get_agent "<id>"`, `create_agent -`, `update_agent "<id>" -`, `delete_agent "<id>"`, `create_golden_query -`, `update_golden_query "<gq_id>" -`, `delete_golden_query "<gq_id>"`.
     - Live evaluation (`Hard` mode): `create_conversation -` (`{"agent_id": "<id>", "name": "<name>"}`), `conversational_analytics_chat -` (`{"conversation_id": "<conv_id>", "user_message": "<question>"}`).
     - **Two-Step Soft+Hard Cleanup:** Run `update_conversation "<conv_id>" -` with `{"deleted": true}` then `delete_conversation "<conv_id>"`, and for `[TMP-SXS-EVAL]` agents run `update_agent "<temp_id>" -` with `{"deleted": true}` then `delete_agent "<temp_id>"` so zero test clutter remains in Looker's `Recent` sidebar.
3. **Authentication & Permission Fail-Fast Protocol:**
   - **`403 Forbidden`:** Halt immediately without fabricating schema metadata and report the missing Looker role, model-set permission, or GCP IAM access.
   - **Looker MCP `401` / `oauth2`:** Try at most **1** `get_models` re-handshake; if it still fails, halt and ask the user to refresh their Looker session.
   - **`looker-cli` `400 invalid_grant`:** Never loop on `session login`/`logout` or pass client secrets on the command line. Check whether `LOOKERSDK_CLIENT_ID`/`LOOKERSDK_CLIENT_SECRET` (or `LOOKER_CLIENT_ID`/`LOOKER_CLIENT_SECRET`) are set in the environment; if absent or expired, halt immediately and ask the user to re-authenticate via the `authenticating-looker-cli` skill.
