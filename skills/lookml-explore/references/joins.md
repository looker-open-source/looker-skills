---
name: lookml-explore-joins
description: Use this skill to add joins to a LookML Explore. Includes defining join types, relationships, and SQL conditions.
---

# Instructions

1.  **Define the Join**: Use the `join: view_name {}` block within an `explore` definition.
2.  **Key Parameters**:
    *   `sql_on`: The SQL condition for the join (e.g., `${view_a.id} = ${view_b.ref_id}`).
    *   `type`: `left_outer` (default), `inner`, `full_outer`, or `cross`.
    *   `relationship`: `many_to_one` (default), `one_to_one`, `one_to_many`, `many_to_many`.
    *   `from`: Use this to alias a view (e.g., join `users` as `buyers`).
3.  **Best Practices**:
    *   **Symmetric Aggregates**: Looker handles aggregates correctly with `relationship` parameter. Always specify the correct `relationship`.
    *   **Left Join**: Prefer `left_outer` joins to preserve the primary table's rows.
    *   **Fields**: You can use `fields: []` to limit which fields from the joined view are visible.

# Examples

## Basic Join (Many-to-One)

```lookml
explore: orders {
  join: users {
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
}
```

## Join with Alias (from)

```lookml
explore: orders {
  # Join users as 'buyers'
  join: buyers {
    from: users
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.buyer_id} = ${buyers.id} ;;
  }

  # Join users as 'sellers'
  join: sellers {
    from: users
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.seller_id} = ${sellers.id} ;;
  }
}
```

## One-to-One Join (e.g., Standard Extensions)

```lookml
explore: users {
  join: user_details {
    type: left_outer
    relationship: one_to_one
    sql_on: ${users.id} = ${user_details.user_id} ;;
  }
}
```
