---
type: Reference
title: Large Dashboards & Auto-Refresh Optimization Guide
description: Large dashboard decomposition rules, auto-refresh rate limits, and queries-per-run optimization.
tags: [looker, dashboards, tile-bloat, auto-refresh, rendering]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: dashboard-standards
    resource: /skills/vendor/looker-skills/skills/looker-architect/references/dashboard_standards.md
    title: Looker Dashboard Standards
---

# Large Dashboards & Auto-Refresh Optimization Playbook

This reference document defines the **Large Dashboard Decomposition Rules**, **Auto-Refresh Audit Standards**, and **Queries-Per-Run Ratios** for eliminating frontend rendering lag and worker queue contention.

---

## 🔍 Part 1: How to Review & Diagnose Dashboard Complexity

### 1. The >25 Query Tile Rule

A dashboard's query load is measured by its **Total Query Tiles** (excluding static markdown text headers):

$$ \text{Total Query Tiles} = \text{dashboard\_element.count} - \text{dashboard\_element.count\_text} $$

```
                                DASHBOARD SIZE EVALUATION
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
[HEALTHY: 1 - 15 TILES]             [WARNING: 16 - 25 TILES]            [CRITICAL: > 25 TILES]
 • Single screen viewport            • Approaches browser memory limit   • Breaches 15 queries/node limit
 • Fast rendering (<3s)              • Potential tile queue contention   • Causes per_user_throttler lag
 • High user engagement              • Action: Implement filters         • Action: Deconstruct dashboard
```

---

### 2. Auto-Refresh Audit Standards

Auto-refreshing dashboard tiles run continuous background queries even when no human is viewing the screen:

| Refresh Interval | Impact Assessment | Mandatory Remediation Protocol |
| :--- | :--- | :--- |
| **`< 5 Minutes`** | **CRITICAL**: Saturates DB connection pools & drains warehouse budget. | Increase to `> 30 mins` or link to PDT ETL trigger. |
| **`5 - 30 Minutes`**| **HIGH**: Creates regular queue spikes during peak business hours. | Align interval with warehouse data pipeline frequency. |
| **`> 30 Minutes`** | **ACCEPTABLE**: Safe for wallboard / TV displays. | Ensure dashboard is marked for TV use only. |

---

### 3. Diagnostic Telemetry Queries (System Activity)

#### A. Dashboards Exceeding 25 Query Tiles
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard_element.count",
    "dashboard_element.count_text",
    "dashboard_element.count_look",
    "dashboard_element.count_lookless",
    "dashboard_element.count_merge_query"
  ],
  "filters": {
    "dashboard_element.count": ">25",
    "dashboard.moved_to_trash": "No"
  },
  "sorts": ["dashboard_element.count desc"],
  "limit": "50"
}
```

#### B. Active Auto-Refresh Dashboards
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard_element.refresh_interval_ordered"
  ],
  "filters": {
    "dashboard.moved_to_trash": "No",
    "dashboard_element.refresh_interval_ordered": "-NULL"
  },
  "sorts": ["dashboard_element.refresh_interval_ordered asc"],
  "limit": "50"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate Dashboard Bloat

### Remediation Protocol 1: Deconstructing >25-Tile Dashboards into Tabs
1. **Implement Dashboard Tabs**:
   * Group related KPI tiles into visual tabs (e.g. "Executive Overview", "Marketing Performance", "Regional Breakdown").
   * Looker only loads tiles on the active tab upon initial page load, deferring background queries for inactive tabs until clicked.
2. **Decompose into Modular Summary Dashboards**:
   * Retain 10–12 high-level KPI tiles on the primary executive dashboard.
   * Provide **Custom HTML Drill Links** on dimensions/measures linking to specialized child dashboards:
   ```lookml
   dimension: region {
     type: string
     sql: ${TABLE}.region ;;
     link: {
       label: "🔍 Open Regional Deep-Dive Dashboard"
       url: "/dashboards/456?Region={{ value | encode_uri }}&Date={{ _filters['orders.created_date'] | encode_uri }}"
     }
   }
   ```

---

### Remediation Protocol 2: Enforcing Safe Auto-Refresh Policies
1. **Align Auto-Refresh with Warehouse ETL**:
   * If warehouse tables update daily at 06:00 UTC, disable 5-minute auto-refreshes on dashboards.
2. **Separate Wallboard Displays**:
   * For call center or NOC wallboard monitors, create a dedicated cloned dashboard with auto-refresh enabled. Keep the interactive user-facing dashboard set to manual refresh.
