# Golden Queries Verification, Atomic Deployment & Gate #2 Summary

## 1. Seed Golden Query Verification *(Step 3 — Lines 1-12)*

Author **`3 to 5` seed Golden Queries** (`< 20` cap, 1 question per entry) grounded in the fields, SQL formulas, and date range verified in Step 2:
1. **Verify via `query` Before `query_url` (`<= 8` Calls/Batch) & Align Mandatory Filters:**
   - Run all `3-5` Seed Golden Queries in **one parallel Looker MCP `query` batch** first (using schema keys `model`, `explore`, `fields`, flat object `filters` with `"-NULL"` on strings—never `"not null"` or `"filters": null`—and integer `limit`).
   - **YAML vs. Golden Query Filter Parity:** Every filter or parameter declared mandatory (`Always apply...`) in `explore_and_filtering_rules.mandatory_base_and_null_filters` for an Explore MUST be included in the `filters` map of every Seed Golden Query on that Explore (or, if a Liquid parameter defaults to `1=1` when unfiltered for all-segment totals, state in YAML that it is required only when filtering a specific segment).
   - Repair and re-verify any query that hits a partition/Liquid error or returns `0 rows`.
2. **Generate `/x/<slug>` Links:** Once all `3-5` queries pass (`0` errors, `> 0` rows), generate their `/x/<slug>` short links in **one parallel `query_url` batch**.

---

## 2. Default Atomic Agent Validation & Creation *(Step 4 — Lines 14-26)*

Once Gate #1 is confirmed and Step 3 queries pass, **create the Standalone CA Agent automatically by default** in **one self-contained `python3 - <<'PY'` command** (unless the user explicitly requested a dry-run preview or `looker-cli` is absent on an MCP-only host):
1. **Validate Root-Level YAML In-Memory (`0.1s`, Zero Separate Subshells):**
   - Replace any accidental `&amp;`, `&lt;`, `&gt;` with natural `&`, `<`, `>`, assert `len(instructions) <= 4800` (first-draft target `3,200-4,200` chars), verify all 4 root-level keys (`role_and_tone:`, `explore_and_filtering_rules:`, `semantic_and_execution_rules:`, `presentation_and_analysis_rules:`) at column 0 and zero `\t` tabs, and run `yaml.safe_load(instructions)` if `PyYAML` is installed.
2. **Register Golden Queries & Create Agent Atomically (With Orphan Rollback):**
   - Wrap Golden Query registration and `create_agent -` in a `try/except` block with `created_gq_ids = []`. Inside `try:`, use `concurrent.futures.ThreadPoolExecutor(max_workers=5)` to call `looker-cli api conversationalanalytics create_golden_query -` (`{"questions": ["<single_question>"], "answer": "https://<host>/x/<slug>"}`; omit read-only `is_active`), appending each returned integer ID to `created_gq_ids` as futures finish (collecting any future errors cleanly before raising).
   - Call `create_agent -` with `"name"`, `"description"`, `"sources"`, `"context": {"instructions": ...}`, `"code_interpreter": false`, and `"golden_query_ids": created_gq_ids`. Capture `id` and `content_metadata_id`.
   - **Rollback on Failure (`except`):** If any `create_golden_query` call or `create_agent -` fails, delete every ID in `created_gq_ids` via `looker-cli api conversationalanalytics delete_golden_query "<gq_id>"` (best-effort loop logging any cleanup failures) before re-raising so no orphaned Golden Queries remain.
3. **Save Snapshot:**
   - Write `/tmp/ca_agent_created_<agent_id>.json` (wrapped in `try/except OSError`). On MCP-only hosts without `looker-cli`, output the ready-to-import payload cleanly.

---

## 3. Executive Confirmation, Sharing & LookML Gate *(Step 5 / Human Gate #2 — Lines 28-35)*

Keep the Step 5 response concise and business-friendly (`~10-15` lines; zero `"Plan A / Plan B"` menus or raw YAML/`.lkml` blocks unless requested):
- **Agent Confirmation & Least-Privilege Access:** State **Agent Name**, **Agent ID (`<id>`)**, **Looker URL** (`https://<host>/conversations`), **Least-Privilege Access** (defaults to creator-private `Edit` access), **1-2 sentence Audience/Scope summary**, **3-4 key rules**, and the **`3-5` verified Sample Questions** (plus an optional offer to run a 1-question live chat smoke test or `looker-ca-agent-optimize` benchmark).
- **Optional Group Sharing Wizard (`View` Access):** When `content_metadata_id` is present, ask if the user wants to grant chat-only (`View`) access to any Looker user group. If **Yes**, list groups via `looker-cli api group all_groups` (if unnamed) and run `looker-cli api content create_content_metadata_access -` (`{"content_metadata_id": "<content_metadata_id>", "group_id": "<group_id>", "permission_type": "view"}`).
- **Role-Aware LookML Metadata Gate (When Missing `description:` / `label:` Fields Were Spotted):**
  - **If `has_develop_permission == true`:** Ask one simple **Yes / No** question to add the spotted `description:` / `label:` fields in Looker `dev_mode`. Only if the user replies **Yes**, read [lookml-ca-modeling-standards.md](lookml-ca-modeling-standards.md) (`Lines 20-28`) and execute the `dev_mode` patch (`validate_project` `0` errors).
  - **If `has_develop_permission == false`:** Do **not** offer `dev_mode`; provide a concise copy-ready **Note for Your LookML Developer** listing the 2-4 suggested `description:` / `label:` additions.
