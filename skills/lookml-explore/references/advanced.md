---
name: lookml-explore-advanced
description: Use this skill for advanced Explore configurations like UNNESTing arrays, using `access_filter` for row-level security, and complex `sql_always_where` logic.
---

# Instructions

1.  **UNNEST / LATERAL FLATTEN**:
    *   These are SQL concepts used to flatten arrays.
    *   Use them in `join` definitions with `sql:` or `sql_table_name`.
    *   Example: `join: items { sql: LEFT JOIN UNNEST(${orders.items}) as items ;; ... }`
2.  **Access Filter**:
    *   Used for Row-Level Security (RLS).
    *   Requires a `user_attribute` to be defined in Looker Admin.
    *   Syntax: `access_filter: { field: view.field, user_attribute: attribute_name }`
3.  **SQL Always Where**:
    *   Applies a WHERE clause that users cannot change.
    *   Use `${view.field}` references for portability.
    *   Can use `sql_always_having` for aggregate filtering.

# Examples

## UNNESTing an Array (BigQuery Standard SQL)

```lookml
explore: orders {
  join: items {
    # Using UNNEST to flatten the repeated record 'items'
    sql: LEFT JOIN UNNEST(${orders.items}) as items ;;
    relationship: one_to_many
  }
}
```

## LATERAL FLATTEN (Snowflake)

```lookml
explore: orders {
  join: items {
    sql: , LATERAL FLATTEN(input => ${orders.items}) as items ;;
    relationship: one_to_many
  }
}
```

## Row-Level Security (Access Filter)

```lookml
explore: sales {
  access_filter: {
    field: sales.region
    user_attribute: allowed_regions
  }
}
```
