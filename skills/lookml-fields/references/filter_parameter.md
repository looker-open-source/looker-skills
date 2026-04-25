---
name: lookml-fields-filter-parameter
description: Use this skill to create Filter fields and Parameters for dynamic Liquid interactivity.
---

# Instructions

1.  **Filter**:
    *   Use `filter` to create a filter-only field (not part of the `SELECT` clause).
    *   Used often with templated filters in Derived Tables.
2.  **Parameter**:
    *   Use `parameter` to create a user input field (dropdown, date picker, etc.).
    *   Use `allowed_value` to define specific options.
    *   Use with Liquid: `{% parameter parameter_name %}` injects the value, or `parameter_name._parameter_value` in logic `{% if %}`.
3.  **Best Practices**:
    *   **Type**: Explicitly set the `type` (e.g., `string`, `unquoted`, `date`, `number`).
    *   **Label**: Use `label` in `allowed_value` for user-friendly display.

# Examples

## Filter used in Templated Filter

```lookml
filter: date_filter {
  type: date
}

view: derived_table_view {
  derived_table: {
    sql: SELECT * FROM table WHERE {% condition date_filter %} created_at {% endcondition %} ;;
  }
}
```

## Parameter for Dynamic Measure Selection

```lookml
parameter: measure_selector {
  type: unquoted
  allowed_value: { label: "Total Revenue" value: "total_revenue" }
  allowed_value: { label: "Total Orders" value: "count" }
}

measure: dynamic_measure {
  label_from_parameter: measure_selector
  type: number
  sql: 
    {% if measure_selector._parameter_value == 'total_revenue' %}
      ${total_revenue}
    {% else %}
      ${count}
    {% endif %} ;;
}
```

## Parameter for Dynamic Dimension Grouping

```lookml
parameter: timeframe_picker {
  type: unquoted
  allowed_value: { label: "Date" value: "date" }
  allowed_value: { label: "Week" value: "week" }
  allowed_value: { label: "Month" value: "month" }
}

dimension: dynamic_timeframe {
  sql:
    {% if timeframe_picker._parameter_value == 'date' %} ${created_date}
    {% elsif timeframe_picker._parameter_value == 'week' %} ${created_week}
    {% else %} ${created_month}
    {% endif %} ;;
}
```
