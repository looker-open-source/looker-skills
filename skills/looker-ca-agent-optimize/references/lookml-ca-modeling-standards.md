# LookML Modeling Standards for Conversational Analytics (CA)

Shared LookML semantic-layer reference for `looker-ca-agent-create` and `looker-ca-agent-optimize`:
- **Lines `1-18` (Sections 1-2):** Load during Step 2 **only** when `has_develop_permission == true` (to inspect `.lkml` refinements, joins, and metadata gaps) or when formatting a non-developer handoff note.
- **Lines `20-28` (Section 3):** Load **only after** the user replies **Yes** at Gate #2 to apply `dev_mode` LookML edits.

## 1. Metadata Richness (`description:` and `label:`)

- **Business `description:` on Exposed Fields:** Key dimensions, dimension_groups, filters, and measures exposed to a CA Agent should have concise `description:` text stating business meaning, unit/currency, and valid categorical filter examples (without overfitting to verbatim test prompts).
- **Clear `label:` and `view_label:`:** Clarify cryptic identifiers (e.g., `cust_ltv_amt_usd` -> `label: "Customer Lifetime Value (USD)"`).

## 2. Refinement Awareness (`view: +view_name`) & Join Guardrails

- **Respect `raw/` vs. `refined/` Layers:** Enterprise LookML projects define base columns in `views/raw/*.view.lkml` and enrich them in `views/refined/*.view.lkml` via `view: +view_name` (or `extends:`). Looker compiles a refined field into one dimension—never mistake `+view_name` for a duplicate field, and always target the `refined/` file when adding metadata.
- **Disambiguate in YAML Over Risky `hidden: yes`:** Never add `hidden: yes` to fields that existing dashboards or Explores may depend on; disambiguate similar fields inside `semantic_and_execution_rules:`.
- **Inspect Joins & SQL Guards:** Check `.model.lkml` / `.explore.lkml` `join:` blocks for `relationship:` cardinality, `primary_key: yes`, `always_filter`, `conditionally_filter`, `sql_always_where`, and Liquid `_is_filtered` SQL guards to prevent fanouts and query failures.

---

## 3. Gate #2 Optional `dev_mode` Execution (Load Only After User Replies Yes)

1. **Gate #2 Prompt Rule (Before Reading Section 3):**
   - When `has_develop_permission == true` and exposed fields lack `description:` or `label:` (or `is_lookml == true` agent instructions need updating), summarize 2-4 examples in plain language (zero raw `.lkml` diffs) after confirming the agent and ask a single **Yes / No** question to apply them in Looker `dev_mode`. If the user answers **No**, stop immediately.
2. **Safe `dev_mode` Write & Validation Protocol (When User Answers Yes):**
   - Enable `dev_mode` (`{"devMode": true}`). Check `get_git_branch(project_id)`: if on a read-only `__LOOKER_PROD_*` ref (or `update_project_file` returns `400 No developer copy found`), switch to an existing dev branch via `switch_git_branch` or create one via `create_git_branch` (e.g., `ca-metadata-<model>`).
   - Read each target file in full via `get_project_file` (targeting `views/refined/` when present, or the project-relative `.lkml` path resolved from `lookml_edit_uri` + `get_project_files` for `is_lookml: true` agents) and apply surgical, additive edits via `update_project_file`, preserving all existing fields, expressions, and comments verbatim.
   - Run `validate_project` (and `run_lookml_tests` if present) to verify **`0` LookML errors**; auto-revert immediately using pre-edit `get_project_file` content if any error occurs.
   - **Never auto-commit or deploy to production:** Leave validated edits on the dev branch, set `dev_mode` to `{"devMode": false}`, save `/tmp/ca_lookml_patch_<agent_id>.diff` (wrapped in `try/except OSError`), and confirm concisely.
