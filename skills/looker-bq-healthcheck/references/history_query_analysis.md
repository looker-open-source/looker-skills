---
type: Reference
title: History Query Analysis & Persona Profiling Guide
description: Persona-based query segmentation, query complexity categorization, and dashboard error/killed query rate analysis.
tags: [looker, system-activity, personas, error-rates, killed-queries]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: system-activity-history
    resource: system__activity/history
    title: Looker System Activity History Explore
---

# History Query Analysis & Persona Profiling Playbook

This reference document defines the **Persona-Based Query Segmentation**, **Query Complexity Categorization (Clean vs Feature-Laden)**, and **Dashboard Error/Killed Query Rate** metrics for evaluating user experience and query stability.

---

## 🔍 Part 1: How to Review & Diagnose History Telemetry

### 1. User Persona Query Profiling

Segmenting query performance by user tier isolates whether slow queries impact developers, ad-hoc analysts, or broad executive viewers:

| Persona Tier | Filter Condition | Target Average Runtime | Primary Bottleneck Risk |
| :--- | :--- | :---: | :--- |
| **Viewer Users** | `user_facts.is_viewer: 'Yes'` | **`< 3.0s`** | Dashboard tile bloat; un-cached production views. |
| **Explorer Users** | `user_facts.is_explorer: 'Yes'` | **`< 5.0s`** | Massive row limits, ad-hoc custom fields, unindexed explores. |
| **Developers** | `user_facts.is_developer: 'Yes'` | **`< 10.0s`** | Dev-mode cache invalidation; compiling uncommitted LookML. |
| **Admins** | `user_facts.is_admin: 'Yes'` | **`-`** | Heavy System Activity audits and maintenance scripts. |

---

### 2. Query Complexity Classification: Clean vs Feature-Laden

Understanding whether query latency stems from base warehouse SQL or client-side UI transformations:

```
                                  LOOKER QUERY COMPLEXITY
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        ▼                                    ▼                                    ▼
[CLEAN BASELINE QUERIES]            [CUSTOM FIELD QUERIES]               [PIVOT & TOTAL QUERIES]
Filters:                             Filter:                              Filters:
 • query.total: 'No'                  • query.dynamic_fields: "-EMPTY"     • query.formatted_pivots: "-EMPTY"
 • query.row_totals: 'No'            Symptom:                             • query.row_totals: 'Yes'
 • query.formatted_pivots: EMPTY      Ad-hoc calculations created by       • query.total: 'Yes'
 • query.dynamic_fields: EMPTY        explorers in the UI.                 Symptom:
Baseline SQL performance.            Remediation: Migrate to LookML.      Separate subtotal queries + RAM pivots.
```

---

### 3. Error Rate & Killed Query Diagnostics

#### Mathematical Formulas:
$$ \text{Dashboard Error Rate \%} = \frac{\text{Count of Database Queries with Status 'error'}}{\text{Total Database Queries for Dashboard}} \times 100 $$

$$ \text{Dashboard Killed Rate \%} = \frac{\text{Count of Database Queries with Status 'killed'}}{\text{Total Database Queries for Dashboard}} \times 100 $$

> [!IMPORTANT]
> **Killed Query Warning**: Dashboards with a high **Killed Query Rate** ($>5\%$) indicate end-user abandonment. Users are hitting "Cancel" or closing their browser tabs because the dashboard takes too long to load.

---

### 4. Telemetry Extraction Queries (System Activity)

#### A. Dashboard Error & Killed Rates
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "dashboard.title",
    "history.database_result_query_count",
    "history.query_run_count"
  ],
  "filters": {
    "history.status": "error,killed",
    "dashboard.title": "-NULL"
  },
  "sorts": ["history.query_run_count desc"],
  "limit": "15"
}
```

#### B. Top 50 Most Frequent Errors
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": ["history.message", "history.query_run_count"],
  "filters": {"history.status": "error", "history.message": "-NULL"},
  "sorts": ["history.query_run_count desc"],
  "limit": "50"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate User Experience Friction

### Remediation Protocol 1: Decreasing Killed Query Abandonment (`Killed % > 5%`)
1. **Locate Abandoned Dashboards**:
   * Run Query 4A above to identify the specific dashboard IDs with the highest killed query counts.
2. **Apply 10-Point Optimization**:
   * Follow [single_dashboard_optimization.md](single_dashboard_optimization.md) to split tiles into tabs, enforce filters, and apply datagroup caching.

---

### Remediation Protocol 2: Resolving Frequent Database Error Messages
1. **Analyze Error Messages in Query 4B**:
   * **"Table not found"**: Upstream database table was renamed/dropped without updating LookML `sql_table_name:`.
   * **"Query exceeded memory limit"**: Un-paged query or high-cardinality pivot exceeded warehouse memory. Apply partition filters.
   * **"Permission denied"**: Service account credentials lost access to warehouse schema. Update connection credentials in Admin.

---

### Remediation Protocol 3: Migrating Ad-Hoc UI Custom Fields to LookML
1. **Identify Frequent Custom Field Explores**:
   * Filter `history` where `query.dynamic_fields` is `-EMPTY`.
2. **Standardize into LookML Views**:
   * If multiple business users repeatedly create the same ad-hoc dimension or table calculation in the UI, write it directly as a permanent dimension or measure in the view file with a clear `description:`.
