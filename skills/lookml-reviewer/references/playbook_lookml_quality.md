# Looker Style Guide & LookML Modeling Standards Playbook

This reference document defines the official **LookML Style Standards**, **Naming Conventions**, **Formatting Rules**, and **DRY Modeling Patterns** for maintaining high-quality, self-service Looker projects.

> [!NOTE]
> **Related LookML Skills**:
> * [`lookml-modeling-guidelines`](../../lookml-modeling-guidelines/SKILL.md): DRY join modeling, view modularity, and dimension design.
> * [`lookml-liquid`](../../lookml-liquid/SKILL.md): Liquid templating, parameter fields, and conditional formatting.
> * [`lookml-access-grants`](../../lookml-access-grants/SKILL.md): Group-based access control and user attribute security.
> * [`lookml-refinements`](../../lookml-refinements/SKILL.md): LookML view and explore refinements (`+view:`, `+explore:`).
> * [`lookml-tests`](../../lookml-tests/SKILL.md): LookML automated assertion tests and model unit testing.
> * [`lookml-sets`](../../lookml-sets/SKILL.md): Field set grouping, drilling set modularity, and explore exposure.
> * [`lookml-view-derived-table`](../../lookml-view/references/derived_table.md): Persistent derived tables, persistence triggers, and SQL derived table best practices.
> * [`using-looker-cli`](../../using-looker-cli/SKILL.md): Looker CLI utilities for validation and project automation.

---

## 🔍 Part 1: How to Review & Diagnose Style Violations

### 1. The Looker Style Pyramid

```
                           THE LOOKER STYLE PYRAMID
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Layer 4: UX Polish: drill_fields, html badges, group_label                │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ Layer 3: Value Formatting: value_format_name, descriptions                │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ Layer 2: Semantic Naming: total_, count_, is_, snake_case                 │
 ├───────────────────────────────────────────────────────────────────────────┤
 │ Layer 1: Core Integrity: primary_key: yes, hidden: yes on FKs             │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Common Style Violations & Anti-Patterns

| Anti-Pattern | Diagnostic Symptom | Severity | Recommended Fix |
| :--- | :--- | :---: | :--- |
| **Ambiguous Measure Names** | Measures named `revenue` or `sales` instead of `total_revenue`. | High | Add mandatory aggregation prefix (`total_`, `average_`, `count_`). |
| **Missing Descriptions** | Measures with no `description:` tag in field pickers. | Medium | Add clear business definition to every user-exposed measure. |
| **Raw Foreign Keys Exposed** | `user_id` or `order_id` dimensions visible in explorer. | Medium | Add `hidden: yes` to all foreign key surrogate dimensions. |
| **CamelCase or Hyphens** | Field names like `orderTotal` or `user-id`. | Medium | Standardize to lowercase `snake_case`. |
| **Missing Drill Sets** | KPI count measures without `drill_fields:`. | Low | Define reusable `set: [field1, field2*]` and attach to measures. |

---

## 🛠️ Part 2: How to Rectify & Enforce Modeling Standards

### Rule 1: Universal Measure Prefix Notation
All measures **MUST** use explicit prefix notation corresponding to their SQL aggregation:

```lookml
# Sum measures MUST start with total_
measure: total_revenue {
  type: sum
  sql: ${sale_price} ;;
  value_format_name: usd
  description: "Total gross sales revenue across completed orders."
}

# Average measures MUST start with average_
measure: average_order_value {
  type: average
  sql: ${sale_price} ;;
  value_format_name: usd_0
  description: "Average revenue generated per order."
}

# Count measures MUST start with count_
measure: count_distinct_users {
  type: count_distinct
  sql: ${user_id} ;;
  description: "Total count of unique active users."
}
```

---

### Rule 2: Universal Dimension Naming & Masking
* **Condition Dimensions**: Boolean / YesNo dimensions must start with `is_` or `has_` (e.g. `is_active_subscriber`, `has_completed_checkout`).
* **Foreign Keys**: Must be marked `hidden: yes` to declutter the business user field picker:
```lookml
dimension: user_id {
  type: number
  sql: ${TABLE}.user_id ;;
  hidden: yes
  description: "Technical foreign key for joining to users view."
}
```

---

### Rule 3: Reusable Drill Sets & Actionable Deep Dives
Every core measure should specify a `drill_fields:` set containing context dimensions:
```lookml
set: order_detail_fields {
  fields: [
    id,
    created_date,
    users.name,
    users.email,
    status,
    total_revenue
  ]
}

measure: count_orders {
  type: count
  drill_fields: [order_detail_fields*]
  description: "Total order count with transactional drill-down details."
}
```
