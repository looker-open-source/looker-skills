# LookML Performance & Aggregate Awareness

To ensure production-grade performance at enterprise scale, LookML projects must leverage pre-aggregated data. This manual details two distinct methods: native Looker **Aggregate Tables** and Liquid-based **Dynamic Table Routing**.

---

## 1. Native Aggregate Tables (Aggregate Awareness)

Aggregate Tables allow Looker to query smaller, pre-aggregated tables instead of raw granular data, drastically improving query performance. Looker automatically detects when a user's query can be satisfied by an aggregate table and routes the query there.

### Anatomy of an Aggregate Table
Define `aggregate_table` blocks inside the `explore` definition:

```lookml
explore: orders {
  # ... standard joins ...

  aggregate_table: rollup_monthly_sales {
    query: {
      dimensions: [created_month, status, products.category]
      measures: [total_revenue, count]
      filters: [orders.created_date: "2 years"]
    }
    materialization: {
      datagroup_trigger: ecommerce_etl
      partition_keys: ["created_month"] # Optimizes BigQuery/Presto queries
      increment_key: "created_month"    # Enables incremental builds instead of full rebuilds
      increment_offset: 1               # Rebuilds the current and previous month to capture late data
    }
  }
}
```

### Key Performance Rules:
1.  **Timeframe Grain**: Include the finest time grain needed (e.g., `created_date`). Looker can roll up `date` to `month` or `year` automatically.
2.  **Exact Match Constraint**: The user's query must be a *strict subset* of the aggregate table's fields for Looker to route the query to it.
3.  **Filter Awareness**: If a user filters on a field *not* in the aggregate table, Looker cannot use the rollup. **Always** include highly used filter dimensions (e.g., `status`, `country`) in the rollup's `dimensions` array.

---

## 2. Liquid-Based Dynamic Table Routing

For legacy databases or highly customized schemas, you can bypass native Aggregate Awareness and use Liquid `_in_query` logic in the `sql_table_name` parameter of a view to route queries dynamically.

### Implementation Pattern

```lookml
view: orders {
  sql_table_name:
    {% if orders.created_date._in_query or orders.created_hour._in_query %}
      -- Fallback to granular transaction table if high detail is requested
      @{DATASET_NAME}.orders_all_transactions
      
    {% elsif orders.created_month._in_query %}
      -- Route to monthly rollup if analyzing high-level trends
      @{DATASET_NAME}.orders_monthly_summary
      
    {% else %}
      -- Default to a daily partition summary
      @{DATASET_NAME}.orders_daily_summary
    {% endif %} ;;
}
```

### Critical Rules for Liquid Routing:
1.  **Totals Failure (Totals Row)**:
    Do **NOT** use `_is_selected` for conditional table routing. During Totals calculation (Grand Totals or Column Totals), Looker removes dimensions from the query. This causes `_is_selected` to evaluate to `false`, which will route the Totals query to the wrong table, breaking the calculation.
    *   **Rule**: **ALWAYS** use `_in_query` for table routing. `_in_query` remains `true` during Totals calculations if the field contributed to the query.
2.  **Booleans**:
    If your dialect requires literal `TRUE`/`FALSE` (like BigQuery), append `| sql_boolean` to the Liquid check: `{% if orders.created_date._in_query | sql_boolean %}`.
3.  **Dependency Awareness**:
    Remember that `_in_query` checks for usage in the `SELECT` clause, `WHERE`/`HAVING` filters, and `required_fields`. It is not limited to just the visible columns.
