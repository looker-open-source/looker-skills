# Canonical Templates

Use these standard templates as the baseline when scaffolding or documenting a public LookML project.

## 1. Public README Template (`README.md`)

Place this file in the root directory of your Looker project repository to provide setup and usage guidance for end-users.

```markdown
# <Project Name> LookML Project

The **<Project Name>** LookML project provides out-of-the-box analytical models, explores, and dashboards for analyzing <Domain/Data Area>.

## Overview
- **Dialect Compatibility:** BigQuery, Snowflake, Redshift, PostgreSQL
- **Key Dashboards Included:**
  - Executive Overview
  - Operations & Performance Deep-Dive
- **Core KPIs:** <KPI 1>, <KPI 2>, <KPI 3>

## Directory Structure
```
├── views/
│   ├── raw/                 # 1:1 physical table mapping
│   └── refined/             # Business logic & Period-over-Period measures
├── explores/                # Modular explores
├── tests/                   # Data integrity unit tests
├── dashboards/              # Tabbed LookML dashboards
├── [project_name].model.lkml # Connection & caching policies
└── manifest.lkml            # Connection constants & visualization library
```

## Setup & Installation

### Step 1: Configure Connection & Dataset Constants
In your `manifest.lkml` file, override the default database connection and dataset constants:

```lookml
constant: CONNECTION_NAME {
  value: "<your_looker_connection_name>"
  export: override_optional
}

constant: DATASET_NAME {
  value: "<your_database_dataset_name>"
  export: override_optional
}
```

### Step 2: Validate LookML
Run LookML Project Validation in Developer Mode (`looker-cli project validate <project_name>`) to verify zero compilation errors.

### Step 3: Production Deployment
Deploy all changes to production.
```

---

## 2. Project Manifest Template (`manifest.lkml`)

```lookml
project_name: "<project_name>"

# --------------------------------------------------------------------------
# Centralized Connection & Dataset Constants
# --------------------------------------------------------------------------
constant: CONNECTION_NAME {
  value: "my_connection"
  export: override_optional
}

constant: DATASET_NAME {
  value: "my_dataset"
  export: override_optional
}

# --------------------------------------------------------------------------
# Visualization Drill Constants
# --------------------------------------------------------------------------
constant: DRILL_LINE_VIZ {
  value: "{% assign vis_config = '{\"type\":\"looker_line\",\"x_axis_gridlines\":false,\"y_axis_gridlines\":true,\"show_y_axis_labels\":true}' %}"
}

constant: DRILL_PIE_VIZ {
  value: "{% assign vis_config = '{\"type\":\"looker_pie\",\"show_value_labels\":true,\"inner_radius\":50}' %}"
}
```
