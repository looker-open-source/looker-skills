# Looker API 4.0 CA Endpoints & Looker MCP Integration Workflow

`looker-ca-agent-optimize` combines Looker MCP tools and `looker-cli api conversationalanalytics` under the **Parallel MCP Batching, JSONL Output, Single Atomic Deployment, and Auth Fail-Fast** rules in `looker-ca-best-practices.md` Section 4:

---

## 1. Parallel Inspection & Query Verification Batches (Steps 2, 3, 4, and 6)

| Workflow Step | Looker MCP / CLI Batch | Execution Rule |
| :--- | :--- | :--- |
| **Step 2 (Load Target Agent)** | `get_agent "<id>"` or `search_agents` (`--limit 50` and `--category "dashboard" --limit 50`) | Resolve display names via `search_agents` (both Standalone and `--category "dashboard"`, which already return `id`, `name`, `description`, `sources`, `context.instructions`, and `golden_queries` inline; remember `get_agent` returns `404` on `"category": "dashboard"`). On MCP-only hosts, accept raw Agent JSON or query `system__activity.agent`. |
| **Step 2 (LookML & Live Data Inspection)** | **Batch 1:** `get_dimensions`, `get_measures`, `get_filters`, `get_parameters`, `get_project_files` (+ `get_dashboard` if Dashboard Agent); **Batch 2 (`<= 8` calls):** core `.model.lkml`/`.view.lkml` via `get_project_file` + `get_field_value_suggestions` + `1-2` exploratory `query` checks | Never call `get_explore` on top of `get_dimensions` + `get_measures`. Read core Explore `.lkml` files and run `1-2` quick `query` checks (date coverage, real status/category values) so optimizations reflect real SQL logic and live data. Note any exposed fields missing `description:` or clear `label:` for Step 6. |
| **Steps 3-5 (Golden Query Verification)** | **Capped Parallel Batch (`<= 8` calls/turn):** `query` -> `query_url` | Pass `filters` as a bare-key JSON object map (`"-NULL"` on strings, never `"not null"`, never `"filters": null`) and `limit` as an integer. Always verify `0` SQL errors and `> 0` sane rows via `query` **before** generating `/x/<slug>` URLs via `query_url`. |
| **Step 6 (Optional LookML Patch — Only If User Says Yes)** | `dev_mode` (`{"devMode": true}`), `get_project_file`, `update_project_file`, `validate_project` | Read full `.view.lkml` file first (targeting `views/refined/` when present), apply surgical additive `description:` / `label:` edits, and confirm `0` errors (`validate_project`). Never deploy to production. |

---

## 2. `Hard` Mode Live Evaluation, `[TMP-SXS-EVAL]` Clone & Two-Step Cleanup (Step 4)

Execute Step 4 **only when the user selects `Hard` mode**. Always pipe JSON payloads via quoted heredocs (`cat <<'EOF'`) or one Python block so apostrophes/newlines never break quoting:

1. **Run Baseline & Candidate Eval Questions (`3-5` Questions Recommended for Speed):**
   - Create conversation: `looker-cli api conversationalanalytics create_conversation -` (`{"agent_id": "<id>", "name": "[TMP-SXS] Q1"}`).
   - Send message: `looker-cli api conversationalanalytics conversational_analytics_chat -` (`{"conversation_id": "<conv_id>", "user_message": "<question>"}`).
   - Record wall-clock latency (P50/P90), NDJSON thoughts (`data.type == "DATA" and data.kind == "THOUGHT"`), generated Looker queries, `python_and_chart_agent` overhead, and accuracy vs. Ground Truth `query` results.
2. **Test Candidate Upgrade on Isolated `[TMP-SXS-EVAL]` Clone:**
   - Never overwrite the real agent before verifying candidate fixes in `Hard` mode. Clone via `create_agent -` with mandatory `"name": "[TMP-SXS-EVAL] <Original Name>"`, `"description"`, `"sources"`, candidate `"context"`, `"code_interpreter"`, and candidate `"golden_query_ids"`.
   - Run **1 clean SxS round**; if target metrics improve with zero regressions, proceed directly to Step 5 (run a 2nd SxS round only if a target question still fails—strictly max 2 rounds).
3. **Mandatory Two-Step Soft+Hard Cleanup:**
   - Immediately after SxS finishes, purge every temporary conversation, the `[TMP-SXS-EVAL]` agent, and any unretained Golden Query using `update_* {"deleted": true}` followed by `delete_*` so Looker's `Recent` sidebar stays completely clean.

---

## 3. Step 5: Default Atomic Backup & Agent Optimization

Once Step 3 (`Soft` mode) or Step 4 (`Hard` mode) finishes—unless the user explicitly asked for a read-only inspection without modifying the agent, or `looker-cli` is unavailable—apply the agent optimization **automatically in one single atomic command** (`set -euo pipefail` / single `python3 - <<'PY'` script):

1. **Save & Verify Pre-Update Rollback Backup First:**
   - Write the complete original agent JSON (including `golden_queries`) to `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` and abort immediately if the backup file is empty or fails to write.
2. **Validate Upgraded Instructions In-Memory (`0.1s`):**
   - Assert `len(instructions) <= 4800` and, in XML mode, verify strict XML 1.0 well-formedness via `xml.etree.ElementTree.fromstring(instructions)`.
3. **Sync Verified Golden Queries (`Standalone` Only):**
   - Register any new or repaired `query`-verified Golden Queries via `create_golden_query -` (`<= 1` question per entry, `< 20` total cap) and remove broken/obsolete ones via `delete_golden_query "<old_gq_id>"` only after the backup JSON is safely written.
4. **Update the Live Agent (`PATCH /api/4.0/agents/{agent_id}`):**
   - Run `update_agent "<agent_id>" -` explicitly preserving `"name"`, `"description"`, `"category"` (including `"category": "dashboard"` and `"name": "<instance_origin>-<dashboard_id>"` on Dashboard Agents), and `"sources"` alongside upgraded `"context": {"instructions": ...}`, `"code_interpreter"`, and `"golden_query_ids"` (omitting `"golden_query_ids"` on Dashboard Agents).
   - Keep full rollback capability ready (restoring `backup["golden_queries"]`, `context`, `sources`, and `code_interpreter` from `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` if requested by the user).
