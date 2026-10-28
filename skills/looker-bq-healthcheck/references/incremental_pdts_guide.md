---
type: Reference
title: Incremental Persistent Derived Tables (PDTs) Optimization Guide
description: Architecture, LookML patterns, and BigQuery partition alignment for Incremental Persistent Derived Tables.
tags: [looker, pdt, incremental-pdt, bigquery, partitioning, optimization]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-24T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-24T14:00:00Z" }
sources:
  - id: lookml-pdt-guidelines
    resource: https://github.com/looker-open-source/looker-skills/tree/main/skills/lookml-pdt-guidelines
    title: LookML PDT Guidelines
  - id: warehouse-optimization
    resource: skills/custom/healthcheck/references/warehouse_optimization.md
    title: BigQuery & Warehouse Compute Optimization Guide
---

# Incremental Persistent Derived Tables (PDTs) Optimization Guide

When fact tables exceed millions or billions of rows, rebuilding a Persistent Derived Table (PDT) from scratch every cycle creates severe database slot contention, wastes warehouse scan budget, and delays downstream reporting.

**Incremental PDTs** solve this problem by querying and appending only the most recent window of data rather than re-computing all historical partitions.

---

## ⚡ 1. Incremental PDT Architecture in BigQuery

```
                             INCREMENTAL PDT BUILD CYCLE
                                          │
    ┌─────────────────────────────────────┴─────────────────────────────────────┐
    ▼                                                                           ▼
[HISTORICAL PARTITIONS (LOCKED)]                              [ACTIVE REFRESH WINDOW (APPEND)]
• Partitions: 2020-01-01 to 2026-08-20                         • Partitions: Past 3 Days (Offset: 3)
• Status: Retained in-place (0 compute scanned)                • Action: Overwrite & Insert latest data
• Storage: BigQuery native partitioned table                   • Compute: Scans < 0.1% of historical volume
```

---

## 🛠️ 2. Core LookML Parameters for Incremental PDTs

| Parameter | Required | Purpose | BigQuery Recommendation |
| :--- | :---: | :--- | :--- |
| `increment_key` | **Yes** | Time-based dimension used to segment and filter appended data. | Must match a date/timestamp field (e.g. `created_date`). |
| `increment_offset` | **Yes** | Number of historical periods to re-compute to catch late-arriving data. | Set to `3` (for days) or `2` (for hours). |
| `datagroup_trigger` | **Yes** | Invalidation trigger tied to upstream ETL load. | Use ETL watermark trigger (`SELECT MAX(created_at)...`). |
| `partition_keys` | **Yes** | Physical BigQuery table partitioning column. | `partition_keys: ["created_date"]` |
| `cluster_keys` | Recommended | High-cardinality query dimensions. | `cluster_keys: ["user_id", "status"]` |

---

## 📝 3. Production LookML Pattern (BigQuery Native)

```lookml
view: daily_order_summary_incremental {
  derived_table: {
    datagroup_trigger: etl_pipeline_datagroup
    increment_key: "created_date"
    increment_offset: 3
    partition_keys: ["created_date"]
    cluster_keys: ["user_id", "status"]
    
    explore_source: order_items {
      column: created_date { field: order_items.created_date }
      column: user_id { field: order_items.user_id }
      column: status { field: order_items.status }
      column: total_gross_margin { field: order_items.total_gross_margin }
      column: order_count { field: order_items.order_count }
      
      filters: {
        field: order_items.created_date
        value: "after 2020-01-01"
      }
    }
  }

  dimension: created_date {
    type: date
    datatype: date
    primary_key: no
    sql: ${TABLE}.created_date ;;
  }

  dimension: user_id {
    type: number
    hidden: yes
    sql: ${TABLE}.user_id ;;
  }

  dimension: status {
    type: string
    sql: ${TABLE}.status ;;
  }

  measure: total_gross_margin {
    type: sum
    value_format_name: usd
    sql: ${TABLE}.total_gross_margin ;;
  }

  measure: total_orders {
    type: sum
    sql: ${TABLE}.order_count ;;
  }
}
```

---

## 🚨 4. Common Anti-Patterns & Failure Modes

1. **Missing `increment_offset`**: Setting `increment_offset: 0` causes late-arriving transactions (orders placed yesterday but updated today) to be permanently dropped from historical totals.
2. **Non-Date Increment Keys**: Using strings or non-ordered keys triggers full rebuild errors during compilation.
3. **Partition Mismatch**: Ensure the LookML `increment_key` maps directly to the physical BigQuery `partition_keys` to avoid unpartitioned scratch table creation.
