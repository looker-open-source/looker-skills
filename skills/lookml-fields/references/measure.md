---
name: lookml-fields-measure
description: Use this skill to create or modify LookML Measures. Covers aggregation types, filters, and drill_fields.
---

# Instructions

## 1. Core Standards

1.  **Naming Convention**: Use `snake_case` for all measure names.
    -   **Counts**: Prefix with `count_` (e.g., `count_orders`).
    -   **Sums**: Prefix with `total_` (e.g., `total_revenue`).
    -   **Averages**: Prefix with `avg_` (e.g., `avg_order_value`).
    -   **Ratios**: Use descriptive names (e.g., `orders_per_user`).
2.  **Required Parameters**:
    -   `type`: `count`, `sum`, `average`, `count_distinct`, `number`, `min`, `max`.
    -   `drill_fields`: **Required** for all non-extended measures.
        -   Must be a defined set (preferred) or a specific list of fields.
        -   Define the set in the same view file or a dedicated sets file.
    -   `description`: **Required**. Explain the calculation logic.
3.  **Formatting**:
    -   Use `value_format_name` (e.g., `usd_0`, `percent_1`) instead of SQL formatting where possible.

## 2. Common Types

-   **count**: Counts rows. Does NOT need a `sql` param (defaults to `COUNT(*)`).
-   **count_distinct**: Counts unique values. Requires `sql` param.
-   **sum**: Sums a numeric field. Requires `sql`.
-   **average**: Averages a numeric field. Requires `sql`.
-   **number**: For calculations involving other measures (e.g., margins, ratios).

# Examples

## Basic Measures

```lookml
measure: count {
  type: count
  drill_fields: [order_details*]
  description: "Total number of orders."
}

measure: total_revenue {
  type: sum
  sql: ${sale_price} ;;
  value_format_name: usd
  drill_fields: [order_details*]
  description: "Sum of all sales prices."
}
```

## Filtered Measure

```lookml
measure: total_revenue_completed {
  type: sum
  sql: ${sale_price} ;;
  filters: [status: "complete"]
  value_format_name: usd
  drill_fields: [order_details*]
  description: "Total revenue from completed orders only."
}
```

## Measure with Distinct Count

```lookml
measure: count_users {
  type: count_distinct
  sql: ${user_id} ;;
  drill_fields: [users.id, users.name, users.created_date]
  description: "Number of unique users who experimented."
}
```
