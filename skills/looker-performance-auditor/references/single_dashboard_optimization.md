---
type: Reference
title: Single Dashboard Forensic Audit & Optimization Checklist
description: 10-point actionable forensic audit checklist for evaluating and accelerating mission-critical Looker dashboards.
tags: [looker, dashboard-optimization, single-dashboard, audit-checklist]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: dashboard-standards
    resource: /skills/vendor/looker-skills/skills/looker-architect/references/dashboard_standards.md
    title: Looker Dashboard Standards
---

# Single Dashboard Forensic Audit & Optimization Playbook

This reference document defines the **10-Point Forensic Audit Framework** for evaluating, diagnosing, and optimizing individual mission-critical Looker dashboards.

---

## 🔍 Part 1: How to Review & Diagnose a Single Dashboard

### 1. The 10-Point Dashboard Optimization Checklist

When diagnosing a specific slow dashboard (`dashboard_id`), audit against these 10 architectural criteria:

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                       10-POINT DASHBOARD FORENSIC AUDIT CHECKLIST                           │
 ├────┬─────────────────────────────┬───────────────────────────┬──────────────────────────────┤
 │ #  │ Audit Dimension             │ Target Best Practice      │ Optimization Trigger         │
 ├────┼─────────────────────────────┼───────────────────────────┼──────────────────────────────┤
 │ 1  │ Total Query Tiles           │ ≤ 25 query tiles          │ > 25 (Deconstruct / tabs)    │
 │ 2  │ Run on Load Setting         │ Disabled if filtered      │ Enabled when filters required│
 │ 3  │ Date Filters Present        │ Mandatory for time-series │ Missing (Scans full history) │
 │ 4  │ Max Row Limits              │ ≤ 50 for KPI / single-val │ 5,000 limit on single value  │
 │ 5  │ Auto-Refresh Interval       │ Off (or > 30 mins for TV) │ < 5 mins (Saturates pool)    │
 │ 6  │ Merged Query Tiles          │ 0 (Native LookML joins)   │ ≥ 1 (In-memory merge lag)    │
 │ 7  │ Formatted Pivots            │ Low cardinality only      │ High cardinality pivots      │
 │ 8  │ Custom Fields / Table Calcs │ Built in LookML           │ > 3 ad-hoc dynamic fields    │
 │ 9  │ Number of Explores Used     │ Scoped lightweight views  │ Heavy transaction explores   │
 │ 10 │ Full Completed Runtime      │ < 5.0 seconds             │ > 10.0s (Tile bottleneck)    │
 └────┴─────────────────────────────┴───────────────────────────┴──────────────────────────────┘
```

---

### 2. Forensic Single-Dashboard Queries (System Activity)

#### A. Dashboard 360-Degree Metadata Scorecard
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard.run_on_load",
    "dashboard.refresh_interval_ordered",
    "dashboard_element.total_query_tiles",
    "dashboard_element.count_text",
    "dashboard_element.count_merge_query",
    "user.name",
    "updated_by.name"
  ],
  "filters": {
    "dashboard.id": "<TARGET_DASHBOARD_ID>",
    "dashboard.moved_to_trash": "No"
  },
  "limit": "1"
}
```

#### B. Per-Tile Query Lifecycle Breakdown (Isolate Slowest Tiles)
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "dashboard_element.id",
    "dashboard_element.title",
    "history.average_runtime",
    "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average",
    "query_metrics.per_user_throttler_average",
    "query_metrics.prepare_average",
    "query_metrics.stream_to_cache_average",
    "query_metrics.postprocessing_average"
  ],
  "filters": {
    "dashboard.id": "<TARGET_DASHBOARD_ID>",
    "dashboard_element.title": "-NULL"
  },
  "sorts": ["history.average_runtime desc"],
  "limit": "50"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate a Slow Dashboard

### Step 1: Clamp Tile Row Limits
* Inspect single-value KPI cards and gauge visualizations.
* In the tile explore edit mode, change `Limit` from default 5000 to **`1`** or **`10`**.

### Step 2: Enforce Global Dashboard Filters
* Add a global **Date Range** filter (e.g. `Created Date: past 30 days`) and link it to all tiles.
* Un-filtered dashboards force each tile to scan entire historical tables on load.

### Step 3: Eliminate Merged Query Tiles
* Identify tiles where `dashboard_element.count_merge_query > 0`.
* In LookML, create a unified Explore joining the primary and secondary views directly.
* Replace the merged tile with a standard single-explore tile.

### Step 4: Disable "Run on Load" on Unfiltered Dashboards
* In dashboard settings, uncheck **Run on load** if users are expected to select specific account/customer filters before viewing data.
