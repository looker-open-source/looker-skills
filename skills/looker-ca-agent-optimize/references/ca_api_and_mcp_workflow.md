# Looker API 4.0 CA Endpoints, System Activity Telemetry & Looker MCP Integration Workflow

`looker-ca-agent-optimize` combines Looker MCP tools and `looker-cli api conversationalanalytics` under the **Parallel MCP Batching, Role-Based Permission Matrix, JSONL Output, Single Atomic Deployment, and Auth Fail-Fast** rules in `looker-ca-best-practices.md`:

---

## 1. Parallel Inspection, System Activity Telemetry & Query Batches (Steps 2, 3, 4, and 6)

| Workflow Step | Looker MCP / CLI Batch | Execution Rule |
| :--- | :--- | :--- |
| **Step 2 (Load Target Agent & Check Caller Permissions)** | `get_agent "<id>"` or `search_agents` (`--limit 50` and `--category "dashboard" --limit 50`) | Resolve display names via `search_agents` (both Standalone and `--category "dashboard"`, which return `id`, `name`, `description`, `sources`, `context.instructions`, `golden_queries`, `can`, `is_lookml`, `lookml_agent_id`, and `lookml_edit_uri` inline; remember `get_agent` returns `404` on `"category": "dashboard"`). Check `can.update`: if `false` (Viewer), offer a **read-only diagnostic report** instead of attempting writes. |
| **Step 2 (System Activity Telemetry — Admin / `see_system_activity`)** | **Parallel `query` calls on `model: "system__activity"`:**<br>1. `explore: "conversations_feedback"` (`conversation_sa_telemetry.user_message_truncated`, `rating`, `answer_success`, `comments`, `latency`)<br>2. `explore: "history"` (`query_api_client_context.name: "Conversational Analytics"`, `query.model`, `query.view`, `query.formatted_fields`, `history.status`, `history.message`, `history.average_runtime`, `history.query_run_count`) | Query `system__activity` to identify historical `Thumbs down` ratings, `Timeout`/`Error` turns, slow SQL queries, and heavily used fields for the target agent/Explore. **Automatic Fallback:** If `system__activity` returns `403` (caller lacks `see_system_activity`), note a brief one-line tip recommending Admin execution for System Activity insights and continue; if it returns `0` rows (new agent/instance or preview flag disabled), proceed seamlessly with Explore/LookML profiling. |
| **Step 2 (LookML & Live Data Inspection)** | **Batch 1:** `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files` (+ `get_dashboard` if Dashboard Agent); **Batch 2 (`<= 8` calls):** core `.model.lkml`/`.view.lkml` via `get_project_file` + `get_field_value_suggestions` + `1-2` exploratory `query` checks | Never call `get_explore` on top of `get_dimensions` + `get_measures`. If `get_project_files` returns `403`/empty (caller lacks `develop` permission), set `has_develop_permission = false` and continue using compiled Explore metadata + `query`. Note any exposed fields missing `description:` or clear `label:` for Step 6. |
| **Steps 3-5 (Golden Query Verification)** | **Capped Parallel Batch (`<= 8` calls/turn):** `query` -> `query_url` | Pass `filters` as a bare-key JSON object map (`"-NULL"` on strings, never `"not null"`, never `"filters": null`) and `limit` as an integer. Always verify `0` SQL errors and `> 0` sane rows via `query` **before** generating `/x/<slug>` URLs via `query_url`. |
| **Step 6 (Optional LookML Patch — Only If Caller Has `develop` & Says Yes)** | `dev_mode` (`{"devMode": true}`), `get_project_file`, `update_project_file`, `validate_project` | Read full `.view.lkml` file first (targeting `views/refined/` when present), apply surgical additive `description:` / `label:` edits, and confirm `0` errors (`validate_project`). Never deploy to production. |

---

## 2. `Advanced` (`Hard`) Mode Live Evaluation, Eval Suite Ingestion, `[TMP-SXS-EVAL]` Clone & Cleanup (Step 4)

Execute Step 4 **only when the user selects `Advanced` (or `Hard`) mode**. Always pipe JSON payloads via quoted heredocs (`cat <<'EOF'`) or one Python block so apostrophes/newlines never break quoting:

1. **Ingest Structured Eval Suite (Text, CSV/TSV, or Google Sheets) or Auto-Generate (`3-5` Questions):**
   - Accept optional user-supplied evaluation suites in three formats following the `(question, ground_truth, issue_description)` schema:
     - **Inline Text / Markdown Table:** Parse questions, expected ground truth (metric values, SQL/Looker filter rules, or target Dashboard tile), and reported issue notes directly from the prompt.
     - **Local `.csv` / `.tsv` File:** Read with Python `csv.DictReader` (matching headers case-insensitively: `question`, `ground_truth` / `expected_answer`, `issue_description` / `notes`).
     - **Google Sheets URL / ID:** Read via available Workspace/Drive tools or `gdrive export --mime text/csv` fallback (or ask the user to paste the rows if external connectors are unavailable).
   - **Automatic Fallback when Omitted:** If no Eval Suite is supplied, prioritize real failing/slow questions found in Step 2 `system__activity.conversations_feedback`, or auto-generate `3-4` realistic questions grounded in the Explore's dimensions and measures.
   - Route `ground_truth` directly into accuracy comparison against live Looker MCP `query` results, and use `issue_description` to prioritize root-cause fixes in Steps 3-4.
2. **Run Baseline & Candidate Eval Questions (`3-5` Questions Recommended for Speed):**
   - Create conversation: `looker-cli api conversationalanalytics create_conversation -` (`{"agent_id": "<id>", "name": "[TMP-SXS] Q1"}`).
   - Send message: `looker-cli api conversationalanalytics conversational_analytics_chat -` (`{"conversation_id": "<conv_id>", "user_message": "<question>"}`).
   - Record wall-clock latency (P50/P90), parse the streamed JSON array of `ChatMessage` objects—extracting reasoning thoughts from `systemMessage.text` where `textType == "THOUGHT"` (joining `parts` chunks) and generated queries from `systemMessage.data.generatedLookerQuery`—and compare `python_and_chart_agent` overhead and final answers vs. Ground Truth.
3. **Test Candidate Upgrade on Isolated `[TMP-SXS-EVAL]` Clone & Run Two-Step Cleanup:**
   - Clone via `create_agent -` with mandatory `"name": "[TMP-SXS-EVAL] <Original Name>"`, `"description"`, `"sources"`, candidate `"context"`, `"code_interpreter"`, and fresh temporary Golden Query IDs created via `create_golden_query -` (never reuse `golden_query_ids` already bound to the live agent).
   - Run **1 clean SxS round** (max 2 rounds if a target question still fails), then immediately purge every temporary conversation, the `[TMP-SXS-EVAL]` agent, and every temporary Golden Query using `update_* {"deleted": true}` followed by `delete_*` so Looker's `Recent` sidebar stays completely clean.

---

## 3. Step 5: Default Atomic Backup & Agent Optimization

Once Step 3 (`Fast` / `Soft` mode) or Step 4 (`Advanced` / `Hard` mode) finishes—unless the user explicitly asked for a read-only inspection, `can.update == false` (Viewer), or `looker-cli` is unavailable—apply the agent optimization **automatically in one single atomic command** (`set -euo pipefail` / single `python3 - <<'PY'` script):

> **LookML-Defined Agents (`"is_lookml": true`):** If Step 2 detected `"is_lookml": true` on the agent (`lookml_agent_id` / `lookml_edit_uri`), `PATCH /api/4.0/agents/{id}` will be rejected or overwritten by the LookML definition. Skip Step 5 API `update_agent` writes and instead apply the upgraded agent instructions/golden queries alongside any approved field metadata edits directly to the agent's LookML file (`lookml_edit_uri`) in Step 6 `dev_mode` (`validate_project` `0` errors, zero auto-commits to production).

1. **Save & Verify Pre-Update Rollback Backup First:**
   - Write the complete original agent JSON (including `golden_queries`) to `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` (wrapped in `try/except OSError` when local writes are unavailable).
2. **Validate Upgraded Human-Readable YAML Instructions In-Memory (`0.1s`):**
   - Replace any accidental `&amp;`, `&lt;`, `&gt;` entities with natural `&`, `<`, `>`, assert `len(instructions) <= 4800`, verify all 4 required YAML sections (`role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, `presentation_and_analysis_rules:`) and zero tabs (`\t`), and validate via `yaml.safe_load(instructions)` (when `PyYAML` is installed).
3. **Sync Verified Golden Queries In-Place (`Standalone` Only) & Update Live Agent:**
   - Update modified existing Golden Queries **in place** via `update_golden_query "<gq_id>" -` (`PATCH /api/4.0/golden_queries/{id}` with `{"questions": ["<single_question>"], "answer": "https://<host>/x/<slug>"}`; omit read-only `is_active`), register net-new verified entries via `create_golden_query -` (`< 20` total cap), and delete obsolete ones via `delete_golden_query "<old_gq_id>"`.
   - Run `update_agent "<agent_id>" -` explicitly preserving `"name"`, `"description"`, `"category"` (including `"category": "dashboard"` and `"name": "<instance_origin>-<dashboard_id>"` on Dashboard Agents), and `"sources"` alongside upgraded `"context": {"instructions": ...}`, `"code_interpreter"`, and `"golden_query_ids"` (omitting `"golden_query_ids"` on Dashboard Agents).
