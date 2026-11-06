# Golden Queries Verification, Default Atomic Creation & Gate #2 Summary

This reference covers Seed Golden Query verification (Step 3), Default Atomic Agent Creation (Step 4), and the Concise Executive Confirmation + Optional Yes/No LookML Offer (Step 5) for `looker-ca-agent-create`.

---

## 1. Seed Golden Query Verification (Step 3 — `Standalone Agent` Only)

Author **3 to 5 seed Golden Queries** (`< 20` cap, 1 question per entry) grounded in the real fields, SQL formulas, and date coverage discovered in Step 2:
1. **Verify via `query` Before `query_url` (`<= 8` Calls/Batch):**
   - Run all `3-5` Seed Golden Queries in **one parallel Looker MCP `query` batch** first (bare-key object `filters` with `"-NULL"` on strings—never `"not null"` and never `"filters": null`—and integer `limit`).
   - If any query hits a BigQuery partition rule or returns `0 rows`, repair its filter and re-verify via `query`.
   - Once all `3-5` queries pass with `0` SQL errors and `> 0` sane rows, generate their `/x/<slug>` short links in **one parallel `query_url` batch** (skipping `query_url` completely for Dashboard Agents).

---

## 2. Default Atomic Agent Validation & Creation (Step 4)

Once Gate #1 scoping is complete and Step 3 queries pass, **create the CA Agent automatically by default** without pausing beforehand for `"Plan A / Plan B"` menus (unless the user explicitly asked for a dry-run preview without creating the agent, or `looker-cli` is unavailable on an MCP-only host).

Consolidate **strict XML 1.0 / character-length validation (`len <= 4800`)**, **Golden Query registration (`create_golden_query -`)**, **Agent creation or Dashboard binding (`create_agent -` or `update_agent "<id>" -`)**, and **snapshot export (`/tmp/ca_agent_created_<id>.json`)** into **one single atomic command** (`set -euo pipefail` / single `python3 - <<'PY'` script):

1. **Validate Instructions In-Memory (`0.1s`):**
   - Assert `len(instructions) <= 4800` and, in XML mode, parse via `xml.etree.ElementTree.fromstring(instructions)` (auto-escaping any bare `&` that is not already `&amp;`/`&lt;`/`&gt;`/`&quot;`/`&apos;`) before calling Looker API 4.0.
2. **Register Verified Golden Queries (`Standalone` Only):**
   - Call `looker-cli api conversationalanalytics create_golden_query -` for each of the `3-5` verified `/x/<slug>` URLs (`{"is_active": true, "questions": ["<single_question>"], "answer": "https://<host>/x/<slug>"}`) and collect integer `golden_query_ids`.
3. **Create or Bind the CA Agent:**
   - **Standalone Agent:** Call `create_agent -` with mandatory `"name"`, `"description"`, `"sources"`, `"context": {"instructions": ...}`, `"code_interpreter": false`, and `"golden_query_ids"`.
   - **Dashboard Agent:** Check whether `"name": "<instance_origin>-<dashboard_id>"` already existed in Step 1 `search_agents --category "dashboard"`; if so, patch it via `update_agent "<existing_id>" -`, otherwise create it via `create_agent -` with `"name": "<instance_origin>-<dashboard_id>"`, `"category": "dashboard"`, `"sources"` from tile Explores, `"context"`, and `"code_interpreter": false` (omitting `"golden_query_ids"`).
4. **Save Local Snapshot:** Write the resulting agent JSON to `/tmp/ca_agent_created_<agent_id>.json` (when local writes are available).
5. **MCP-Only Host Fallback:** If `looker-cli` is absent in a chat-only environment, clearly tell the user the agent specification is ready to import and provide the ready-to-apply payload concisely.

---

## 3. Step 5: Executive Confirmation & Gate #2 Optional LookML Offer *(Yes / No)*

Keep the Step 5 user response **concise, business-friendly, and free of technical walls** (`~10-15` lines total; never mention `"Plan A"` or `"Plan B"` and never dump raw XML/YAML code blocks unless requested):

### Part 1 — Confirm the Newly Created Agent
- **Agent Created:** Bold Agent Name, Agent ID (`<id>`), and direct Looker UI link (`https://<host>/conversations` or agent/dashboard URL).
- **Description & Audience:** 1-2 clear sentences explaining who the agent serves and which Explore(s) or Dashboard it uses.
- **Configured Behavior:** 3-4 short plain-language bullets summarizing its default date window, key metrics, and rules.
- **Sample Questions Ready to Ask:** List the `3-5` verified natural-language questions (for Standalone Agents) or key Dashboard drill-downs.

### Part 2 — Gate #2: Simple Yes / No Question for Optional LookML Improvements
- Right below the confirmation, if Step 2 spotted important exposed fields missing `description:` or clear `label:` metadata in LookML, ask **one simple Yes / No question** in plain language (listing 2-4 example fields, with zero raw `.lkml` diffs):
  > *"I also noticed a few fields in LookML are missing clear descriptions or labels (such as `...`). Would you like me to add those improvements in Looker development mode? (**Yes / No**)"*
- **If the user answers No:** Acknowledge briefly and finish.
- **If the user answers Yes:** Enable `dev_mode` (`{"devMode": true}`), read target `.view.lkml` files via `get_project_file` (targeting `views/refined/` when refinements exist), apply surgical additive `description:` / `label:` edits via `update_project_file`, verify **`0` errors** via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<agent_id>.diff`, and confirm in 2-3 plain lines that the changes are ready on their Looker development branch.
