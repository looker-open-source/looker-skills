# Looker API 4.0 CA Endpoints & Looker MCP Integration Workflow

Because Looker MCP does not expose dedicated `ConversationalAnalytics` write tools, `looker-ca-agent-optimize` uses a **hybrid execution contract** adhering to the **Parallel MCP Batching, JSONL Output Parsing, Safe Heredoc JSON Piping, and Authentication Fail-Fast Protocol** in `looker-ca-best-practices.md` Section 5:
- **Looker MCP Tools (`looker-base`):** Used for agent discovery fallback (`system__activity.agent`), LookML & dashboard inspection (`get_dashboard`, `get_dimensions`, `get_measures`, `get_project_file`), Ground Truth verification (`query`), golden query short-URL generation (`query_url`), and isolated `dev_mode` (`{"devMode": true}`) LookML patching.
- **Looker API 4.0 CLI (`looker-cli api conversationalanalytics`):** Used to load live CA Agent configs (when raw JSON was not supplied), register golden queries, run SxS evaluation conversations, manage `[TMP-SXS-EVAL]` clones, and apply approved agent updates.

---

## 1. Looker MCP Parallel Batching, JSONL Format & `filters` Contract (Steps 2, 3, 4, 5, and 7)

| Workflow Step | Looker MCP Tool Batch | Execution Rule & Schema Contract |
| :--- | :--- | :--- |
| **Step 2 (Agent Discovery Fallback)** | `query` on `system__activity.agent` | Resolve an Agent Name to its GUID (`agent.guid`) when given a display name. |
| **Steps 2 & 3 (LookML & Dashboard Audit)** | **Batch 1:** `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files` (after `get_models`/`get_projects` if `project_id` is unknown; plus `get_dashboard` if `"category": "dashboard"`); **Batch 2:** `get_project_file`, `get_field_value_suggestions` | Reuse any Explore schema already in context; never call `get_explore` on top of `get_dimensions` + `get_measures`. **JSONL Format:** Multi-record MCP outputs (`get_dimensions`, `get_measures`, `query`) serialize one JSON object per line (JSONL, not a `[...]` array); read saved output files directly or parse line-by-line via `json.loads(line)`. |
| **Steps 4 & 5 (Ground Truth & Short URLs)** | **Capped Parallel Batching (`<= 8` calls/turn):** `query` -> `query_url` | Pass `filters` as a **bare-key JSON object map** (`{"view.field": "-NULL"}` on strings, never `"not null"`, never inner-quoted keys like `{"\"view.field\"": ...}`, and **omit `filters` or pass `{}` when unfiltered—never `"filters": null`**) and `limit` as an **integer** (`10`). Verify `0` SQL/filter errors and `> 0` sane rows via `query` (`<= 8` calls/batch) before generating or registering Standalone Golden Query `/x/<slug>` links via `query_url` (`query_url` does not validate SQL/filter syntax). |
| **Step 7 (LookML Dev-Branch Patch)** | `dev_mode` (`{"devMode": true}`), `get_project_file`, `update_project_file`, `validate_project`, `run_lookml_tests` | Read full file via `get_project_file` first, apply surgical additive edits via `update_project_file` (never full-file rewrites), and verify `0` errors (`validate_project`). Never deploy to production. |

---

## 2. Looker API 4.0 Agent Discovery & Loading (Step 2)

Never run `looker-cli --help` or `session login`/`logout` loops; enforce the Fail-Fast Auth rule in `looker-ca-best-practices.md` Section 5.

### A. MCP-Only Raw JSON Path vs. Live Agent Lookup
- **Raw JSON Provided in Step 1:** Parse the user-supplied Agent JSON directly without invoking `looker-cli` (enables zero-token static `Audit` mode in cloud/chat MCP-only environments).
- **Display Name Lookup:** Query Looker MCP `query` (`model: "system__activity"`, `explore: "agent"`, `fields: ["agent.id", "agent.guid", "agent.name", "agent.category", "agent.dashboard", "agent.dashboard_title", "user.email"]`) or run:
  ```bash
  looker-cli api conversationalanalytics search_agents --name "<agent_name>"
  ```
- **Load Agent by GUID (`GET /api/4.0/agents/{agent_id}`) & `Dashboard Agent` `HTTP 404` Fallback:**
  ```bash
  looker-cli api conversationalanalytics get_agent "<agent_id>"
  ```
  - **Dashboard Agent `HTTP 404` Quirk:** `get_agent "<agent_id>"` returns **`HTTP 404 Not Found`** for `"category": "dashboard"` agents. Whenever inspecting, backing up, or verifying a Dashboard Agent (or if `get_agent` returns `404`), fetch the full agent payload via `looker-cli api conversationalanalytics search_agents --category "dashboard"` and filter by `id` or `"name": "<instance_origin>-<dashboard_id>"` (note that Looker's native Dashboard panel binds strictly to `"name": "<instance_origin>-<dashboard_id>"` and hides `"category": "dashboard"` agents from `/conversations`).
- **Verified Looker API 4.0 `Agent` / `WriteAgent` Schema:**
  - `id` (string GUID), `name` (required string; `"<instance_origin>-<dashboard_id>"` on live native Dashboard Agents), `description` (required string)
  - `category`: `"conversation"` / omitted for Standalone Agents, or `"dashboard"` for Dashboard Agents (Looker API 4.0 has **no `dashboard_id` field** on `Agent` or `WriteAgent`)
  - `sources` (required non-nullable array): `[{"model": "<model_name>", "explore": "<explore_name>"}]`
  - `context`: `{"instructions": "<4-part strict XML 1.0 or YAML string, <= 4,800 chars>"}`
  - `code_interpreter`: `true | false` (default `false`)
  - `golden_queries` / `golden_query_ids`: Integer ID array (`[101, 102]`) for Standalone Agents; omitted for Dashboard Agents

---

## 3. Execute Eval Suite, Clone `[TMP-SXS-EVAL]` & Two-Step Cleanup (Steps 4 & 5)

Always pipe JSON payloads using quoted heredocs (`cat <<'EOF'`) so apostrophes or newlines inside questions and XML/YAML instructions never break bash syntax:

### A. Run Eval Conversations & Capture NDJSON Reasoning Traces
1. **Create Conversation (`POST /api/4.0/conversations` — `"name"` is mandatory):**
   ```bash
   cat <<'EOF' | looker-cli api conversationalanalytics create_conversation -
   {
     "agent_id": "<agent_id_or_temp_sxs_id>",
     "name": "[TMP-SXS] Round 1 - Q1"
   }
   EOF
   ```
2. **Send Eval Question (`POST /api/4.0/conversational_analytics/chat` — `"user_message"` is mandatory):**
   ```bash
   cat <<'EOF' | looker-cli api conversationalanalytics conversational_analytics_chat -
   {
     "conversation_id": "<conv_id>",
     "user_message": "What was our net revenue by region last quarter?"
   }
   EOF
   ```
   - Record wall-clock latency (P50/P90), NDJSON reasoning steps (`data.type == "DATA" and data.kind == "THOUGHT"`), generated Looker queries, `python_and_chart_agent` invocations, and final data rows vs. Ground Truth.

### B. Clone Temporary `[TMP-SXS-EVAL]` Agent & Mandatory Two-Step Cleanup
- **Register Candidate Golden Queries (`Standalone` Only):** Follow `looker-ca-best-practices.md` Section 3 & Section 5 (`query`-verified `query_url` + `create_golden_query -` with `<= 1` question per entry in a single shell loop).
- **Create Temporary SxS Agent (`POST /api/4.0/agents` — `"name"`, `"description"`, and `"sources"` are mandatory):**
  ```bash
  cat <<'EOF' | looker-cli api conversationalanalytics create_agent -
  {
    "name": "[TMP-SXS-EVAL] Retail Analytics Agent",
    "description": "Temporary SxS evaluation clone of Retail Analytics Agent.",
    "sources": [
      {"model": "retail_analytics", "explore": "order_items"}
    ],
    "context": {
      "instructions": "<agent_instructions>...</agent_instructions>"
    },
    "code_interpreter": false,
    "golden_query_ids": [101, 102]
  }
  EOF
  ```
- **Mandatory Two-Step Soft+Hard Cleanup:** Immediately after Round 1/2 finishes, purge every temporary conversation, temporary `[TMP-SXS-EVAL]` agent, and unretained golden query using the exact two-step `update_* {"deleted": true}` + `delete_*` sequence in `looker-ca-best-practices.md` Section 5 so zero clutter remains in the Looker UI `Recent` sidebar.

---

## 4. Atomic CA Agent Update & Complete Rollback Protocol (Step 7)

Execute **only after explicit human approval in Step 6**. On live CLI hosts, consolidate steps 1-3 below plus post-patch live verification (`get_agent "<agent_id>"`, or `search_agents --category "dashboard"` for Dashboard Agents) into **one atomic `set -euo pipefail` shell/Python heredoc command** (keeping intermediate JSON payloads in scratch/tmp and aborting immediately if the backup file fails to write) to avoid multiple terminal prompts or mid-step context compaction:
1. **Save & Verify Rollback Snapshot First:** Write the full prior agent JSON payload (including `backup["golden_queries"]`) to `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` (or output it inline if local disk writes are unavailable), confirm the file is non-empty, and report the path to the user.
2. **Sync Approved Golden Queries (`Standalone` Only):** Register new `query`-verified golden queries via `query_url` + `create_golden_query -` (and delete obsolete ones via `delete_golden_query "<old_gq_id>"` only after backup verification) and assemble the final integer `golden_query_ids` list.
3. **Patch Only Approved Agent Fields (`PATCH /api/4.0/agents/{agent_id}`):**
   ```bash
   cat <<'EOF' | looker-cli api conversationalanalytics update_agent "<agent_id>" -
   {
     "context": {
       "instructions": "<agent_instructions>...</agent_instructions>"
     },
     "code_interpreter": false,
     "golden_query_ids": [101, 102]
   }
   EOF
   ```
4. **Provide Complete Rollback Command (Including Replaced Golden Queries):** Print a copy-pasteable rollback snippet for the user. Whenever Step 7 deleted an obsolete Golden Query (`delete_golden_query "<old_gq_id>"`) and created new session Golden Query IDs, `update_agent` alone cannot revive deleted IDs—the rollback snippet must: **(a)** recreate any deleted Golden Queries from `backup["golden_queries"]` (`create_golden_query -` with `is_active`, `questions`, `answer`) and collect their restored IDs alongside surviving IDs, **(b)** restore `context`, `sources`, `code_interpreter`, and `golden_query_ids` via `update_agent "<agent_id>" -`, and **(c)** `delete_golden_query` the newly created session IDs.
5. **Export Validated LookML Patch (If Plan B Approved):** Save the unified diff to `/tmp/ca_lookml_patch_<agent_id>.diff` (or render inline) with `What changed`, `Why`, and `Affected Eval Questions`.
