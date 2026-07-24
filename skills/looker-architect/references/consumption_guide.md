# LookML Refinements & Layered Project Architecture

This reference handbook details how developers structure, extend, and customize enterprise LookML projects using **LookML Refinements**.

LookML projects are designed with a modular architecture. Core data models are defined in base layers, and developers layer business-specific customizations using **LookML Refinements** (`view: +view_name`), ensuring clean separation of concerns and maintainability.

---

## 1. Project Manifest Configuration

To configure connection and dataset settings dynamically across environments, parameterize them in `manifest.lkml`:

**project/manifest.lkml**:
```lookml
project_name: "enterprise_analytics"

# Parameterize connection and dataset
constant: CONNECTION_NAME {
  value: "database_connection"
  export: override_optional
}

constant: DATASET_NAME {
  value: "raw_dataset"
  export: override_optional
}
```

---

## 2. Model Configuration

Include explores and refined views in your model file to expose them in the Looker Explore UI:

**project/models/enterprise_model.model.lkml**:
```lookml
connection: "@{CONNECTION_NAME}"

# Include modular explores
include: "/explores/*.explore.lkml"

# Include refined views
include: "/views/refined/*.view.lkml"
```

---

## 3. Layering Customizations (LookML Refinements)

When extending a base view (e.g., adding custom dimensions, overriding labels, or injecting new measures), use Looker's refinement syntax (`view: +view_name`).

### Scenario: Adding a Custom Field via Refinement
Suppose the raw view `users` maps physical columns. You layer business metrics and custom logic in `views/refined/users_rfn.view.lkml`.

**views/refined/users_rfn.view.lkml**:
```lookml
# Refine the raw view
view: +users {
  # Add a custom business dimension
  dimension: corporate_segment {
    type: string
    sql: CASE 
           WHEN ${email} LIKE '%@enterprise.com' THEN 'Enterprise'
           ELSE 'Retail'
         END ;;
    description: "Corporate classification based on email domain."
    group_label: "Corporate Details"
  }

  # Override an existing dimension's label
  dimension: name {
    label: "Customer Full Name"
  }
}
```

---

## 4. Best Practices for Modular LookML Architecture
1. **Parameterize Connections**: Always use `manifest.lkml` constants for connection and dataset names.
2. **Raw vs. Refined Separation**: Never put measures or business logic in `views/raw/`. Keep raw views 1:1 with physical table columns.
3. **Document Explores**: Add clear descriptions to your explores so users understand their analytical scope.
4. **Use Sets**: Group fields into sets (e.g., `detail`) in your refined views for clean drill paths.
