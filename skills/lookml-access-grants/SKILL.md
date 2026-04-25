---
name: lookml-access-grants
description: Use this skill to create Access Grants for row-level or object-level security.
---

# Instructions

1.  **Define Access Grant**:
    *   Defined at the **Model** level.
    *   Links a `user_attribute` to a set of `allowed_values`.
2.  **Apply Access Grant**:
    *   Use `required_access_grants: [grant_name]` at the Explore, Join, View, or Field level.
    *   User must match **all** listed grants to see the object.
3.  **Best Practices**:
    *   **Exact Match**: `allowed_values` must match the user attribute value distinctively (no wildcards/partial matches).
    *   **Additive**: Grants are additive. If a View requires Grant A and a Field requires Grant B, the user needs *both* to see the field.

# Examples

## Basic Access Grant

```lookml
# In model file
access_grant: can_view_finance {
  user_attribute: department
  allowed_values: ["finance", "executive"]
}

# In view file
view: finance_data {
  required_access_grants: [can_view_finance]
  # ...
}
```

## Field-Level Security

```lookml
dimension: salary {
  type: number
  sql: ${TABLE}.salary ;;
  required_access_grants: [can_view_finance]
}
```
