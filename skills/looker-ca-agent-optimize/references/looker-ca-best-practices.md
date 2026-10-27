# Looker Conversational Analytics (CA) Best Practices

This shared reference defines the foundational grounding, API 4.0 schema, Looker MCP filter/output contracts, and CLI execution standards enforced by `looker-ca-agent-optimize` and `looker-ca-agent-create` for Standalone Agents and Dashboard Agents.

---

## 1. Four-Part System Instructions Structure (Strict XML 1.0 or YAML)

System instructions (`context.instructions` in Looker API 4.0) must never be written as unstructured plain-text paragraphs. Structure instructions into four explicit sections (wrapped in a single `<agent_instructions>...</agent_instructions>` root element in XML mode, or under an `agent_instructions:` root key in YAML mode), keeping total length concise (`< 1,200` tokens, ideally `400-800` tokens; **`<= 4,800` characters** measured programmatically via `len()` when a Python/shell tool is available, because `view.field_name` identifiers tokenize at `~4-4.5` chars/token—never eyeball token counts). In XML mode, enforce **strict XML 1.0 escaping**: escape `&` as `&amp;` and never write raw `<` or `>` inside element bodies (write `"up to 60 days"` or `&lt;=`, verifiable with `xml.etree.ElementTree.fromstring` when Python is available):

1. **Role & Tone (`<role_and_tone>` / `role_and_tone`):**
   - Define a concise persona, target audience, and strict domain boundary (for example: "Act as a Retail Merchandising Analyst answering questions strictly from the attached `orders` and `inventory` Explores").
   - Prohibit fabricating metrics or extrapolating outside the attached Explores or Dashboard.
2. **Explore & Filtering Rules (`<explore_and_filtering_rules>` / `explore_and_filtering_rules`):**
   - Map question topics explicitly to the designated Explore when multiple Explores are attached.
   - Define conditional default date filters (applying a default window only to undated general trend/Top-N queries while exempting lifetime totals and specific entity/ID lookups so the agent never enters `0-row` Data-Hunting retry loops) and document known dataset date coverage.
   - **Valid Looker Complete-Day Date Filter Syntax (`"30 days ago for 30 days"`):** When expressing complete-day windows (such as a "last 30 complete days" business rule) in Looker filter expressions or `filters` maps, use **`"30 days ago for 30 days"`** (or `"90 days ago for 90 days"`, `"7 days"`, `"last 1 month"`). Passing `"last 30 complete days"` directly in a Looker `filters` map fails with **`HTTP 400 Invalid date filter syntax`**.
   - Inline verified categorical filter value mappings (for example, `"US"` / `"United States"` to `"USA"`) so the agent does not enter Field-Sampling loops.
   - **Looker Native String Null-Exclusion Syntax (`"-NULL"` Everywhere, Never `"not null"`):** On `type: string` dimensions, **both** CA Agent `context.instructions` **and** Looker MCP `query` / `query_url` `filters` maps treat `"not null"` as a literal text match (`= 'not null'`, returning `0 rows` and causing `+8s` retry penalties). Always write Looker native filter expressions **`"-NULL"`** (or **`"-NULL,-EMPTY"`**).
3. **Semantic Layer & Execution Rules (`<semantic_and_execution_rules>` / `semantic_and_execution_rules`):**
   - Disambiguate closely named measures, dimensions, and `filter_only` Period-over-Period fields.
   - Enforce single-query consolidation: retrieve all required dimensions, measures, and period comparisons in a single Looker query rather than stacking exploratory queries.
4. **Presentation & Analysis Rules (`<presentation_and_analysis_rules>` / `presentation_and_analysis_rules`):**
   - Specify default grouping granularities, Top-N limits/sorts, and currency/percentage formatting.

---

## 2. Standalone vs. Dashboard Agent API 4.0 Grounding & Settings

- **Looker API 4.0 `Agent` / `WriteAgent` Schema (`POST /api/4.0/agents` & `PATCH /api/4.0/agents/{id}`):**
  - Mandatory non-nullable fields on `create_agent`: `"name"` (string), `"description"` (string), and `"sources"` (`[{"model": "<model_name>", "explore": "<explore_name>"}]`). Looker API 4.0 defines **no `dashboard_id` field** on `Agent` or `WriteAgent`.
  - **Standalone Agents:** Ground on `1 to 5` curated Explores in `"sources"`, omit `"category"` (or use `"conversation"`), and link `3 to 15` verified Golden Queries via `"golden_query_ids": [<int_id_1>, ...]`. Avoid wide mega-explores (`> 15` joined views or hundreds of uncurated fields).
  - **Dashboard Agents (`"category": "dashboard"` & Native Looker Core Panel Binding):**
    - Set `"category": "dashboard"`, populate `"sources"` with the backing `{"model", "explore"}` targets extracted from the dashboard's tiles via Looker MCP `get_dashboard` (`dashboard_id`), **omit `"golden_query_ids"`** (dashboard tiles act as native grounded query exemplars), and encode dashboard default filter inheritance plus explicit tile-title-to-measure mappings inside the 4-part XML/YAML `context.instructions`.
    - **Native Panel Naming & `/conversations` Visibility:** On live Looker instances, Looker's native Dashboard CA panel binds strictly to `"name": "<instance_origin>-<dashboard_id>"` (for example, `"https://host.looker.com-42"` or `"https://host.looker.com-model::dash_slug"`, falling back to a descriptive dashboard title/ID name only in offline fixtures where no instance origin URL is provided), and Looker hides all `"category": "dashboard"` agents from the `/conversations` gallery. Creating `"category": "dashboard"` with a free-form `"name"` produces an orphaned agent invisible in both UI surfaces; offer an optional companion Standalone agent (omitting `"category"`) only if the user explicitly requests `/conversations` hub visibility.
    - **`get_agent` `HTTP 404` Quirk & Auto-Created Record Check:** `GET /api/4.0/agents/{id}` (`get_agent "<id>"`) returns **`HTTP 404 Not Found`** on `"category": "dashboard"` agents. Always inspect, back up, and check for pre-existing Looker-auto-created Dashboard Agents via `looker-cli api conversationalanalytics search_agents --category "dashboard"`, patching an existing `<instance_origin>-<dashboard_id>` record via `update_agent "<id>" -` instead of creating duplicates.
- **Avoid Duplicate Context:** LookML field `description:` metadata and Golden Queries are injected automatically; never dump raw field catalogs inside `context.instructions`.
- **`code_interpreter` Latency Trade-Off (`false` by Default):** Enabling `"code_interpreter": true` triggers the `python_and_chart_agent` sub-step even on simple queries, adding **`+15s to +20s`** per turn. Default to `"code_interpreter": false`; enable `true` only when post-query Python statistical modeling or forecasting is explicitly required.

---

## 3. Golden Query Curation, MCP `filters` Contract & API 4.0 Registration

Golden Queries (`golden_query_ids` on Standalone Agents) teach multi-view joins, cohorts, and filter patterns:

- **Quantity Cap (`< 20` Total) & Anti-Overfitting (`<= 50%` Overlap):** Maintain `3 to 15` high-value Golden Queries (strictly `< 20`) representing reusable archetypes. Never match more than **50%** of an evaluation dataset's questions verbatim.
- **Looker MCP `query` & `query_url` Parameter Contract:** Verify every query via Looker MCP `query` (`0` SQL/filter errors and `> 0` sane rows) and generate its shareable Explore short URL (`https://<host>/x/<slug>`) via **`query_url`** (`query_url` persists metadata without validating SQL or filter syntax, so never register a `query_url` slug whose `query` check failed or returned `0 rows`). Both MCP tools strictly require:
  - `filters`: **JSON object map with bare unquoted `"view.field"` keys** (`{"view.field": "-NULL"}`, never an array of `{field, value}` objects, never inner-quoted keys like `{"'view.field'": ...}` or `{"\"view.field\"": ...}`, and **omit `filters` or pass `{}` when unfiltered—never `"filters": null`**).
  - `limit`: **Integer** (`10`, never `"10"`).
- **API 4.0 Single-Question Rule (`POST /api/4.0/golden_queries`):** Register each golden query with `{"is_active": true, "questions": ["<single_question_string>"], "answer": "https://<host>/x/<slug>"}`. Passing `> 1` string in `questions` fails with **`HTTP 422: only one question is supported per golden query`**. Collect the returned integer `"id"` values into `"golden_query_ids": [<id_1>, <id_2>, ...]`.

---

## 4. Delegate Reusable Logic to LookML

Push reusable calculations, synonyms, and join constraints into the **LookML semantic layer** (`description:`, `label:`, `sql:`, `primary_key: yes`) rather than hardcoding complex SQL formulas in agent instructions.

---

## 5. Looker API 4.0 CLI Contract, Parallel MCP Batching & Auth Fail-Fast

1. **Context Reuse, JSONL Parsing & Capped Parallel Looker MCP Batching (`<= 8` Calls/Batch):**
   - Reuse any Explore schema or date-range metadata already fetched in the session instead of re-querying.
   - Resolve `project_id` via `get_models` (or `get_projects`) if not yet known, then fetch `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, and `get_project_files` in **one parallel MCP batch** (never call `get_explore` on top of `get_dimensions` + `get_measures`, saving `~50s` of redundant cold compilation). Batch `get_project_file` + `get_field_value_suggestions` together.
   - Consolidate `query` verification and Standalone `query_url` generation into parallel Looker MCP batching capped at **`<= 8` calls per turn** (when total checks exceed `8` calls, run `query` batches of `<= 8` calls first and then a parallel `query_url` batch for verified Standalone Golden Queries so connection pools never stall).
   - **JSONL Output Format:** Multi-record Looker MCP outputs (`get_dimensions`, `get_measures`, `query`) serialize records as **newline-delimited JSON (JSONL — one JSON object per line)** rather than a single `[...]` JSON array; inspect saved output files directly or parse line-by-line (`json.loads(line)`).
2. **Verified `looker-cli` Commands & Safe Heredoc JSON Piping (Zero `--help` Loops):**
   - Never run exploratory `looker-cli --help` chains, and never wrap JSON containing natural-language questions or XML/YAML instructions in single-quoted `printf '%s' '{...}'` strings (apostrophes break bash quoting). Pipe valid JSON via quoted heredoc (`cat <<'EOF' | looker-cli api conversationalanalytics <cmd> -`):
     - Agents: `search_agents --name "<name>"`, `search_agents --category "dashboard"` (required for `"category": "dashboard"` agents where `get_agent` returns `404`), `get_agent "<id>"`, `create_agent -`, `update_agent "<id>" -`, `delete_agent "<id>"`.
     - Golden Queries: `create_golden_query -` (batch 3-5 creations in one atomic shell/Python loop), `delete_golden_query "<gq_id>"`.
     - Eval Chat: `create_conversation -` (`{"agent_id": "<id>", "name": "<name>"}`), `conversational_analytics_chat -` (`{"conversation_id": "<conv_id>", "user_message": "<question>"}`).
     - **Two-Step Soft+Hard Cleanup** (prevents leftover entries in the Looker UI `Recent` sidebar): run `update_conversation "<conv_id>" -` with `{"deleted": true}` then `delete_conversation "<conv_id>"` (`DELETE /api/4.0/conversations?id=<conv_id>`), and for temporary agents run `update_agent "<temp_id>" -` with `{"deleted": true}` then `delete_agent "<temp_id>"`.
3. **Authentication & Authorization Fail-Fast Protocol (Zero Auth Retry Loops):**
   - **Permission Denied (`403 Forbidden`):** If Looker MCP or Looker API 4.0 returns `403 Forbidden`, **halt immediately** without guessing or fabricating model, Explore, or field names, and report the exact missing Looker role, model-set permission, or GCP IAM access required.
   - **Looker MCP (`401 Unauthorized` / `oauth2: cannot fetch token`):** Try **at most 1** lightweight `get_models` call to trigger session re-handshake; if it still fails, **halt immediately** and ask the user to refresh their Looker MCP session.
   - **`looker-cli` (`400 invalid_grant: token expired`):** An expired OAuth `refresh_token` in `~/.config/looker-cli/config.yaml` blocks all subcommands (including `session login`/`logout`). Never loop on `session login`/`logout`. Check `LOOKERSDK_CLIENT_ID`/`LOOKERSDK_CLIENT_SECRET` (or `LOOKER_CLIENT_ID`/`LOOKER_CLIENT_SECRET`); if absent, **halt immediately** and ask the user to authenticate via `looker-base` (`authenticating-looker-cli`) or replace/configure their Looker API 4.0 key profile using `--host` (hostname without `https://`, never `--base-url`):
     ```bash
     : "${LOOKER_HOST:?Set LOOKER_HOST first}" && (looker-cli profile rm default 2>/dev/null || true) && looker-cli profile add default --host "$LOOKER_HOST" --port 443 --client-id "${LOOKERSDK_CLIENT_ID:-$LOOKER_CLIENT_ID}" --client-secret "${LOOKERSDK_CLIENT_SECRET:-$LOOKER_CLIENT_SECRET}"
     ```
