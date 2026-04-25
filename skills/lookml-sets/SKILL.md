---
name: lookml-sets
description: Guide to using LookML sets for grouping fields, controlling visibility, and managing drill paths.
---

# LookML Sets

Sets are reusable lists of fields (dimensions, measures, and filters) defined within a view or a model. They are primarily used to group fields together for various purposes such as drill-down paths, explore field visibility, and more.

## Syntax

```lookml
set: set_name {
  fields: [field_name1, field_name2, view_name.field_name3, ...]
}
```

### Key Features

*   **Reusability**: Define a list of fields once and use it in multiple places.
*   **Composition**:
    *   **Include All**: `[set_name*]` includes all fields from another set.
    *   **Exclude**: `[-field_name]` excludes a specific field.
    *   **External Reference**: `view_name.set_name*` refers to a set in another view (ensure views are joined).

## Use Cases

### 1. Drill Fields (Primary Use Case)

Sets are the standard way to define what happens when a user clicks on a measure value. Instead of listing fields repeatedly, define a set and reference it.

```lookml
view: orders {
  # ... dimensions ...

  set: order_details {
    fields: [id, created_date, status, user.email]
  }

  measure: count {
    type: count
    drill_fields: [order_details*]
  }
}
```

### 2. Controlling Explore Visibility (Field Picker)

You can use sets at the Explore level to explicitly define which fields are visible to users. This is best practice for curating Explores.

```lookml
explore: orders {
  fields: [ALL_FIELDS*]         # Start with everything (default)
  # OR
  fields: [orders.order_details*, users.user_info*] # Whitelist specific sets
}
```

### 3. Excluding Fields

Use sets to exclude specific fields from an Explore without hiding them at the view level (which hides them globally).

```lookml
explore: orders {
  fields: [ALL_FIELDS*, -users.password_hash]
}
```

## Best Practices

### 1. The `detail` Set

Every view should ideally have a default set (commonly named `detail` or `drill_set`) that includes the most relevant fields for drilling into a record from that view.

```lookml
view: users {
  dimension: id { primary_key: yes ... }
  dimension: name { ... }
  dimension: email { ... }

  # Standard set for drilling
  set: detail {
    fields: [id, name, email]
  }
}
```

### 2. Naming Conventions

*   Use `snake_case` for set names.
*   Use descriptive names like `user_info`, `financial_metrics`, `drill_detail`.

### 3. Avoid Cross-View Dependencies in View Sets

While you *can* reference `other_view.field` in a view's set, this creates a dependency. Ensure that `other_view` is *always* joined whenever the set is used.
*   **Better**: Define sets local to the view (only its own fields).
*   **Explore Level**: Combine sets from different views at the Explore level (e.g., `fields: [orders.detail*, users.detail*]`).

### 4. Cumulative Sets

You can build sets on top of other sets.

```lookml
set: basic_info {
  fields: [id, name]
}

set: extended_info {
  fields: [basic_info*, email, created_date]
}
```
