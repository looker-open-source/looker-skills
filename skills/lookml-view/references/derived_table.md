---
name: lookml-view-derived-table
description: Use this skill to create Native Derived Tables (NDT) or SQL Derived Tables (SDT), evaluating and nudging towards NDTs where possible.
---

# Instructions

## 1. Guidance: Evaluate Native Derived Tables (NDT) First
When creating rollup views, entity facts (e.g., `user_order_facts`), or aggregated summaries, **evaluate whether a Native Derived Table (NDT)** can be used before writing raw SQL. Where possible, gently nudge towards NDTs.

### Benefits of NDTs (`explore_source`):
- **Single Source of Truth**: Measures (like total revenue or order counts) are defined once in the core source views. NDTs reuse these exact definitions.
- **Inherited Row-Level Security (RLS)**: Access grants and access filters defined on the underlying source Explore are automatically applied to the NDT.
- **Code Drift Prevention**: If underlying column names or table structures change, the NDT stays valid or fails gracefully at compilation time.

### Implementation Checklist for NDTs:
1. Identify a suitable source Explore (`explore_source: [explore_name]`).
2. Map required grouping dimensions and aggregated measures using `column: [output_column_name] { field: [explore_name].[field_name] }`.
3. Add clustering keys (`cluster_keys`) or indexes (`indexes`) on the primary key and common join columns to maximize query performance.
4. Define a persistent materialization trigger (e.g., `datagroup_trigger`) to avoid repeated warehouse table scans.

## 2. Guidance: SQL Derived Tables (SDT)
Use raw `sql` derived tables when an NDT is too complex, restrictive, or when specific SQL features are required.
- **Common SDT use cases**: Database-specific window functions (`RANK()`, `LEAD()`), recursive CTEs, complex unions, precise performance optimizations, or when sourcing from raw tables without an existing Explore.
- It is helpful to add a brief comment explaining why an SDT was chosen if an NDT might have otherwise seemed applicable.

## 3. Persistence
Persistent Derived Tables (PDTs) materialize the query result into a scratch schema in the data warehouse.
- `datagroup_trigger`: Preferred method. Rebuilds the table based on a shared caching policy (`datagroup`).
- `cluster_keys`: Highly recommended for BigQuery/Snowflake.
- `indexes`: Highly recommended for Redshift/Postgres/MySQL.

# Examples

## Entity Fact Rollup: NDT Pattern (Recommended where possible)
To fully understand how an NDT is constructed, see the complete relationship below from the core source View, to the Explore, and finally to the persistent NDT Rollup.

### 1. Core Source View (`order_items.view.lkml`)
Defines the core dimensions and measures. These measures are the Single Source of Truth that the NDT will reuse.

```lookml
view: order_items {
  sql_table_name: `thelook.order_items` ;;

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }

  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }

  dimension: sale_price {
    type: number
    value_format_name: usd
    sql: ${TABLE}.sale_price ;;
  }

  # --- Measures Reused by NDT ---
  measure: count_orders {
    type: count_distinct
    sql: ${TABLE}.order_id ;;
    description: "Total distinct count of orders placed."
    drill_fields: [id, user_id, sale_price]
  }

  measure: total_sale_price {
    type: sum
    value_format_name: usd
    sql: ${sale_price} ;;
    description: "Total commercial revenue generated."
    drill_fields: [id, user_id, sale_price]
  }
}
```

### 2. Underlying Source Explore (`order_items.explore.lkml`)
Orchestrates the joins and applies Row-Level Security (RLS) or access filters, which the NDT will automatically inherit.

```lookml
explore: order_items {
  label: "Order Items & Commerce"

  # Example Row-Level Security access filter automatically applied to our NDT!
  access_filter: {
    field: users.department_id
    user_attribute: department_id
  }

  join: users {
    type: left_outer
    relationship: many_to_one
    sql_on: ${order_items.user_id} = ${users.id} ;;
  }
}
```

### 3. Resulting Persistent NDT Rollup (`user_order_facts.view.lkml`)
Aggregates the underlying transactional records into a high-performance, clustered entity fact table.

```lookml
view: user_order_facts {
  derived_table: {
    datagroup_trigger: embed_demo_default_datagroup
    cluster_keys: ["user_id"]
    explore_source: order_items {
      column: user_id {}
      column: lifetime_orders { field: order_items.count_orders }
      column: lifetime_revenue { field: order_items.total_sale_price }
    }
  }

  dimension: user_id {
    primary_key: yes
    type: number
    hidden: yes
    description: "Unique ID of the user. Clustered key for high-performance joins."
  }

  dimension: lifetime_orders {
    type: number
    description: "Total lifetime count of orders placed by the user, inherited from order_items."
  }

  dimension: lifetime_revenue {
    type: number
    value_format_name: usd
    description: "Total lifetime commercial revenue generated by the user, inherited from order_items."
  }

  dimension: lifetime_orders_tier {
    type: tier
    tiers: [1, 2, 3, 5, 10]
    style: integer
    sql: ${lifetime_orders} ;;
    description: "Cohort tiering based on the user's lifetime orders."
  }
}
```

## Complex Calculation or Raw SQL: SDT Pattern
Use this pattern when an NDT is not a good fit or when specific SQL features (like advanced window functions) are needed.

```lookml
view: user_session_ranks {
  derived_table: {
    datagroup_trigger: embed_demo_default_datagroup
    cluster_keys: ["user_id"]
    sql:
      SELECT
        user_id,
        session_id,
        session_start_time,
        RANK() OVER (PARTITION BY user_id ORDER BY session_start_time) AS user_session_index
      FROM `thelook.events`
      WHERE event_type = 'session_start'
    ;;
  }

  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }

  dimension: session_id {
    type: string
    sql: ${TABLE}.session_id ;;
  }

  dimension: user_session_index {
    type: number
    sql: ${TABLE}.user_session_index ;;
    description: "Chronological index of the user's session, calculated via raw SQL window function."
  }
}
```
