---
type: Playbook
title: BigQuery Engine & Compute Optimization Playbook
description: Authoritative diagnostic and remediation playbook for BigQuery physical storage, table partitioning, clustering, slot contention, and Aggregate Awareness.
tags: [bigquery, compute, slots, partitioning, clustering, aggregate-awareness, performance]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-28T12:30:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-28T12:30:00Z" }
sources:
  - id: bq-optimization
    resource: /skills/bigquery_compute/references/warehouse_optimization.md
    title: BigQuery Warehouse Optimization Reference
  - id: bq-pipeline
    resource: /skills/bigquery_compute/references/looker_bigquery_pipeline_architecture.md
    title: Looker-BigQuery Pipeline Architecture
---

# BigQuery Engine & Compute Optimization Playbook (Pillar 3)

This playbook defines the diagnostic protocols, telemetry queries, and scoring rubrics for evaluating BigQuery engine health, storage layout, slot utilization, and query execution efficiency.

---

## 🏛️ The 10 BigQuery Compute Checks (P3-21 to P3-30)

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P3-21`** | **Table Partitioning & Clustering** | 100% of large fact tables partitioned & clustered | Partitioned without cluster keys | **Unpartitioned fact tables** (>10M rows) |
| **`P3-22`** | **BI Engine In-Memory Acceleration** | BI Engine memory allocated targeting hot tables | Memory allocated but <50% hit rate | No BI Engine reservation configured |
| **`P3-23`** | **PDT Build Failures & Event Log** | Zero PDT build failures in past 7 days | 1–2 intermittent PDT timeouts | Frequent cascading PDT build failures |
| **`P3-24`** | **Warehouse Slot Contention** | Slot usage < 500 slots; no queue wait | Peak slot usage 500 - 1,500 slots | Slot starvation (>2,000 slots); queries throttled |
| **`P3-25`** | **Query Memory & Shuffle Spills** | 0 memory spills (Executed fully in memory) | Minor memory disk spill | Severe stage shuffle spill to disk |
| **`P3-26`** | **Query Cost & Bytes Billed** | Scans pruned by partition filter (<100 MB) | Queries scanning 100 MB - 1.0 GB | Unbounded full scans (> 3.0 GB / run) |
| **`P3-27`** | **Aggregate Awareness Acceleration** | High-traffic explores route to `aggregate_table` | Partial rollup matching | All queries scan raw un-aggregated fact tables |
| **`P3-28`** | **BigQuery Text Search Indexes** | Text search uses `SEARCH()` with search indexes | Standard `LIKE` / `REGEXP_CONTAINS` | Regex joins forcing Cartesian cross scans |
| **`P3-29`** | **Long Running Query Thread Health** | All interactive queries complete in < 10s | Queries run between 10 - 30s | Zombie queries stalling threads for > 60s |
| **`P3-30`** | **Unpartitioned Full Table Scans** | Semantic layer enforces partition filters | Manual filters only | Explores allow unbounded historical full scans |

---

## 🛠️ Step-by-Step Diagnostic Inquest

### Step 1: Physical Partitioning & Clustering (`INFORMATION_SCHEMA.TABLE_STORAGE`)
Inspect table partitioning types and clustering columns across target datasets:
```sql
SELECT
  table_name,
  total_rows,
  total_logical_bytes / (1024 * 1024 * 1024) AS size_gb,
  partition_id,
  clustering_fields
FROM `<project_id>.<dataset_id>.INFORMATION_SCHEMA.TABLE_STORAGE`
WHERE total_rows > 1000000;
```

### Step 2: Slot Utilization Timeline (`INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT`)
Check whether queries are being throttled by warehouse slot starvation:
```sql
SELECT
  period_start,
  SUM(period_slot_ms) / 1000 AS total_slot_sec,
  MAX(period_slot_ms) / 1000 AS peak_slots
FROM `region-us.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT`
WHERE period_start >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1
ORDER BY peak_slots DESC
LIMIT 20;
```

### Step 3: Top Expensive Queries & Bytes Billed (`INFORMATION_SCHEMA.JOBS_BY_PROJECT`)
Identify queries responsible for massive scan volume:
```sql
SELECT
  job_id,
  user_email,
  query,
  total_bytes_billed / (1024 * 1024 * 1024) AS gb_billed,
  (total_bytes_billed / (1024 * 1024 * 1024 * 1024)) * 6.25 AS cost_usd,
  total_slot_ms / 1000 AS slot_seconds
FROM `region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND job_type = 'QUERY'
ORDER BY total_bytes_billed DESC
LIMIT 10;
```

---

## 📝 Prescriptive Remediation Patterns

### 1. Partitioning & Clustering DDL Pattern:
```sql
CREATE OR REPLACE TABLE `<project_id>.<dataset_id>.<fact_table>_partitioned`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, status
OPTIONS(
  description = "Partitioned and clustered fact table for Looker acceleration",
  require_partition_filter = FALSE
) AS
SELECT * FROM `<project_id>.<dataset_id>.<fact_table>`;
```

### 2. LookML Aggregate Awareness Pattern:
```lookml
explore: order_items {
  persist_with: etl_datagroup

  aggregate_table: rollup__daily_sales_by_status {
    query: {
      dimensions: [created_date, status, users.country]
      measures: [total_sale_price, order_count]
      timezone: "UTC"
    }
    materialization: {
      datagroup_trigger: etl_datagroup
    }
  }
}
```
