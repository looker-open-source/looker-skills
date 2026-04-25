---
name: lookml-view
description: Use this skill to create or modify LookML Views. Covers basic view definitions, sql_table_name, file organization, and patterns.
---

# Instructions

## 1. File Organization

-   **Standard Views**: `views/[datasource_name]/[view_name].view.lkml`
-   **Extended Views**: `views/[datasource_name]/[view_name]_ext.view.lkml`
-   **Refinements**: `views/[datasource_name]/[view_name]_rfn.view.lkml`
-   **NDTs**: `views/[datasource_name]/[view_name]_ndt.view.lkml`
-   **SDTs**: `views/[datasource_name]/[view_name]_sdt.view.lkml`

## 2. Core Standards

1.  **sql_table_name**: **Required** for standard views. Defaults are fragile; be explicit.
2.  **Primary Key**:
    -   Must be the **first dimension** defined in the file.
    -   Must have `primary_key: yes`.
3.  **Refinements**: Use `+` before the view name (e.g., `view: +users`) to refine existing views without modifying the original file.
4.  **Extensions**: Use `extends` to reuse logic from other views.

## 3. Best Practices

-   **Naming**: Use `snake_case` for view names and filenames.
-   **Descriptions**: Add descriptions to the view itself if it helps explain its purpose (e.g., "Daily active users aggregated by region").
-   **Output Format**: Ensure the file ends with a newline.

## 4. Related Skills

-   **[lookml-refinements](../lookml-refinements/SKILL.md)**: Logic for `include`, refinements (`+`), and Hub & Spoke patterns.

# Examples

## Basic View

```lookml
view: users {
  sql_table_name: `project.dataset.users` ;;

  dimension: user_id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
    group_label: "IDs"
    description: "Unique internal user ID."
  }

  dimension: email {
    type: string
    sql: ${TABLE}.email ;;
    description: "User's email address."
  }
}
```

## Extended View

```lookml
include: "/views/base/users.view"

view: users_extended {
  extends: [users]

  dimension: lifetime_value {
    type: number
    sql: ${TABLE}.ltv ;;
    description: "Total lifetime value of the user."
  }
}
```

## Refinement (Layering)

```lookml
include: "/views/users.view"

view: +users {
  label: "All Users (Refined)"
  
  dimension: email {
    # Adding a description to an existing field
    description: "Primary contact email."
  }
}
```

## Reference Skills

- [Derived Tables](references/derived_table.md): Standard (SDT) and Native (NDT) derived table patterns/materialization.
