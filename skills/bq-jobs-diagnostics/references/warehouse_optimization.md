---
type: Reference
title: BigQuery & Warehouse Compute Optimization Guide
description: SQL definitions and diagnostic thresholds for auditing BigQuery compute, slot contention, on-demand query costs, and partitioning.
tags: [bigquery, slots, partition-pruning, query-costs, information-schema]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: connecting-bq
    resource: /skills/vendor/looker-skills/skills/connecting-looker-to-bigquery/SKILL.md
    title: Connecting Looker to BigQuery
  - id: mig-optimize
    resource: "https://google-cloud-professional-services.googlesource.com/mig-optimize"
    title: MIG Optimize Diagnostic Framework
    author: "team:google-pso"
  - id: bi-engine-optimization
    resource: skills/custom/healthcheck/references/bi_engine_optimization.md
    title: BigQuery BI Engine & Memory Sizing Optimization Guide
  - id: incremental-pdts-guide
    resource: skills/custom/healthcheck/references/incremental_pdts_guide.md
    title: Incremental Persistent Derived Tables (PDTs) Optimization Guide
  - id: bigquery-search-indexes
    resource: skills/custom/healthcheck/references/bigquery_search_indexes.md
    title: BigQuery Search Indexes for Looker Explores Guide
---

# BigQuery & Warehouse Compute Optimization Playbook

This reference catalog provides the exact SQL query definitions, diagnostic thresholds, and optimization patterns for auditing BigQuery compute, slot contention, on-demand query costs, partition pruning, and datagroup ETL synchronization.

> [!NOTE]
> **Attested Computations & Upstream References**:
> * [`slot_consumption_timeline.md`](../computations/slot_consumption_timeline.md): Attested BigQuery 24-hour slot consumption & saturation timeline query.
> * [`bytes_billed_by_model.md`](../computations/bytes_billed_by_model.md): Attested query cost and gigabytes billed audit query.
> * [`table_partition_ddl.md`](../computations/table_partition_ddl.md): Attested BigQuery DDL generator for table partitioning and clustering.
> * [`connecting-looker-to-bigquery`](../../vendor/looker-skills/skills/connecting-looker-to-bigquery/SKILL.md): BigQuery connection architecture, BI Engine setup, and dataset permissions.
> * [`mig-optimize`](https://google-cloud-professional-services.googlesource.com/mig-optimize): Google Cloud Professional Services BigQuery migration & slot/stage performance diagnostic framework.

---

## ⚡ 1. Slot Contention & Reservation Analysis

When queries experience long execution or queue times, check for slot starvation and reservation saturation in BigQuery using the sanctioned [`slot_consumption_timeline.md`](../computations/slot_consumption_timeline.md) computation contract.

### SQL Query: Slot Consumption Timeline (Past 24 Hours)
```sql
SELECT
  TIMESTAMP_TRUNC(period_start, HOUR) as hour_window,
  ROUND(AVG(period_slot_ms) / 1000, 2) as avg_slots,
  ROUND(MAX(period_slot_ms) / 1000, 2) as peak_slots
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT
WHERE
  period_start >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1
ORDER BY hour_window DESC
LIMIT 24;
```

#### Diagnostic Thresholds:
* **Slot Starvation**: `peak_slots` consistently reaching or exceeding the project slot reservation limit (e.g., 2000 slots) during morning dashboard peaks (8:00 AM - 10:00 AM).
* **Remediation**:
  1. Stagger scheduled deliveries away from top-of-the-hour bursts.
  2. Implement LookML `aggregate_table` to bypass raw table scans.
  3. Allocate dedicated reservations for Looker or enable BigQuery autoscaling slots.

---

## 💰 2. Query Cost & Data Scanned Forensics (BigQuery Job Labels)

Looker automatically attaches structured metadata key-value tags to every query job dispatched to BigQuery:
* `looker-context-user_id`: Numeric ID of the Looker user who ran the query.
* `looker-context-history_slug`: Unique slug matching `system__activity/history.slug` for 2-way cross-referencing.
* `looker-context-instance_slug`: Instance identifier.

Because these labels are stored as structured metadata (`ARRAY<STRUCT<key STRING, value STRING>>`), filtering via `EXISTS(SELECT 1 FROM UNNEST(labels) WHERE key LIKE 'looker-context%')` is significantly faster, cleaner, and more reliable than parsing raw SQL strings.

### SQL Query: Looker Query Billing & Cost by User (Past 24 Hours)
```sql
SELECT
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-user_id') AS looker_user_id,
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-instance_slug') AS instance_slug,
  COUNT(DISTINCT job_id) as looker_queries_count,
  ROUND(SUM(total_bytes_billed) / (1024 * 1024 * 1024), 2) as total_gb_billed,
  ROUND((SUM(total_bytes_billed) / POW(10, 12)) * 6.25, 4) as estimated_cost_usd,
  ROUND(SUM(total_slot_ms) / 1000, 2) as total_slot_seconds
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
  creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND job_type = 'QUERY'
  AND EXISTS (
    SELECT 1 FROM UNNEST(labels) WHERE key LIKE 'looker-context%'
  )
GROUP BY 1, 2
ORDER BY total_gb_billed DESC
LIMIT 24;
```

### SQL Query: Top 10 Most Expensive Looker Queries with History Slug
```sql
SELECT
  project_id,
  job_id,
  creation_time,
  user_email,
  -- Extract Looker Job Labels
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-user_id') AS looker_user_id,
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-history_slug') AS looker_history_slug,
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-instance_slug') AS looker_instance_slug,
  -- Performance & Cost Metrics
  total_bytes_billed,
  ROUND(total_bytes_billed / (1024 * 1024 * 1024), 2) as gb_billed,
  ROUND((total_bytes_billed / POW(10, 12)) * 6.25, 4) as estimated_cost_usd,
  total_slot_ms,
  query
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
  creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = 'QUERY'
  AND EXISTS (
    SELECT 1 FROM UNNEST(labels) WHERE key LIKE 'looker-context%'
  )
ORDER BY total_bytes_billed DESC
LIMIT 10;
```

---

## 🎯 3. Partitioning & Clustering Alignment

Ensure large fact tables are partitioned (by date/timestamp/integer) and clustered (by high-cardinality filter dimensions like `company_id`, `status`, `user_id`).

### LookML View Partition Enforcement:
```lookml
view: orders {
  sql_table_name: `my_project.analytics.orders` ;;
}

explore: orders {
  conditionally_filter: {
    filters: [orders.created_date: "30 days"]
    unless: [orders.order_id]
  }
}
```

---

## 🔄 4. Datagroup Caching & ETL Pipeline Synchronization

Ensure Looker datagroups are triggered by warehouse ELT job completion rather than fixed cron intervals.

### SQL Query: BigQuery ELT Job Completion Timestamps
```sql
SELECT
  project_id,
  job_id,
  creation_time,
  end_time,
  TIMESTAMP_DIFF(end_time, creation_time, SECOND) as duration_seconds,
  statement_type
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
  creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND statement_type IN ('INSERT', 'MERGE', 'CREATE_TABLE_AS_SELECT')
ORDER BY end_time DESC
LIMIT 20;
```

---

## 🏗️ 5. Aggregate Awareness Acceleration (`aggregate_table`)

Accelerate dashboard load times by 10x–100x on BigQuery without rewriting Explore queries:

```lookml
explore: orders {
  aggregate_table: rollup_monthly_orders {
    query: {
      dimensions: [orders.created_month, users.country]
      measures: [orders.total_revenue, orders.count]
      timezone: "America/New_York"
    }
    materialization: {
      datagroup_trigger: etl_pipeline_datagroup
    }
  }
}
```
