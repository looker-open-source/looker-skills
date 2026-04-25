---
name: lookml-explore
description: Use this skill when you need to create or modify a LookML Explore. This includes defining the Explore, joins, access grants, and basic configuration.
---

# Instructions

## 1. Core Standards

1.  **Naming Convention**: `snake_case` for the Explore name.
2.  **Required Parameters**:
    -   `description`: **100% Coverage**. Every Explore MUST have a description.
    -   `label`: A user-friendly name for the Explore in the UI.
    -   `view_name`: Defaults to explore name, but explicit definition is safer.
3.  **Joins**:
    -   `relationship`: **Required** (one_to_one, many_to_one).
    -   `sql_on`: **Required**. Use `${left.id} = ${right.id}` syntax.
    -   `type`: defaults to `left_outer`. Use `inner` or `full_outer` explicitly if needed.
4.  **Formatting**:
    -   Do NOT use `from` to rename views just for aesthetics. Use `view_label` instead.
    -   Exception: Polymorphic joins, Self-joins, Rescoping extensions.

## 2. Advanced Configuration

-   `always_filter`: specific filters that users can change but cannot remove.
-   `sql_always_where`: specific restrictions that users _cannot_ change.
-   `persist_with`: Link explore cache to datagroups (e.g., `default_datagroup`).
-   `fields`: Use inclusive lists to strictly control content when necessary (`ALL_FIELDS*`, `-view.field`).

## 3. Performance Optimization (Aggregate Tables)

Aggregate Tables (Aggregate Awareness) allow Looker to query smaller, pre-aggregated tables instead of the raw granular data, drastically improving query performance.

### Anatomy of an Aggregate Table

```lookml
explore: orders {
  aggregate_table: rollup_name {
    query: {
      dimensions: [created_date, status]
      measures: [total_revenue, count]
      filters: [orders.created_date: "6 months"]
    }
    materialization: {
      datagroup_trigger: ecommerce_etl
      # partition_keys: ["created_date"] # BigQuery/Presto optimization
      # increment_key: "created_date"    # Incremental builds
      # increment_offset: 3              # Rebuild last 3 periods
    }
  }
}
```

### Key Parameters

1.  **Query**: Defines the "shape" of the rollup.
    *   **Dimensions**: Include all dimensions commonly used in dashboards (including filters).
    *   **Measures**: Include base measures (sum, count). Looker can derive averages from sum+count.
    *   **Filters**: Optional. Restricts the rollup to a subset of data (e.g., "last 6 months").

2.  **Materialization**:
    *   **datagroup_trigger**: (Recommended) Rebuilds when the ETL job completes.
    *   **sql_trigger_value**: Rebuilds when a SQL query returns a new value.
    *   **increment_key**: (Advanced) Appends new data instead of full rebuilds. Best for massive tables.
    *   **indexes** / **partition_keys** / **cluster_keys**: Dialect-specific optimizations.

3.  **Best Practices**:
    *   **Timeframes**: Include the finest grain needed (e.g., `date`). Looker can roll up `date` to `month` or `year` automatically.
    *   **Exact Match**: The user's query must be a *strict subset* of the aggregate table's fields to satisfy the awareness logic.
    *   **Filter Awareness**: If a user filters on a field *not* in the aggregate table, Looker cannot use it (unless it's an "exact match" special case). Add common filter fields to the `dimensions` list.

## 4. Extending Explores

*   **Extends**: Use `extends: [base_explore]` to inherit joins, fields, and descriptions from another explore.
    *   **Use Case**: Create a "Base" explore with common joins, then "Extended" explores for specific analysis (e.g., `orders` -> `marketing_orders`).

# Examples

## Basic Explore

```lookml
explore: orders {
  label: "Orders"
  description: "Analyze order data, including user and product details."
  view_name: orders
  
  join: users {
    relationship: many_to_one
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
}
```

## Explore with Filters & Caching

```lookml
explore: events {
  label: "Web Events"
  description: "User interaction events."
  persist_with: default_datagroup

  # Users can change this filter, but it defaults to '7 days'
  always_filter: {
    filters: [events.created_date: "7 days"]
  }

  # Users CANNOT change this filter.
  sql_always_where: ${events.is_test_data} = false ;;
  
  join: sessions {
    relationship: many_to_one
    sql_on: ${events.session_id} = ${sessions.session_id} ;;
  }
}

## Aggregate Table (Advanced)

```lookml
explore: orders {
  aggregate_table: monthly_sales_summary {
    query: {
      dimensions: [created_month, status, products.category]
      measures: [total_revenue, count]
      filters: [orders.created_date: "2 years"]
    }
    materialization: {
      datagroup_trigger: ecommerce_etl
      partition_keys: ["created_month"]
      increment_key: "created_month"
      increment_offset: 1 # Rebuild current and previous month
    }
  }
}
```

## Extended Explore

```lookml
explore: orders_extended {
  extends: [orders]
  label: "Orders (Marketing View)"
  view_name: orders
  
  # Add new joins specific to this view
  join: marketing_channels {
    sql_on: ${orders.channel_id} = ${marketing_channels.id} ;;
    relationship: many_to_one
  }
}
```
```

## Reference Skills

For more complex scenarios, refer to these specialized skills:
- [Advanced Explore Configuration](references/advanced.md): UNNESTing, lateral flattens, and row-level security.
- [Joins Deep Dive](references/joins.md): Detailed join types, relationships, and aliasing.
