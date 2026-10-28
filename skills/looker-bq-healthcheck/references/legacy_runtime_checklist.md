---
type: Reference
title: Legacy LookML Runtime Migration Checklist
description: Technical rules and parameter mappings required to safely disable Legacy LookML Runtime in Looker instances.
tags: [lookml, legacy-runtime, migration, checklist]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: runtime-recipe
    resource: /skills/custom/refactoring/references/runtime_migration_recipe.md
    title: Runtime Migration Recipe
---

# Legacy LookML Runtime Migration Checklist

This reference guide outlines the technical rules and parameter mappings required to safely disable Legacy LookML Runtime in Looker instances.

---

## 1. Deprecated Parameters & Modern Replacements

| Legacy Parameter | Modern Replacement | Rationale & Migration Pattern |
| :--- | :--- | :--- |
| `sql_trigger_value: SELECT ...` | `datagroup_trigger: <name>` or `interval_trigger: "2 hours"` | `sql_trigger_value` polls on an unmanaged schedule and can lock worker threads. Datagroups enable centralized caching and coordinated PDT rebuilds. |
| `count_distinct` with raw SQL | `type: count_distinct` with `sql: ${TABLE}.id` | Modern runtime enforces Symmetric Aggregates. Calculations must specify the exact primary key/foreign key dimension rather than arbitrary SQL fragments. |
| Non-declared `many_to_one` joins | `primary_key: yes` on joined view | Looker requires a unique primary key on the `one` side of a join to calculate symmetric sums without multiplication. |
| Ad-hoc subqueries in views | Native Derived Tables (NDTs) / PDTs | Replace raw derived tables with LookML-native NDTs to inherit model logic and caching. |

---

## 2. Step-by-Step Runtime Migration Procedure

1. **Run Syntax Scanner**:
   Execute `scripts/runtime_migrator.py` against the project repository to identify any views missing primary keys or using deprecated syntax.
2. **Refactor PDT Triggers**:
   Convert all `sql_trigger_value` blocks into central datagroups defined in the `.model.lkml` file.
3. **Primary Key Enforcement**:
   Ensure every view joined into an explore contains exactly one dimension marked with `primary_key: yes`.
4. **Compile & Validate**:
   Run `looker-cli project validate <project_id>` to ensure zero compiler warnings under the new runtime.
5. **Content Validation**:
   Run `looker-cli api content_validator run_content_validation` to guarantee no downstream dashboards are broken.
