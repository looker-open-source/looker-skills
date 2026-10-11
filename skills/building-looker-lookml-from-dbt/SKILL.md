---
name: building-looker-lookml-from-dbt
description: Use this skill to generate LookML views and explores from a finished dbt fact or dim model. Covers dimension and primary key generation from the model's YAML, measure and derived-metric suggestions on fact models, and join suggestions from foreign keys and `relationships` tests. Read-only on dbt; never builds or edits dbt models.
license: Apache-2.0
metadata:
  publisher: Mostafa Ahmed (mustafaa7med)
  version: v1
---

# Instructions

This skill is a one-way, downstream bridge: it reads a finished dbt fact or dim model (prefixes vary by project: `fct_`, `fct__`, `fact_`, `dim_`, `dim__`) and writes LookML into a Looker project the user points you to. It never creates or modifies dbt models. If no fact or dim model exists yet, say so and stop.

Where a rule in this skill does not cover the situation, ask the user a short clarifying question rather than guessing. Use the defaults in "Non-interactive runs" only when no user can answer.

## 1. Locate the Looker Project

LookML lives in a Looker project, usually a **separate Git repo** from the dbt project.

-   **Ask the user where it lives** if that is not already established (a cloned repo path, or a Looker project reachable through the Looker CLI or MCP server). Never assume or create a location.
-   Read the existing `.view.lkml` and `.model.lkml` files to learn the team's convention: folder layout, naming, `include:` style, `group_label` and `hidden` usage, join parameters. **A convention found in the target project wins over the defaults in this skill and over style rules in the sibling skills (for example `group_label` on key fields)**. Only these are not overridable: `primary_key: yes` placed first, a `description` on every field, and `label`, `description` and an explicit `view_name` on every explore you write, and an explicit `relationship` on every join you write. Existing explores are not rewritten to add these; they are reported. If there is nothing to infer from, use `views/[datasource_name]/[view_name].view.lkml` (where `[datasource_name]` is the source or schema the views come from) and tell the user.
-   Staging and intermediate dbt models are not BI-facing. If the user points at one, flag it and confirm before proceeding.

## 2. Understand the Business Context

Look for a dbt **exposure** whose `depends_on` references the model:

```yaml
exposures:
  - name: sales_pipeline_dashboard
    type: dashboard
    depends_on:
      - ref('fct_sales_opportunities')
    description: Tracks stage progression and conversion for the sales team.
```

Use the exposure's `description` to ground field descriptions and metric suggestions. If there is no exposure, fall back to the model's own `description` in its dbt YAML. **If neither says what the table represents, ask.** Do not invent the use case.

## 3. Check for an Existing View

Derive the filename from the model name and search the whole target project for it, and for an existing explore on the model. **If the view exists, stop and ask** whether to update, leave, or replace it. When updating, compare the dbt model's columns with the existing view and propose only the delta: columns missing from the view, and view fields whose column no longer exists. Never regenerate or reorder an existing file, and leave hand-written fields (extra dimensions, measures, sets) untouched. If nothing is missing, report that the view is already in sync. Apply the same delta rule to an existing explore: propose only missing joins, and never rewrite it. See "Non-interactive runs" for what to do when you cannot ask. If the view exists but the explore does not (or the reverse), continue with the missing half only. Never overwrite silently or create a renamed duplicate.

## 4. Generate the View

Read the model's YAML (columns, `data_type`, `description`, `data_tests`, `meta.looker`) and confirm current columns and types without needing a warehouse where you can: `target/manifest.json`, `target/catalog.json` and `target/compiled/` first, then the model's raw `.sql` (resolve macros as far as you can), then `dbt show --select <model> --limit 1` or the warehouse `information_schema`. The compiled `select` is the source of truth for which columns exist; the YAML supplies descriptions, tests and `meta`. If the YAML documents only some columns, take the rest from the `select` and flag them. Take a type from, in order: the YAML `data_type` (it wins over a sibling view that disagrees; mention the difference), an explicit cast in the SQL (including `null::int` in a `union`, where any typed branch counts), the operand types of a derived expression such as `a || b` or `coalesce(a, b)` when all operands are typed, the upstream model's column type in `target/manifest.json` or `catalog.json`, then the warehouse. Follow the types the project declares. If none of these gives a type, infer one from the column's nature (its name, how it is used in the SQL, and the values it holds), and list the inferred columns in your final message so the user can correct them. If the YAML lists a column the `select` does not return (or the reverse), do not generate it; report the mismatch to the user. Search `models/` recursively; fact and dim models are often in subfolders. Follow [lookml-view](../lookml-view/SKILL.md), [lookml-fields](../lookml-fields/SKILL.md) and [lookml-modeling-guidelines](../lookml-modeling-guidelines/SKILL.md). On top of those:

-   **Naming**: the view name mirrors the dbt model name exactly (`fct_sales_opportunities` -> `fct_sales_opportunities.view.lkml`). Do not shorten or reorder it.
-   **`sql_table_name`**: resolve the real location from `relation_name` in `target/manifest.json` when present, otherwise from the model's `database`/`schema`/`alias` config and the dbt profile's target schema, in the target dialect's quoting. A `relation_name` pointing at a dev or personal schema (for example `dev_<name>`) is not the production location: prefer the schema the existing views in the target project use, and confirm with the user. If it cannot be resolved, ask. Never hardcode a name that can drift from how dbt materializes it.
-   **Primary key**: a column with `unique` + `not_null` tests (or a single-column `unique_key`) becomes `primary_key: yes` and is the **first** dimension. If no column qualifies, or the key is composite, ask the user which column is unique, or whether to build a concatenated key dimension. Every view needs one. Follow the target project's convention for hiding key fields.
-   **Types**: map warehouse types with [references/mapping-dbt-types-to-lookml.md](references/mapping-dbt-types-to-lookml.md). Dates and timestamps always become a `dimension_group` of `type: time`, never a plain `string` or `number`.
-   **Descriptions**: every dimension and measure gets a `description`, taken from the dbt column description when present. For undocumented columns use the SQL comment if there is one, otherwise a short factual description derived from the column name and its source, and list these columns in your final message as auto-described.
-   **`meta.looker` overrides win** over anything inferred. Apply its keys directly onto the generated field.

### Fact models

-   Generate dimensions for all columns, then **basic measures** that follow directly from the columns: one `type: count` (no `sql`), and `sum` on columns that are genuinely additive at the table's grain. A column is not additive if it is denormalized from a parent entity and repeated on every child row (an opportunity's ARR on each activity), a balance or snapshot value, a rate, or a percentage. Everything else is a suggestion that waits for confirmation: `avg_*`, `count_distinct` of an entity, ratios, rates, durations and conversion metrics.
-   **Identify the grain before adding sums.** On a periodic snapshot or history table (one row per entity per day), summing an amount across rows is wrong. Ask the user how the table should be aggregated, and prefer filtering to a single snapshot date or counting distinct entities.
-   Name the row count `count`; name other measures `count_*`, `total_*` (sums), `avg_*`. Give them a `description`, `value_format_name` where applicable, and `drill_fields` (a set, defined in the same view file) on counts.
-   In measures, reference either `${dimension}` or `${TABLE}.column`, whichever the target project's existing measures use. If it has none to learn from, use `${dimension}`.
-   **Suggest derived business metrics, never add them unprompted.** See [references/suggesting-fact-metrics.md](references/suggesting-fact-metrics.md).

### Dim models

-   Generate dimensions only by default. A dim describes entities, not events, so do not suggest business metrics here; those belong on the fact side.
-   **Ask the user whether they want any measures on this dim** (for example `count` for entity counts) before writing one. Add them only on a yes, and only the ones they name or approve.

## 5. Create or Update the Explore

A fact model is usually the base of an explore. Follow [lookml-explore](../lookml-explore/SKILL.md) and [references/generating-explores-and-joins.md](references/generating-explores-and-joins.md):

-   Every explore needs `label`, `description` and `view_name`; every join needs `relationship` and `sql_on`.
-   **Suggest joins, do not assume them.** Present each candidate FK-to-dim join and write it only after the user confirms.
-   Use granular `include:` paths in the model file. If the existing model file already uses a wildcard include that covers the new views, leave it and do not add redundant lines.
-   Dim models get their own explore only when the user asks.

## 6. Validate

Do not consider the task complete until the LookML validates. Use the Looker CLI (`looker-cli api project validate_project`, see [using-looker-cli](../using-looker-cli/SKILL.md)) or the Looker MCP server ([looker-mcp-skill](../looker-mcp-skill/SKILL.md)) when available. If neither is available, say the LookML is unvalidated and name what to run. Fix errors in your own output only.

## Non-interactive runs

When no user can answer (a scripted or unattended run), never modify an existing view or explore, and list every assumption you made. Creating new files, and appending a new `explore:` block to an existing model file without editing anything already in it, is allowed. Apply these defaults, and list every unanswered question in your final message:

| Question | Default |
| :--- | :--- |
| Where does the Looker project live? | Stop and report that a path is required. Write nothing |
| Existing view or explore | Leave it unchanged. Write the proposed delta to `<view_name>.review.md` next to the target file |
| Ambiguous `sql_table_name` (dev schema, no existing convention) | Use the production convention if one exists in the target project, otherwise stop and report |
| Measures on a dim | None |
| Suggested metrics and joins | List them in the final message or review file. Write none |
| Columns with an inferred type, auto-described columns, or YAML-vs-select mismatches | List them in the final message |
| Two sibling views disagree on a convention (for example timezone handling) | Follow the sibling of the same kind (fact with fact), otherwise the more common pattern, and say which you chose |
| Composite or missing primary key | Stop for that view and report |

## Common Mistakes

| Mistake | Fix |
| :--- | :--- |
| Assuming where the LookML project lives | Ask first (Step 1) |
| Ignoring the target project's existing conventions | Read them in Step 1 and match them |
| Summing a snapshot or history table across days | Identify the grain first (Step 4) |
| Guessing business context without an exposure | Ask a clarifying question |
| Overwriting an existing `.view.lkml` | Stop and ask |
| Measures on a dim model without asking | Dimensions by default; ask whether the user wants any measures |
| Writing a suggested metric or join without confirmation | Suggestions are proposals until confirmed |
| Timestamp emitted as `string` | Use `dimension_group` with `type: time` |
| View without a primary key, or PK not first | Add `primary_key: yes` as the first dimension |
| Join without an explicit `relationship` | Always set it; confirm cardinality with the user if unproven |
| Building or editing the dbt model | Out of scope |

**Stop and ask before:** writing to a path the user has not confirmed, overwriting an existing view, inventing a metric without context or confirmation, or adding measures to a dim model without the user saying yes.

# Examples

## Fact view (excerpt)

```lookml
view: fct_sales_opportunities {
  sql_table_name: analytics.fct_sales_opportunities ;;

  dimension: opportunity_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.opportunity_id ;;
    description: "Unique opportunity identifier."
  }

  dimension_group: created {
    type: time
    timeframes: [raw, time, date, week, month, quarter, year]
    sql: ${TABLE}.created_at ;;
    description: "When the opportunity was created."
  }

  dimension: amount {
    type: number
    sql: ${TABLE}.amount ;;
    description: "Opportunity amount in USD."
  }

  set: activity_details {
    fields: [opportunity_id, created_date, amount]
  }

  measure: count {
    type: count
    drill_fields: [activity_details*]
    description: "Number of opportunities."
  }

  measure: total_amount {
    type: sum
    sql: ${amount} ;;
    value_format_name: usd_0
    description: "Sum of opportunity amounts."
  }
}
```

## Reference Skills

-   [Mapping dbt types to LookML](references/mapping-dbt-types-to-lookml.md): warehouse type table (Redshift, BigQuery, Snowflake) and dimension group rules.
-   [Suggesting fact metrics](references/suggesting-fact-metrics.md): recognizing metric-worthy column shapes and presenting them for confirmation.
-   [Generating explores and joins](references/generating-explores-and-joins.md): deriving join keys and relationships from FKs and `relationships` tests.
