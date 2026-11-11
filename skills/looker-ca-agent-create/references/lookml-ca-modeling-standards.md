# LookML Modeling Standards for Conversational Analytics (CA)

This shared reference defines the LookML semantic layer standards used by `looker-ca-agent-create` and `looker-ca-agent-optimize` for two purposes:
1. **Understanding SQL & Join Semantics During Agent Design:** Reading `.model.lkml` / `.explore.lkml` and core `.view.lkml` files in parallel so the CA Agent's instructions and Golden Queries reflect real metric formulas, currency normalization, join relationships, and `+view_name` refinements.
2. **Optional Post-Execution LookML Improvements (Gate #2 — Simple Yes / No):** Offering to fix missing LookML `description:` or `label:` metadata **only after** the CA Agent has already been created or optimized, and applying edits only if the user answers **Yes**.

---

## 1. Metadata Richness (`description:` and `label:`)

- **Clear `description:` on Key Exposed Fields:** Important dimensions, dimension_groups, filters, and measures exposed to a CA Agent benefit from concise, business-oriented `description:` text explaining what the field represents, its unit or currency, and valid filter examples if categorical.
- **Human-Readable `label:` and `view_label:`:** Clarify cryptic column names (e.g., `cust_ltv_amt_usd` -> `label: "Customer Lifetime Value (USD)"`) so business users and CA Agents match terms naturally.
- **Avoid Overfitting Descriptions:** Write reusable business descriptions rather than pasting verbatim test questions into LookML.

---

## 2. Refinement Awareness & Join / Noise Guardrails

- **Respect LookML Refinements (`view: +view_name`) Across `raw/` and `refined/` Layers:** Enterprise LookML projects commonly define base columns in `views/raw/*.view.lkml` and enrich those same fields in `views/refined/*.view.lkml` using `view: +view_name` (or `extends:`). Looker compiles a refined field into a single dimension—**never mistake a `+view_name` refinement for a duplicate field**, and always apply metadata additions to the `refined/` layer when one exists.
- **Prefer Instruction Disambiguation Over Risky `hidden: yes` Changes:** Never add `hidden: yes` to fields that may be referenced by existing dashboards or Explores. If two fields look similar to the CA Agent, disambiguate them inside the agent's `semantic_and_execution_rules:` instructions rather than risking a breaking LookML edit.
- **Check Join Integrity (`primary_key: yes` & Expensive Joins):** Inspect Explore `join:` blocks in `.model.lkml` / `.explore.lkml` for `relationship:` cardinality, `primary_key: yes` on joined views, `filter_only` parameters, and expensive regex or cross joins so the agent's instructions avoid fanouts and slow queries.

---

## 3. Gate #2 Optional LookML Workflow (Ask Simple Yes / No After Agent Is Ready)

Never block agent creation or optimization behind technical LookML diffs or multi-option menus:

1. **Summarize Plainly at Gate #2 (After Creating or Optimizing the Agent):**
   - If key exposed fields lack `description:` or clear `label:` metadata, mention them briefly in plain language (2-4 bullet points max, no raw `.lkml` code blocks) right after confirming the created/optimized agent, and ask:
     *"I also noticed a few LookML fields are missing clear descriptions or labels (such as ...). Would you like me to add those in Looker development mode? (Yes / No)"*
   - If the user answers **No**, stop immediately—the CA Agent is already live and complete.
2. **Safe `dev_mode` Execution (Only When User Answers Yes):**
   - Enable Looker development mode via Looker MCP `dev_mode` (`{"devMode": true}`). Check `get_git_branch` for the `project_id`: if the workspace is still on a read-only `__LOOKER_PROD_*` ref (or if `update_project_file` returns `400 No developer copy found for requested project`), switch to an existing non-production dev branch via `switch_git_branch` or initialize one via `create_git_branch` (for example, `ca-metadata-<model>`) before writing files.
   - Read each target file in full via `get_project_file` first (targeting `views/refined/` when refinements exist) and apply **surgical, additive `description:` / `label:` / `primary_key: yes` edits** via `update_project_file`, preserving every existing field, join, expression, and developer comment verbatim.
   - Run `validate_project` (and `run_lookml_tests` if tests exist) to confirm **`0` LookML errors**. If any compilation error occurs, immediately revert the file using the pre-edit `get_project_file` content.
   - **Never auto-commit or deploy LookML to production:** Leave validated edits safely on the `dev_mode` branch, switch the MCP session back to production (`dev_mode` `{"devMode": false}`), save a backup patch to `/tmp/ca_lookml_patch_<agent_id>.diff` when local writes are available, and confirm completion concisely in plain language.
