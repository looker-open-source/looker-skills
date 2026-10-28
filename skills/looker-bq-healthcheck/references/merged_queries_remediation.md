---
type: Reference
title: Merged Queries Diagnostic & Native LookML Remediation Guide
description: Operational risks of in-memory merged queries and step-by-step LookML refactoring into native joins.
tags: [looker, merged-queries, joins, lookml-refactoring]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: modeling-guidelines
    resource: /skills/vendor/looker-skills/skills/lookml-modeling-guidelines/SKILL.md
    title: LookML Modeling Guidelines
---

# Merged Queries Diagnostic & Native LookML Remediation Playbook

This reference document defines the operational risks, diagnostic detection queries, and step-by-step LookML refactoring workflows for eliminating in-memory merged queries.

---

## 🔍 Part 1: How to Review & Diagnose Merged Queries

### 1. Why Merged Queries Degrade Cluster Performance

A Looker Merged Query is an **in-memory, client-side join** performed inside the Looker JVM rather than in the database warehouse:

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                           MERGED QUERY EXECUTION ARCHITECTURE                               │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 1. Spawns N parallel sub-queries to the database warehouse (saturating user connection cap). │
 │ 2. Downloads raw result sets (up to 5,000 rows each) over the network into Looker memory.  │
 │ 3. Joins datasets in Looker RAM using single-threaded CPU workers.                          │
 │ 4. Applies pivots and table calculations on top of the unindexed in-memory dataset.        │
 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> **Performance Impact**: Merged queries lock worker threads in heavy `postprocessing`, risk Out-Of-Memory (OOM) instance restarts on large datasets, and trigger `per_user_throttler` queueing for concurrent users.

---

### 2. Diagnostic Telemetry Queries (System Activity)

#### A. Dashboards with Highest Merged Query Concentration
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard_element.count_merge_query",
    "query.count"
  ],
  "filters": {
    "merge_query_source_query.count": ">0",
    "dashboard.moved_to_trash": "No"
  },
  "sorts": ["dashboard_element.count_merge_query desc"],
  "limit": "25"
}
```

#### B. Worst Merged Queries (High Source Counts & Compound Overhead)
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard_element.title",
    "user.name",
    "merge_query_source_query.count",
    "merge_query.formatted_pivots",
    "merge_query.dynamic_fields"
  ],
  "filters": {
    "merge_query.id": "-NULL",
    "dashboard.moved_to_trash": "No"
  },
  "sorts": ["merge_query_source_query.count desc"],
  "limit": "25"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate Merged Queries

### Step 1: Inspect Merged Query Components
Examine the merge query definition in the UI or System Activity to identify:
1. Primary Source Explore & Fields
2. Secondary Source Explore(s) & Fields
3. Join Link Dimension (e.g. `order_date` or `customer_id`)

---

### Step 2: Refactor into Native LookML Explore Join or PDT

#### Scenario A: Direct Join Available in LookML
If the two views share a common join key, add the join directly to the explore definition:
```lookml
# explores/orders.explore.lkml
explore: orders {
  join: marketing_ad_spend {
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.created_date} = ${marketing_ad_spend.date}
        AND ${orders.campaign_id} = ${marketing_ad_spend.campaign_id} ;;
  }
}
```

#### Scenario B: Grain Mismatch (Requires Pre-Aggregated PDT)
When joining datasets of differing grains (e.g. daily ad spend with individual transaction orders), pre-aggregate the fact dataset in a Persistent Derived Table:
```lookml
# views/daily_ad_spend_summary.view.lkml
view: daily_ad_spend_summary {
  derived_table: {
    datagroup_trigger: daily_etl_datagroup
    sql:
      SELECT
        date,
        campaign_id,
        SUM(spend) AS total_ad_spend
      FROM `project.dataset.marketing_spend`
      GROUP BY 1, 2 ;;
  }

  dimension: date {
    type: date
    sql: ${TABLE}.date ;;
  }

  dimension: campaign_id {
    type: string
    sql: ${TABLE}.campaign_id ;;
  }

  measure: total_spend {
    type: sum
    sql: ${TABLE}.total_ad_spend ;;
    value_format_name: usd
  }
}
```

---

### Step 3: Replace Dashboard Tile
1. Re-open the target dashboard.
2. Edit the merged tile and replace it with the new native Explore.
3. Verify that completed tile runtime drops from $>10\text{s}$ (in-memory merge) to $<1\text{s}$ (warehouse-accelerated SQL).
