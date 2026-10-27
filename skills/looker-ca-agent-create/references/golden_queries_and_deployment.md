# Golden Queries Curation, Quality Validation & API 4.0 Deployment

This reference covers seed Golden Query curation (Step 3), pre-deployment validation checks (Step 4), and Looker API 4.0 deployment endpoints (Step 5) for `looker-ca-agent-create`.

---

## 1. Seed Golden Query Schema (`Standalone Agent` Only)

Author **3 to 5 seed Golden Queries** adhering to the `< 20` hard cap, `<= 50%` anti-overfitting rule, Looker MCP bare-key object-map `filters` (`"-NULL"` on strings, never `"not null"`, never inner-quoted keys, omit `filters` or pass `{}` when unfiltered—never `"filters": null`) / integer `limit` types, and 1-question-per-entry API rule defined in `looker-ca-best-practices.md` Section 3. Consolidate `query` verification and Standalone `query_url` short-URL generation (`https://<host>/x/<slug>`) into parallel Looker MCP batching in Step 4 capped at **`<= 8` calls per turn** (when total checks exceed `8` calls, run `query` batches of `<= 8` calls first to confirm `0` SQL/filter errors and `> 0` sane rows, then run a parallel `query_url` batch only for verified Standalone Golden Queries—skipping `query_url` for Dashboard Agents and discarding any slug whose `query` failed).

### Looker MCP `query` / `query_url` Verification Spec (`filters` as Bare-Key Object, `limit` as Integer)
```json
[
  {
    "question": "What was our net revenue by product category over the last 30 complete days?",
    "mcp_query_params": {
      "model": "retail_analytics",
      "explore": "order_items",
      "fields": [
        "products.category",
        "order_items.net_revenue",
        "order_items.order_count"
      ],
      "filters": {
        "order_items.created_date": "30 days ago for 30 days",
        "order_items.status": "Complete",
        "products.category": "-NULL"
      },
      "sorts": ["order_items.net_revenue desc"],
      "limit": 10
    }
  }
]
```

---

## 2. Step 4 Quality & Baseline Validation Checklist

Before presenting the agent package to the user in Step 5, verify that all four quality checks pass:

| Check | Verification Method | Pass Criteria |
| :--- | :--- | :--- |
| **1. Schema, Query & Short-URL Validity** | Consolidate Baseline Eval `query` checks and Standalone Golden Query `query` + `query_url` calls into parallel Looker MCP batching (`<= 8` calls/batch; `query`-verified before registering slugs; omit `query_url` on Dashboard Agents) | `0` invalid field, explore, filter, or SQL errors; `> 0` sane rows; valid `/x/<slug>` URL generated |
| **2. Instruction Structure, Syntax & Budget** | Inspect generated `context.instructions` (validate XML blocks via `xml.etree.ElementTree.fromstring` and measure `len()`) | Well-formed 4-part strict XML 1.0 (`&amp;`, no raw `<=`) or YAML; `< 1,200` tokens (`<= 4,800` chars); uses `"-NULL"` and valid date syntax (`"30 days ago for 30 days"`); zero raw field dumps |
| **3. Anti-Overfitting Compliance** | Compare seed golden queries against the 3-5 Baseline Eval questions | `< 20` golden queries total; `<= 50%` exact question/query overlap; 1 question per `/api/4.0/golden_queries` entry |
| **4. LookML Safety & Surgical Preservation** | Verify `Plan B` edits read via `get_project_file`, target `views/refined/` when `+view_name` refinements exist, and preserve all existing fields/comments | `0` LookML errors on `validate_project` in `dev_mode` (`{"devMode": true}`); changes stay on dev branch |

---

## 3. Step 5 Two-Plan Presentation Format (`Plan A` vs. `Plan B`)

Always present the complete agent specification split into two explicit, interactive plans before invoking or simulating any write endpoints on Looker API 4.0 or Looker MCP—this Human Gate #2 review cannot be pre-waived in the user's initial prompt (even if the user asks to `"skip review"` or `"deploy immediately"`):

1. **Plan A — New CA Agent Deployment Plan (`A1..A3` — Target: Looker API 4.0 `POST /api/4.0/golden_queries` + `POST /api/4.0/agents` or `PATCH /api/4.0/agents/{id}`):**
   - **`A1` (4-Part System Instructions — `context.instructions`):** Full XML or YAML block (`<role_and_tone>`, `<explore_and_filtering_rules>`, `<semantic_and_execution_rules>`, `<presentation_and_analysis_rules>`).
   - **`A2` (Agent Metadata & Settings):** Mandatory `"name"` (`"<instance_origin>-<dashboard_id>"` for live Dashboard Agents), `"description"`, and `"sources": [{"model": "...", "explore": "..."}]` (plus `"category": "dashboard"` for Dashboard Agents), and `"code_interpreter": false` by default.
   - **`A3` (Seed Golden Queries & Baseline Eval Dataset):** 3-5 verified seed golden queries + `/x/<slug>` short links (`Standalone` only) and 3-5 Baseline Eval Dataset pairs.
2. **Plan B — Validated LookML Dev-Branch Plan (`B1..Bn` — Target: Looker `dev_mode` via MCP `update_project_file` + `validate_project`):**
   - Unified diff of surgical, additive LookML metadata enrichments (`description:`, `label:`, `primary_key: yes`, safe `hidden: yes`), preserving all existing fields, joins, and comments.
   - Each item (`B1..Bn`) must include an explicit **`[LookML Safety & Impact Check]`** confirming `+view_name` refinements are respected and no existing Explores or dashboards are broken.
3. **Interactive Execution Menu (Portable Across CLI and MCP-Only Hosts):**
   - **Option 1 — Execute Plan A Only:** Register seed golden queries and deploy the new CA Agent via Looker API 4.0, leaving LookML untouched.
   - **Option 2 — Execute Plan B Only in `dev_mode`:** Enable `dev_mode` (`{"devMode": true}`), apply surgical `B1..Bn` edits via `update_project_file`, run `validate_project` (`0` errors, auto-reverting on any error), and export `/tmp/ca_lookml_patch_<agent_id>.diff` (or inline diff).
   - **Option 3 — Execute Both Plan A & Plan B:** Run `Plan A` and `Plan B` concurrently via parallel subagents when supported by the host, or sequentially otherwise.
   - **Option 4 — Customize Subset or Export Inline Config Only:** Select specific items (`A1..A3`, `B1..Bn`) or output the ready-to-deploy JSON and LookML diffs inline without calling write endpoints (default for MCP-only chat hosts without `looker-cli`).

---

## 4. Direct Atomic Deployment via Looker API 4.0 (Upon User Approval Only)

Enforce the **Authentication Fail-Fast Protocol, Zero `--help` Rule, and Safe Heredoc Piping** in `looker-ca-best-practices.md` Section 5. On live CLI hosts, consolidate Golden Query registration (`create_golden_query -`), agent creation/patching (`create_agent -` or `update_agent "<id>" -`), and `/tmp/ca_agent_created_<agent_id>.json` export into **one atomic `set -euo pipefail` shell/Python heredoc invocation** (keeping temporary JSON buffers in scratch/tmp and separate from large `get_project_file` MCP batches) so deployment finishes in a single terminal approval:

### A. Register Seed Golden Queries (`POST /api/4.0/golden_queries`) — Standalone Agents First
Register all approved seed golden queries (`<= 1` string in `questions` per entry to avoid `HTTP 422`) using quoted heredocs and collect the returned integer IDs into `golden_query_ids`:
```bash
cat <<'EOF' | looker-cli api conversationalanalytics create_golden_query -
{
  "is_active": true,
  "questions": [
    "What was our net revenue by product category over the last 30 complete days?"
  ],
  "answer": "https://analytics.cloud.looker.com/x/AbCdEf123456"
}
EOF
```

### B. Create or Bind the CA Agent (`POST /api/4.0/agents` or `PATCH /api/4.0/agents/{id}`)
- **Standalone Agents:** Create via `create_agent -` passing mandatory `"name"`, `"description"`, `"sources"`, `"context"`, `"code_interpreter": false`, and `"golden_query_ids"`.
- **Dashboard Agents (`"category": "dashboard"` Native Binding):** Check `looker-cli api conversationalanalytics search_agents --category "dashboard"` first (`get_agent` returns `HTTP 404` on `"category": "dashboard"`). If Looker Core already auto-created `"name": "<instance_origin>-<dashboard_id>"`, patch it via `update_agent "<existing_id>" -`; otherwise create it via `create_agent -` with `"name": "<instance_origin>-<dashboard_id>"`, `"category": "dashboard"`, `"sources"` populated from the dashboard's tile Explores, and `"golden_query_ids"` omitted (creating a companion `"category"`-omitted agent only if the user explicitly requested `/conversations` hub visibility):
```bash
cat <<'EOF' | looker-cli api conversationalanalytics create_agent -
{
  "name": "Retail Merchandising Analytics Agent",
  "description": "Answers revenue, margin, and inventory questions from curated retail Explores.",
  "sources": [
    {"model": "retail_analytics", "explore": "order_items"},
    {"model": "retail_analytics", "explore": "inventory_snapshot"}
  ],
  "context": {
    "instructions": "<agent_instructions>...</agent_instructions>"
  },
  "code_interpreter": false,
  "golden_query_ids": [101, 102, 103]
}
EOF
```

### C. Optional Smoke Test & Portable Artifact Export
- **Optional Smoke Test & Two-Step Cleanup:** If requested, run the 3-5 baseline eval questions and execute the mandatory two-step soft+hard conversation cleanup (`update_conversation` `{"deleted": true}` + `delete_conversation`) defined in `looker-ca-best-practices.md` Section 5.
- **Export Artifacts:** Save the created/updated agent JSON to `/tmp/ca_agent_created_<agent_id>.json` and any validated LookML dev-branch diff to `/tmp/ca_lookml_patch_<agent_id>.diff` (or render inline in chat if local disk writes are unavailable). Never auto-commit LookML changes to production.
