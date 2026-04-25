---
name: lookml-fields
description: Overview of LookML field types (Dimension, Measure, Filter, Parameter) and the role of the `sql` parameter in each. Use this skill to choose the right field type for your data modeling needs.
---

# Instructions

## 1. Field Types Overview

LookML fields are the building blocks of your data model. Each type serves a specific purpose in generating SQL.

| Field Type | Purpose | SQL Generation Phase |
| :--- | :--- | :--- |
| **Dimension** | Describes data (attributes). Groups results. | `SELECT` and `GROUP BY` clause. |
| **Measure** | Aggregates data (metrics). Calculates results. | `SELECT` clause (with aggregation). |
| **Filter** | Restricts data based on conditions. | `WHERE` or `HAVING` clause (via templated filters). |
| **Parameter** | Captures user input for dynamic logic. | *None directly* (injects values into other fields). |
| **Dimension Group** | Generates a set of time-based dimensions. | `SELECT` and `GROUP BY` clause (multiple columns). |

## 2. The Role of `sql` Parameter

The `sql` parameter behaves differently strictly based on the field type.

### Dimensions: The "What"
*   **Role**: Defines the raw transformation of the column *before* any aggregation.
*   **SQL Context**: The expression is placed directly into the `GROUP BY` clause.
*   **Input**: Can reference table columns (`${TABLE}.col`), other dimensions (`${dim}`), or raw SQL functions.
*   **Example**:
    ```lookml
    dimension: full_name {
      sql: CONCAT(${first_name}, ' ', ${last_name}) ;;
    }
    -- Generates: CONCAT(table.first_name, ' ', table.last_name)
    ```

### Measures: The "How Much"
*   **Role**: Defines the value to be aggregated *or* the calculation involving other aggregates.
*   **SQL Context**: Puts the expression *inside* the aggregation function (e.g., `SUM(sql)`), or as a standalone calculation for `type: number`.
*   **Input**:
    *   For `type: sum/avg/min/max`: References dimensions or columns.
    *   For `type: number`: References other *measures*.
    *   For `type: count`: `sql` is **ignored** (always `COUNT(*)` or `COUNT(primary_key)`).
*   **Example**:
    ```lookml
    measure: total_profit {
      type: sum
      sql: ${sale_price} - ${cost} ;; 
    }
    -- Generates: SUM(sale_price - cost)
    ```

### Filters: The "Which"
*   **Role**: Defines the condition logic, *usually* for Templated Filters used in Derived Tables or `sql_always_where`.
*   **SQL Context**: The `sql` parameter in a `filter` field is **rarely used directly** in modern LookML. Instead, the *input* to the filter is used in `{% condition %}` tags.
*   **Best Practice**: Identify if you need a `filter` field or just a `parameter` + `dimension`.
*   **Example (Templated Filter)**:
    ```lookml
    filter: date_filter { type: date }
    -- Usage in Derived Table SQL:
    -- WHERE {% condition date_filter %} created_at {% endcondition %}
    ```

### Parameters: The "User Input"
*   **Role**: Does **NOT** generate SQL itself. It holds a user-selected value to be injected into *other* fields.
*   **SQL Context**: Accessed via Liquid variables (`{% parameter name %}`) inside Dimensions, Measures, or Derived Tables.
*   **Input**: User selects from a UI list or types a value.
*   **Example**:
    ```lookml
    parameter: timeframe_selector {
      type: unquoted
      allowed_value: { value: "month" }
      allowed_value: { value: "year" }
    }
    dimension: dynamic_date {
      sql: DATE_TRUNC({% parameter timeframe_selector %}, ${created_raw}) ;;
    }
    ```

### Dimension Groups: The "Time Generator"
*   **Role**: Defines the *source* timestamp or date column. Looker then generates multiple dimension fields based on the `timeframes` list.
*   **SQL Context**: Casts and truncates the source column for each timeframe.
*   **Input**: Must be a standardized timestamp or date expression.
*   **Example**:
    ```lookml
    dimension_group: created {
      type: time
      timeframes: [date, month]
      sql: ${TABLE}.created_at ;;
    }
    -- Generates:
    -- created_date -> CAST(table.created_at AS DATE)
    -- created_month -> DATE_TRUNC(table.created_at, MONTH)
    ```

## 3. Summary of Differences

| Type | `sql` references... | Can reference Measures? | Aggregated? |
| :--- | :--- | :--- | :--- |
| **Dimension** | Columns, Other Dimensions | **NO** | No |
| **Measure (Agg)** | Columns, Dimensions | **NO** | Yes |
| **Measure (Num)** | **Other Measures** | **YES** | Yes (already agg) |
| **Filter** | (Rarely used) | No | N/A |
| **Parameter** | (None) | No | N/A |
| **Value Format** | (None) | No | N/A |

## Reference Skills

For detailed standards on specific field types, refer to:
- [Dimensions](references/dimension.md): Naming, labels, and type-specific rules.
- [Measures](references/measure.md): Aggregation types, filters, and formats.
- [Filters & Parameters](references/filter_parameter.md): Templated filters and user input.
- [Dimension Groups](references/dimension_group.md): Timeframes and intervals.
- [Value Formats](references/value_format.md): Named and custom currency/number formats.

