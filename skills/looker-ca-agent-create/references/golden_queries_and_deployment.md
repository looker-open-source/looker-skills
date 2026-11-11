# Golden Queries Verification, Default Atomic Creation & Gate #2 Summary

This reference covers Seed Golden Query verification (Step 3), Default Atomic Agent Creation (Step 4), and the Concise Executive Confirmation + Least-Privilege Sharing Wizard + Optional LookML Offer / Developer Handoff (Step 5) for `looker-ca-agent-create`.

---

## 1. Seed Golden Query Verification (Step 3 — `Standalone Agent` Only)

Author **3 to 5 seed Golden Queries** (`< 20` cap, 1 question per entry) grounded in the real fields, SQL formulas, and date coverage discovered in Step 2:
1. **Verify via `query` Before `query_url` (`<= 8` Calls/Batch) & Enforce YAML Filter Consistency:**
   - Run all `3-5` Seed Golden Queries in **one parallel Looker MCP `query` batch** first (bare-key object `filters` with `"-NULL"` on strings—never `"not null"` and never `"filters": null`—and integer `limit`).
   - **YAML vs. Golden Query Filter Alignment:** Verify that every filter or parameter declared as mandatory (`ALWAYS filter`) in `explore_and_filtering_rules.mandatory_base_and_null_filters` for an Explore is included in the `filters` map of every Seed Golden Query on that Explore (or, if a LookML Liquid parameter defaults to `1=1` when unfiltered for all-device/all-segment aggregates, document it in the YAML as required only when filtering a specific value).
   - If any query hits a BigQuery partition/Liquid rule or returns `0 rows`, repair its filter and re-verify via `query`.
   - Once all `3-5` queries pass with `0` SQL errors and `> 0` sane rows, generate their `/x/<slug>` short links in **one parallel `query_url` batch** (skipping `query_url` completely for Dashboard Agents).

---

## 2. Default Atomic Agent Validation & Creation (Step 4)

Once the user has confirmed Gate #1 scoping and Step 3 queries pass, **create the CA Agent automatically by default** without pausing beforehand for `"Plan A / Plan B"` menus (unless the user explicitly asked for a dry-run preview without creating the agent, or `looker-cli` is unavailable on an MCP-only host).

Consolidate **human-readable YAML validation (drafting target `3,200-4,200` chars, hard cap `len <= 4800`, zero `&amp;`/`&lt;`/`&gt;`)**, **Golden Query registration (`create_golden_query -`)**, **Agent creation or Dashboard binding (`create_agent -` or `update_agent "<id>" -`)**, and **snapshot export (`/tmp/ca_agent_created_<id>.json`)** into **one single atomic command** (`set -euo pipefail` / single `python3 - <<'PY'` script):

1. **Validate Human-Readable YAML Instructions In-Memory (`0.1s`, Zero Retry Loops):**
   - Author the 4 YAML sections (`role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, `presentation_and_analysis_rules:`) at the **root level (column 0)** without an outer `agent_instructions:` wrapper key, targeting **`3,200 - 4,200` characters (`~55-70` lines)** on the first draft so `len(instructions) <= 4800` succeeds on the first run without multi-turn script rewrites.
   - Replace any accidental `&amp;`, `&lt;`, `&gt;` entities with natural `&`, `<`, `>`, assert `len(instructions) <= 4800`, verify all 4 required YAML sections (`role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, `presentation_and_analysis_rules:`) and zero tabs (`\t`), and validate via `yaml.safe_load(instructions)` (when `PyYAML` is installed) before calling Looker API 4.0.
2. **Register Verified Golden Queries (`Standalone` Only):**
   - Call `looker-cli api conversationalanalytics create_golden_query -` for each of the `3-5` verified `/x/<slug>` URLs (`{"questions": ["<single_question>"], "answer": "https://<host>/x/<slug>"}`; omit read-only `is_active`) and collect integer `golden_query_ids`.
3. **Create or Bind the CA Agent:**
   - **Standalone Agent:** Call `create_agent -` with mandatory `"name"`, `"description"`, `"sources"`, `"context": {"instructions": ...}`, `"code_interpreter": false`, and `"golden_query_ids"`. Record the returned `id` and `content_metadata_id`.
   - **Dashboard Agent:** Check whether `"name": "<instance_origin>-<dashboard_id>"` already existed in Step 1 `search_agents --category "dashboard"`; if so, patch it via `update_agent "<existing_id>" -`, otherwise create it via `create_agent -` with `"name": "<instance_origin>-<dashboard_id>"`, `"category": "dashboard"`, `"sources"` from tile Explores, `"context"`, and `"code_interpreter": false` (omitting `"golden_query_ids"`).
4. **Save Local Snapshot:** Write the resulting agent JSON to `/tmp/ca_agent_created_<agent_id>.json` (wrapped in `try/except OSError` when local writes are unavailable).
5. **MCP-Only Host Fallback:** If `looker-cli` is absent in a chat-only environment, clearly tell the user the agent specification is ready to import and provide the ready-to-apply payload concisely.

---

## 3. Step 5: Executive Confirmation, Least-Privilege Sharing & LookML Gate *(Human Gate #2)*

Keep the Step 5 user response **concise, business-friendly, and free of technical walls** (`~10-15` lines total; never mention `"Plan A"` or `"Plan B"` and never dump raw YAML/XML code blocks unless requested):

### Part 1 — Confirm the Newly Created Agent & Least-Privilege Access
- **Agent Created:** Bold Agent Name, Agent ID (`<id>`), and direct Looker UI link (`https://<host>/conversations` or agent/dashboard URL).
- **Access & Security (Least Privilege Default):** Explicitly confirm that the agent was created with **Least Privilege access** (private to you as the creator with `Edit` access).
- **Description & Configured Behavior:** 1-2 clear sentences on who the agent serves and which Explore(s)/Dashboard it uses, plus 3-4 short bullets on its default date window, key metrics, and rules.
- **Sample Questions Ready to Ask:** List the `3-5` verified natural-language questions (for Standalone Agents) or key Dashboard drill-downs.

### Part 2 — Gate #2: Optional Group Sharing Wizard (`View` Access) & LookML Improvements
Right below the confirmation, offer two simple optional follow-ups based on the caller's permissions:
1. **Optional Group Sharing Wizard (`View` Access for User Groups):**
   - Ask whether the user wants to share **chat/view access (`View`)** to this agent with any Looker user group (keeping `Edit` restricted to the creator/admins). If the user says **Yes**, list available groups via `looker-cli api group all_groups` (if they did not name one) and grant `View` access on the agent's `content_metadata_id` via `looker-cli api content create_content_metadata_access -` (`{"content_metadata_id": "<content_metadata_id>", "group_id": "<group_id>", "permission_type": "view"}`).
2. **Optional LookML Metadata Improvements (Developer vs. Non-Developer Handling):**
   - **If the caller HAS LookML `develop` permission (`has_develop_permission == true`):** Ask one simple **Yes / No** question offering to fix the spotted missing `description:` or `label:` fields in Looker `dev_mode`. Only if the user replies **Yes**, enable `dev_mode` (`{"devMode": true}`), read target `.view.lkml` files via `get_project_file` (targeting `views/refined/` when present), apply surgical additive `description:` / `label:` edits via `update_project_file`, verify **`0` errors** via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<agent_id>.diff` (when local writes are available), and confirm briefly.
   - **If the caller LACKS LookML `develop` permission (`has_develop_permission == false`):** Do **not** offer `dev_mode`; instead, provide a concise, copy-ready **Note for Your LookML Developer** listing the 2-4 suggested field `description:` / `label:` additions they can forward by email or chat to their LookML team.
