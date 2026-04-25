---
name: lookml-view-derived-table
description: Use this skill to create Native Derived Tables (NDT) or SQL Derived Tables (SDT).
---

# Instructions

1.  **Native Derived Table (NDT)**:
    *   Uses `explore_source` to define the table based on an existing Explore.
    *   Preferred over SQL derived tables for portability and maintenance.
2.  **SQL Derived Table (SDT)**:
    *   Uses a raw `sql` block to define the table.
    *   Use only when NDT cannot achieve the desired result.
3.  **Persistence**:
    *   `datagroup_trigger`: Rebuilds based on a datagroup.
    *   `sql_trigger_value`: Rebuilds based on a SQL query result.
    *   `persist_for`: Persists for a specific duration.

# Examples

## Native Derived Table (Recommended)

```lookml
view: user_order_facts {
  derived_table: {
    explore_source: orders {
      column: user_id { field: orders.user_id }
      column: total_orders { field: orders.count }
      column: total_revenue { field: orders.total_amount }
    }
  }

  dimension: user_id {
    primary_key: yes
    hidden: yes
  }

  dimension: total_orders {
    type: number
  }
}
```

## SQL Derived Table

```lookml
view: complex_calc {
  derived_table: {
    sql: SELECT
           id,
           complex_logic(value) as calculated_value
         FROM raw_table ;;
    
    # Optional persistence
    datagroup_trigger: my_datagroup
  }

  dimension: id {
    primary_key: yes
    sql: ${TABLE}.id ;;
  }
}
```
