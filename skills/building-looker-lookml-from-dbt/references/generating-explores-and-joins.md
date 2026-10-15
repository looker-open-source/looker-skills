# Generating Explores and Joins

An explore is a join graph. A fact model is usually the base; dim models are what it joins out to. Every join here is a **suggestion to confirm**, not something to write automatically. For general explore and join rules see [lookml-explore](../../lookml-explore/SKILL.md) and [joins](../../lookml-explore/references/joins.md).

## Finding join candidates

Look at the fact model's columns for foreign keys, typically an `_id` column that is not the table's own primary key:

```yaml
# fct_sales_activity
columns:
  - name: activity_id       # primary key of this table
  - name: opportunity_id    # looks like a foreign key
  - name: activity_type
  - name: logged_at
```

For each candidate, check for a matching dim model:

1.  **A `relationships` test** is the strongest signal:
    ```yaml
    - name: opportunity_id
      data_tests:
        - relationships:
            to: ref('dim_sales_opportunities')
            field: opportunity_id
    ```
    dbt itself confirms the join. Use `to` and `field` directly in `sql_on`.
2.  **No test, but a plausible signal**: the column name matches a dim (`opportunity_id` and a `dim_*opportunities` model), or the column's description names it ("FK to dim_sales_opportunities"). Still only a suggestion. Search `models/` recursively for the dim, since dims often sit in subfolders. A description is stronger than a name match; say which signal you used.
3.  **Neither signal**: do not invent a join. Say you found no confirmed or plausible relationship for that column, in case the user knows of one.

Suggest joins to dims that already have a view in the Looker project as well as to new ones; say which is which.

## Presenting the suggestion

> `fct_sales_activity` has an `opportunity_id` column. `dim_sales_opportunities` exists with `unique` + `not_null` tests on `opportunity_id`. Joining it adds opportunity name, owner and stage. Add this join to the explore?

Write the `join:` block only after the user confirms.

## Join type and relationship

-   Fact-to-dim joins must be left outer so fact rows with a null FK are kept. Write `type: left_outer`, or omit `type:` if the target model's existing joins omit it (left outer is the default).
-   **Always set `relationship` explicitly.** Derive it from the dim side's join column:
    -   `unique` test present: `many_to_one`.
    -   No `unique` test: do not assert `many_to_one`. Tell the user the cardinality is unconfirmed and ask them to confirm it before writing the join. A wrong `many_to_one` on a non-unique key fans out rows and inflates measures.

## Explore requirements

-   `label` and `description` on every explore; set `view_name` explicitly.
-   Explore names in `snake_case`, unique within the model.
-   Add granular `include:` lines to the model file for each view the explore uses, unless the model already has a wildcard include covering them. 
-   Do not use `from` to rename views for aesthetics; use `view_label`.

## Example

Given the `relationships` test above and a `unique` test on `dim_sales_opportunities.opportunity_id`:

```lookml
include: "/views/analytics/fct_sales_activity.view.lkml"
include: "/views/analytics/dim_sales_opportunities.view.lkml"

explore: fct_sales_activity {
  label: "Sales Activity"
  description: "Sales activity events with opportunity details."
  view_name: fct_sales_activity

  join: dim_sales_opportunities {
    type: left_outer
    relationship: many_to_one
    sql_on: ${fct_sales_activity.opportunity_id} = ${dim_sales_opportunities.opportunity_id} ;;
  }
}
```

## Dim models

A dim is normally explored through the facts that join to it. Create a standalone explore only if the user asks.
