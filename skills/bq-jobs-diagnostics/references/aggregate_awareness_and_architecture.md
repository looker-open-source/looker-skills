---
type: Reference
title: Advanced Optimization, Aggregate Awareness & Enterprise Architecture
description: Implementation protocols for Looker Aggregate Awareness (aggregate_table) and Hub & Spoke modular project architecture.
tags: [looker, aggregate-awareness, rollups, hub-and-spoke, architecture]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: vendor-agg-awareness
    resource: /skills/vendor/looker-skills/skills/looker-architect/references/aggregate_awareness.md
    title: Looker Aggregate Awareness Reference
---

# Advanced Optimization, Aggregate Awareness & Enterprise Architecture Playbook

This reference document defines the complete implementation and diagnostic protocols for Looker **Aggregate Awareness** (`aggregate_table`) and **Hub & Spoke** modular project architecture.

---

## 🔍 Part 1: How to Review & Diagnose Optimization Candidates

### 1. The Aggregate Awareness Routing Engine

```
                    AGGREGATE AWARENESS ROUTING ENGINE
                                User Query
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │ Looker SQL Compiler                  │
                 │ Checks active aggregate_table list   │
                 └──────────────────┬───────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │ Matches Rollup Level?                           │
           ▼ (YES)                                           ▼ (NO)
 ┌───────────────────────────────────┐             ┌───────────────────────────────────┐
 │ ⚡ COMPACT AGGREGATE TABLE        │             │ 🐢 FULL RAW FACT TABLE            │
 │ • Scans: 10,000 pre-aggregated rows│             │ • Scans: 100,000,000 raw rows     │
 │ • Latency: < 0.8 seconds          │             │ • Latency: 12 - 25 seconds        │
 │ • Cost: $0.0001                   │             │ • Cost: $0.6250                   │
 └───────────────────────────────────┘             └───────────────────────────────────┘
```

---

### 2. Identifying Aggregate Awareness Candidates in System Activity
Execute this query to find the top high-frequency explore queries running against raw fact tables:
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "query.model",
    "query.view",
    "history.query_run_count",
    "history.average_runtime"
  ],
  "filters": {
    "history.created_date": "30 days",
    "query.model": "-NULL"
  },
  "sorts": ["history.query_run_count desc"],
  "limit": "15"
}
```

---

## 🛠️ Part 2: How to Rectify & Implement Acceleration

### Step 1: Define Centralized Event Datagroups
```lookml
# models/ecommerce.model.lkml
connection: "bigquery_production"

datagroup: warehouse_daily_etl_datagroup {
  sql_trigger_value: SELECT MAX(created_at) FROM `project.dataset.etl_log` WHERE status = 'SUCCESS' ;;
  max_cache_age: "24 hours"
  description: "Triggers cache and aggregate table rebuilds upon completion of warehouse ETL."
}
```

---

### Step 2: Declare Aggregate Tables in the Explore
Add `aggregate_table:` blocks directly inside high-traffic explores:

```lookml
# explores/orders.explore.lkml
explore: orders {
  persist_with: warehouse_daily_etl_datagroup
  
  join: users {
    relationship: many_to_one
    sql_on: ${orders.user_id} = ${users.id} ;;
  }

  # Aggregate Rollup: Daily Sales by Category & Country
  aggregate_table: rollup__daily_sales_by_category {
    query: {
      dimensions: [
        orders.created_date,
        users.country,
        products.category
      ]
      measures: [
        orders.total_revenue,
        orders.count,
        orders.average_order_value
      ]
      timezone: "America/New_York"
    }
    materialization: {
      datagroup_trigger: warehouse_daily_etl_datagroup
      partition_keys: ["created_date"]
      cluster_keys: ["country", "category"]
    }
  }
}
```

---

### Step 3: Hub & Spoke Modular Project Architecture
For organizations with multiple domain teams, decompose monolithic projects into a **Hub & Spoke** dependency structure:

```
                            HUB & SPOKE ARCHITECTURE
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ CORE HUB REPOSITORY (git@github.com:org/lookml-core-hub.git)              │
 │ • Database connection definitions                                         │
 │ • Physical view models (.view.lkml) mapping raw warehouse schema          │
 │ • Core enterprise dimensions (Primary keys, standardized date logic)      │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │ (Imported via remote_dependency)
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
 ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
 │ Marketing Spoke Repo │    │ Finance Spoke Repo   │    │ Product Analytics    │
 │ • Refined Explores   │    │ • GAAP Measures      │    │ • Clickstream Models │
 │ • Campaign Dashboards│    │ • Financial Models   │    │ • Retention Explores │
 └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

#### Manifest Dependency Configuration (`manifest.lkml`):
```lookml
# manifest.lkml in marketing_spoke project
project_name: "marketing_spoke"

remote_dependency: lookml_core_hub {
  url: "git@github.com:company/lookml-core-hub.git"
  ref: "v2.1.0" # Lock to immutable semantic release tag
}
```
