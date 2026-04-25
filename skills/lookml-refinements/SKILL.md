---
name: lookml-refinements
description: Deep dive into LookML includes, refinements (layering), and project structure best practices. Essential for mastering Looker's object-oriented capabilities.
---

# Instructions

## 1. Includes Mechanism

`include` makes Open LookML objects (views, explores, dashboards) available in the current file.

-   **Wildcards (`*`)**: Matches any string.
    -   `/views/*.view`: All views in the absolute `/views` directory.
    -   `*.view`: All views in the **current** directory.
    -   `/**/*.view`: (Recursive) All views in the current directory and **any** subdirectory.
    -   `//project-name/views/*.view`: Remote project import (Requires project manifest).

-   **Best Practice**: Be specific to avoid namespace collisions and performance bloat.
    -   **BAD**: `include: "/**/*.view"` (Imports everything, everywhere. Slow and risky).
    -   **GOOD**: `include: "/views/users.view"` (Explicit).
    -   **GOOD**: `include: "/views/finance/*.view"` (Scoped to a domain).

## 2. Refinements (Layering)

Refinements allow you to modify an existing view or explore without changing the original file. This is crucial for:
1.  **Hub & Spoke**: Adapting a core "Hub" model for specific "Spoke" use cases.
2.  **Vendor Blocks**: Customizing read-only blocks (e.g., Google Analytics) without forking.

### Syntax
-   **Original**: `view: users { ... }`
-   **Refinement**: `view: +users { ... }`
-   **Requirement**: You **MUST** `include` the original file before finding it.

### Rules of Engagement
1.  **Last Include Wins**: If multiple files refine `+users`, the order of `include` determines the final state.
2.  **Additive**: New parameters are added.
3.  **Override**: Existing parameters are replaced.
    -   *Exception*: list parameters (like `drill_fields`) are often **replaced**, not merged, depending on the implementation. Explicitly restating the list is safer.
4.  **Field Modification**:
    -   To modify a field, re-declare it with the **exact same name**.
    -   You only need to specify the parameters you want to change (e.g., adding `description` or `label`).

## 3. The "One Explore Per File" Pattern

For maintainable, enterprise-scale LookML, follow the **One Explore Per File** pattern using `.explore.lkml` files.

### Structure
-   **File**: `explores/orders.explore.lkml`
-   **Content**:
    1.  `include` only the views needed for *this* explore.
    2.  Define `explore: orders { ... }`.
-   **Model File**: `models/my_model.model.lkml`
    -   `include: "/explores/orders.explore.lkml"`
    -   *No `explore` definitions in the model file itself.*

### Benefits
-   **Performance**: The connection only parses what is needed for the requested Explore.
-   **Namespace Hygiene**: View naming collisions are isolated to the specific Explore file where they are included.
-   **Collaboration**: Developers can work on different Explores without merge conflicts in the Model file.

# Examples

## Scenario: Modifying a Vendor View

**Original** (ReadOnly): `//lkr_block/users.view`
```lookml
view: users {
  dimension: id { primary_key: yes }
  dimension: name {}
}
```

**Refinement**: `views/users_rfn.view`
```lookml
include: "//lkr_block/users.view"

view: +users {
  # 1. New Dimension
  dimension: email {
    sql: ${TABLE}.email ;;
  }

  # 2. Modify Existing Dimension
  dimension: name {
    label: "Full Name"
    description: "Legal name of the user."
  }
}
```

## Scenario: Explore-Specific Logic

**File**: `explores/marketing_orders.explore.lkml`
```lookml
include: "/views/orders.view"
include: "/views/users.view"

# Refine users ONLY for this explore to add marketing-specific fields
view: +users {
  dimension: acquisition_channel {
    sql: ${TABLE}.utm_source ;;
  }
}

explore: marketing_orders {
  view_name: orders
  from: orders # mapping 'orders' view to 'orders' alias (standard)
  
  join: users {
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
}
```
