# LookML Modeling Standards for Conversational Analytics (CA)

This shared reference defines the LookML semantic layer requirements enforced by `looker-ca-agent-optimize` and `looker-ca-agent-create`. A Conversational Analytics (CA) Agent relies directly on LookML metadata to select fields, build filters, and prevent join fanouts.

---

## 1. Metadata Richness (`description:` and `label:`)

- **Mandatory `description:` on Exposed Fields:** Every dimension, dimension_group, filter, and measure exposed to a CA Agent must include a clear, business-oriented `description:` parameter explaining what the field represents, its unit or granularity, and valid filter examples if categorical.
- **Clear `label:` and `view_label:`:** Replace cryptic database column names (e.g., `cust_ltv_amt_usd`) with human-readable labels (`label: "Customer Lifetime Value (USD)"`) and logical `view_label:` groupings so the agent can match natural language terms without guessing.
- **Avoid Overfitting Descriptions:** Write general, reusable semantic descriptions and synonyms rather than stuffing verbatim test questions into a field's `description:`.

---

## 2. Noise Reduction (`hidden: yes` and Explore `fields:`) & Refinement Awareness

Uncurated Explores with hundreds of technical columns degrade CA Agent accuracy and increase reasoning latency, but LookML modifications must never break existing project architecture:

- **Hide Technical & Internal Keys Only When Safe:** Mark raw surrogate IDs, ETL audit columns, and deprecated fields with `hidden: yes` only after verifying they are not used by existing dashboard filters or Explore joins.
- **Respect LookML Refinements (`view: +view_name`) & Raw/Refined Layers:** Enterprise LookML projects commonly define base columns in `views/raw/*.view.lkml` and refine those same fields in `views/refined/*.view.lkml` using `view: +view_name` (or `extends:`) to add `description:`, `group_label:`, or formatting. Looker compiles a refined field into a single dimension—**never mistake a LookML refinement (`+view_name`) for a duplicate field**.
- **Verify Satellite View Semantics Before Hiding Fields:** When an Explore joins filtered satellite views (e.g., `v_llm_response`, `v_tool_error`), verify whether dimensions in those views are intentionally scoped or referenced by LookML dashboards before recommending `hidden: yes`. If a field is ambiguous only for the CA Agent, prefer disambiguating it in `<explore_and_filtering_rules>` inside the CA Agent's system instructions rather than risking a breaking LookML change.
- **Scope Fields at the Explore Level:** When an Explore joins large views, use the Explore `fields:` parameter (for example, `fields: [ALL_FIELDS*, -raw_events.internal_payload, -users.password_hash]`) to exclude irrelevant columns from the CA Agent's context window.

---

## 3. Declarative Measures Over Table Calculations

- **Model Core Metrics as LookML Measures:** Define business KPIs, ratios, and aggregations as declarative LookML `measure:` objects (`type: sum`, `type: count_distinct`, `type: number` with safe `NULLIF` division) rather than relying on the CA Agent to invent runtime table calculations.
- **Standardize Filtered Measures:** For recurring business segments (such as `active_users_count` or `completed_orders_revenue`), create dedicated LookML measures using the `filters:` parameter so the agent can query the metric in one step.

---

## 4. Join Integrity & Symmetric Aggregates (`primary_key: yes`)

- **Mandatory Primary Key in Every Joined View:** Every LookML view participating in an Explore `join:` must declare `primary_key: yes` on a unique dimension (or a compound primary key dimension) to enable Looker Symmetric Aggregates and prevent fanout double-counting.
- **Explicit `relationship:` Declaration:** Every `join:` block in an Explore must explicitly declare the true cardinality (`relationship: many_to_one`, `one_to_many`, `one_to_one`, or `many_to_many`) and use `sql_on: ${left_view.key} = ${right_view.key} ;;`.

---

## 5. Safe LookML Dev-Branch Workflow & Impact Validation

Before proposing or applying any LookML change (`Plan B`), validate that it is genuinely safe and non-destructive:
1. **Pre-Proposal Sanity Check (`[LookML Safety & Impact Check]`):** Inspect both the compiled Explore (`get_dimensions`, `get_measures`) and raw/refined `.view.lkml` files (`get_project_file`). Confirm the change does not break refinements (`+view_name`), Explore `sql_on` joins, or existing dashboards.
2. **Isolated Development Mode (`dev_mode`) Execution (Upon User Approval Only):**
   - Switch to the developer's workspace using Looker MCP `dev_mode` (`{"devMode": true}`).
   - **Surgical In-Place Edits Only (Never Full-File Rewrites):** Always fetch the latest complete file content via `get_project_file` first (targeting the `refined/` view file when a `raw/` + `refined/` architecture is used) and apply surgical, additive metadata edits via `update_project_file`, preserving all existing fields, joins, formatting, and developer comments verbatim.
   - Run `validate_project` (and `run_lookml_tests` if tests exist) to verify zero LookML compilation errors. If `validate_project` reports any error caused by the edit, revert the file immediately using the pre-edit `get_project_file` buffer.
   - **Never auto-deploy to production:** Keep the validated changes in `dev_mode` and export `/tmp/ca_lookml_patch_<agent_id>.diff` (or render the unified diff inline in chat when local file writes are unavailable) with handoff notes for peer review.
