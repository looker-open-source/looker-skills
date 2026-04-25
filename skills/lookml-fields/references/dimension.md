---
name: lookml-fields-dimension
description: Use this skill to create or modify LookML Dimensions. Covers basic dimension definitions, drill_fields, links, html, and common types.
---

# Instructions

## 1. Core Standards

1.  **Naming Convention**: Use `snake_case` for all dimension names.
    -   **Boolean**: Prefix with `is_` or `has_` (e.g., `is_active`, `has_churned`).
    -   **Dates**: Avoid "date" or "time" suffix (e.g., `created`, NOT `created_date`).
    -   **Logical**: Rename cryptic database columns to human-readable names (e.g., `product_n` -> `product_name`).
2.  **Required Parameters**:
    -   `sql`: **100% Coverage**. Every dimension MUST have a `sql` parameter.
        -   Use `${TABLE}.col_name` to refer to the view's table.
        -   Use `${field_name}` to reference other fields (inheritance).
    -   `description`: **100% Coverage**. Every dimension MUST have a `description`.
    -   `type`: defaults to `string`. Common: `number`, `string`, `yesno`, `tier`, `distance`, `location`.
3.  **Primary Keys**:
    -   `primary_key: yes` on the unique identifier for the view.
    -   Must be placed in `group_label: "IDs"`.
    -   Must be truly unique (verified by test).
4.  **Visibility**:
    -   Use `hidden: yes` for fields that should not be visible in the Explore (e.g., raw IDs, intermediate calculations).

## 2. Advanced Features

-   `group_label`: Group related fields in the field picker.
-   `drill_fields`: List of fields to show when drilling into this dimension.
-   `link`: Create external links (e.g., Google, Salesforce) or internal links.
-   `html`: formatting using Liquid (e.g., color coding).

# Examples

## Basic Dimensions

```lookml
dimension: order_id {
  primary_key: yes
  type: number
  sql: ${TABLE}.id ;;
  group_label: "IDs"
  description: "Unique identifier for the order."
}

dimension: status {
  type: string
  sql: ${TABLE}.status ;;
  description: "Current status of the order (e.g., pending, complete)."
}

dimension: is_active {
  type: yesno
  sql: ${TABLE}.is_active ;;
  description: "Indicates if the user account is currently active."
}
```

## Advanced Dimension (HTML & Links)

```lookml
dimension: website {
  type: string
  sql: ${TABLE}.website ;;
  description: "Customer website URL."

  html: <a href="{{ value }}" target="_blank">{{ value }}</a> ;;

  link: {
    label: "Google Search"
    url: "http://www.google.com/search?q={{ value }}"
    icon_url: "http://google.com/favicon.ico"
  }
}
```

## Tier Dimension

```lookml
dimension: age_tier {
  type: tier
  tiers: [0, 10, 20, 30, 40, 50, 60, 70, 80]
  style: integer
  sql: ${age} ;;
  description: "Age groups in 10-year increments."
}
```
