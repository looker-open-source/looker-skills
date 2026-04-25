---
name: lookml-liquid
description: Use this skill to use Liquid variables in LookML for dynamic SQL, HTML, and Links, including advanced patterns for query optimization.
---

# Instructions

1.  **Syntax**:
    *   `{{ value }}`: Output syntax (inserts text).
    *   `{% if condition %}`: Tag syntax (logic).
2.  **Common Variables**:
    *   `value`: Raw value from DB (best for comparisons).
    *   `rendered_value`: Formatted value (best for display).
    *   `_filters['view.field']`: User-selected filter values.
    *   `parameter_name._parameter_value`: Selected parameter value.
3.  **Best Practices**:
    *   **SQL Injection**: Always use `| sql_quote` when inserting user input (like `_filters`) into SQL that generates string literals.
    *   **Booleans**: If your dialect requires literal `TRUE`/`FALSE` (like BigQuery), append `| sql_boolean` to `_in_query` or `_is_selected` variables (e.g., `{{ view.field._in_query | sql_boolean }}`).
    *   **Dependency Awareness**: Remember that `_in_query` checks for usage in **SELECT, Filters, and `required_fields`**. It is NOT limited to just the visible columns.
    *   **Performance**: Avoid referencing `{{ field._value }}` in `link` parameters if the field isn't already in the query, as this forces Looker to add the field to the `GROUP BY` clause, potentially fan-outing the result set. Use `row['view.field']` instead if you only need the value from the browser result row.

# Advanced Variable Usage

## `_in_query` vs `_is_selected`

| Variable | Definition | Critical Difference (Totals) |
| :--- | :--- | :--- |
| `_in_query` | Returns `true` if the field is in the SELECT clause, Filters, or `required_fields`. | **Remains `true`** during totals calculation if the field contributed to the query. |
| `_is_selected` | Returns `true` if the field is in the SELECT clause or `required_fields`. | **Returns `false`** during totals calculation (Row/Column/Grand Totals) for dimensions, because dimensions are removed from the query to calculate totals. |

> [!WARNING]
> If you use `_is_selected` to conditionally render logic for a dimension, that logic will **fail** (return false) in the Totals row. Use `_in_query` if you need the logic to persist in totals, or explicitly handle the `false` state for totals if that is the desired behavior.

# Liquid Variable Definitions

The following table describes the Liquid variables that you can use with LookML and where they can be used.

**Usage Key:**
*   **A**: `action`
*   **DV**: `default_value` (dashboards)
*   **DE**: `description`
*   **F**: `filters` (dashboard elements)
*   **H**: `html`
*   **LA**: Label parameters (`label`, `view_label`, `group_label`, `group_item_label`)
*   **LI**: `link`
*   **S**: SQL parameters (`sql`, `sql_on`, `sql_table_name`)

| Variable | Definition | Usage |
| :--- | :--- | :--- |
| `value` | The raw value of the field. | A, H, LI |
| `rendered_value` | The formatted value of the field. | A, H, LI |
| `filterable_value` | The value formatted for URL filtering. | A, H, LI |
| `link` | The default drill link URL. | A, H, LI, S |
| `linked_value` | The value with default formatting and linking. | A, H, LI |
| `_filters['view.field']` | User filters applied to the field. | A, DE, H, LA, LI |
| `{% date_start filter %}` | Start date of a date filter. | S |
| `{% date_end filter %}` | End date of a date filter. | S |
| `{% condition filter %} sql {% endcondition %}` | Applies filter logic to SQL. | S |
| `{% parameter name %}` | Value of a parameter. | DE, LA, S |
| `name._parameter_value` | Injects parameter value (safe for logic). | DE, H, LA, LI, S |
| `_user_attributes['name']` | User attribute value. | A, DE, H, LA, LI, S, DV, F |
| `_model._name` | Model name. | A, DE, H, LA, LI, S |
| `_view._name` | View name. | A, DE, H, LA, LI, S |
| `_explore._name` | Explore name. | A, DE, H, LA, LI, S |
| `_field._name` | Field name. | A, DE, H, LA, LI, S |
| `view._in_query` | `true` if *any* field from view is queried. | DE, LA, LI, S |
| `view.field._in_query` | `true` if field is in query/filter. | DE, LA, LI, S |
| `view.field._is_selected` | `true` if field is in SELECT. | DE, LA, LI, S |
| `view.field._is_filtered` | `true` if field is filtered. | DE, LA, LI, S |

# Advanced Use Cases

## 1. Aggregate Awareness (Dynamic Table Selection)
Use `_in_query` to route queries to smaller, pre-aggregated tables when the user doesn't request granular details. This significantly improves query performance.

```lookml
view: orders {
  sql_table_name:
    {% if orders.created_date._in_query or orders.created_hour._in_query %}
      orders_daily_summary  -- Fallback to daily partition if granular date used
    {% elsif orders.created_month._in_query %}
      orders_monthly_summary -- Use monthly summary for high-level queries
    {% else %}
      orders_all_transactions -- Default/Detail table
    {% endif %} ;;
}
```

## 2. Dynamic Joins (`sql_on`)
Use `_in_query` in joins to avoid joining heavy tables unless they are actually required by the user's selection.

```lookml
explore: order_items {
  join: users {
    type: left_outer
    sql_on: ${order_items.user_id} = ${users.id} ;;
    relationship: many_to_one
  }

  join: user_facts {
    type: left_outer
    sql_on: ${users.id} = ${user_facts.user_id} ;;
    relationship: one_to_one
    # Only join user_facts if a field from it is actually selected/filtered
    sql_where: {% if user_facts._in_query %} 1=1 {% else %} 1=0 {% endif %} ;;
  }
}
```
*Note: The `sql_where` trick is one way to force a join drop in some dialects, but standard `sql_on` logic with `{% if %}` is cleaner if supported.*

## 3. Column-Specific Logic (Dynamic Denominator)
Change a calculation based on what other fields are present in the query.

```lookml
measure: dynamic_rate {
  type: number
  sql:
    {% if users.traffic_source._is_selected %}
      ${total_revenue} / NULLIF(${traffic_source_count}, 0)
    {% else %}
      ${total_revenue} / NULLIF(${total_users}, 0)
    {% endif %} ;;
}
```

# Examples

## Dynamic HTML (Conditional Formatting)

```lookml
dimension: status {
  html:
    {% if value == 'complete' %}
      <span style="color: green">{{ rendered_value }}</span>
    {% else %}
      <span style="color: red">{{ rendered_value }}</span>
    {% endif %} ;;
}
```

## Templated Filters (Derived Table)

```lookml
view: customer_facts {
  derived_table: {
    sql:
      SELECT customer_id, SUM(amount)
      FROM orders
      WHERE {% condition order_date %} created_at {% endcondition %}
      GROUP BY 1 ;;
  }
}
```

## Complex Logic (Loops & Split)

LookML Liquid can handle string manipulation and loops, which is useful for parsing complex filter parameters or unnesting values. This is used infrequently, but very handy in complex modeling tasks.

```lookml
view: brand_category_item {
  parameter: filter { type: unquoted }
}

explore: complex_filter_parsing {
  # Example: Parsing a string like "Brand1..Category1__Brand2..Category2"
  # This logic splits the string by '__' then '..' to generate OR conditions
  sql_where:
    {% assign items = brand_category_item.filter._parameter_value | split: '__' %}
    {% for item in items %}
      {% assign parts = item | split: '..' %}
      {% if forloop.first %} ( {% else %} OR ( {% endif %}
        ${products.brand} = '{{ parts[0] }}' AND ${products.category} = '{{ parts[1] }}'
      )
    {% endfor %}
    {% if items.size == 0 %} 1=1 {% endif %}
  ;;
}
```
