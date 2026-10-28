---
name: bq-jobs-diagnostics
description: >-
  Audits BigQuery warehouse performance, slot saturation timelines, query cost
  outliers, stage shuffle spills, table partitioning/clustering alignment, and
  Aggregate Awareness candidates using the bq CLI and INFORMATION_SCHEMA. Use when
  diagnosing BigQuery slot contention, high query costs, or unpartitioned table
  scans from Looker. Don't use for Looker onboarding or creating new dashboards.
compatibility: Requires bq CLI and looker-cli.
license: Apache-2.0
metadata:
  version: 0.1.0
  domain: looker-operations
  status: preview
  usage-interface: looker-cli looker-mcp
  publisher: google
  shared-refs: looker-cli-setup looker-cli-auth
---

# BigQuery Jobs & Warehouse Diagnostics Skill

This skill guides an agent or engineer to audit BigQuery query workloads originating from Looker, diagnose slot contention, identify unpartitioned table scans, and evaluate cost outliers using the Google Cloud `bq` CLI and `INFORMATION_SCHEMA`.

---

## When to Use This Skill

Activate this skill when:
* Auditing BigQuery slot saturation, reservation limits, or query queueing.
* Detecting large unpartitioned or unclustered full table scans originating from Looker.
* Investigating query stage memory spills to disk and expensive shuffle operations.
* Evaluating opportunities for LookML Aggregate Awareness rollups.
* Sizing or tuning BigQuery BI Engine reservations.

---

## Critical Behavioral Directives

1. **Prerequisite Check (`looker-base`)**: If the Looker MCP tools or `looker-cli` aren't available when correlating Looker queries, ask the user to install `looker-base`.
2. **Reality Mapping First**: Confirm the target GCP `project_id`, dataset, and BigQuery region (`region-us`, `region-eu`, etc.) before running `INFORMATION_SCHEMA` queries.
3. **Read-Only Execution & Surgical DDL**: Only execute `SELECT` queries against `INFORMATION_SCHEMA`. Never run `ALTER TABLE`, `CREATE OR REPLACE TABLE`, or `DROP` automatically without explicit user approval.

---

## Direct CLI Execution

Execute all diagnostic SQL statements directly via the `bq` CLI:
```bash
bq query --use_legacy_sql=false --format=prettyjson "<SQL_FROM_REFERENCES>"
```

---

## 4-Step BigQuery Diagnostic Protocol

### Step 1: Slot Contention & Saturation Timelines
Query `INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT` during peak hours to measure `period_slot_ms / 1000` (avg slots consumed), `period_shuffle_ram_usage_ratio` (memory spills), and `period_estimated_runnable_units` (queued units).
* **Target SLA**: Queued units = `0`. If `queued_units > 0`, Looker queries were throttled due to slot starvation.
* Query Reference: [Slot Consumption Timeline SQL](references/slot_consumption_timeline.md)

### Step 2: Table Partitioning & Clustering Alignment
Query `INFORMATION_SCHEMA.TABLE_STORAGE` and `INFORMATION_SCHEMA.COLUMNS` to identify fact tables over 10M rows lacking date partitioning or clustering.
* **Rule**: Every fact table with over 10M rows must declare `PARTITION BY DATE(...)` and `CLUSTER BY` on high-cardinality Looker filter columns (up to 4 columns).
* Query & DDL Reference: [Table Partitioning & Clustering DDL](references/table_partition_ddl.md)

### Step 3: Query Costs & Bytes Billed Outliers
Query `INFORMATION_SCHEMA.JOBS_BY_PROJECT` over the past 24 hours ordered by `total_bytes_billed DESC` to isolate runaway Looker queries and calculate on-demand cost (`tb_billed * 6.25`).
* Query Reference: [Bytes Billed by Model SQL](references/bytes_billed_by_model.md)

### Step 4: Aggregate Awareness & BI Engine Candidates
Identify high-frequency Looker queries scanning millions of rows for summary metrics (daily sales, active users) and prescribe LookML `aggregate_table` rollups or BI Engine reservations.
* Reference: [Aggregate Awareness & Architecture](references/aggregate_awareness_and_architecture.md)

---

## Deep-Dive References

* [BigQuery Compute Playbook](references/playbook_bigquery_compute.md)
* [BigQuery Scoring Rubric](references/scoring_bigquery_compute.md)
* [Warehouse Optimization Guide](references/warehouse_optimization.md)
* [Slot Consumption Timeline SQL](references/slot_consumption_timeline.md)
* [Table Partitioning & Clustering DDL](references/table_partition_ddl.md)
* [Bytes Billed by Model SQL](references/bytes_billed_by_model.md)
* [Aggregate Awareness & Architecture](references/aggregate_awareness_and_architecture.md)
* [BI Engine Optimization](references/bi_engine_optimization.md)
* [Looker BigQuery Pipeline Architecture](references/looker_bigquery_pipeline_architecture.md)
* [Incremental PDTs Guide](references/incremental_pdts_guide.md)
* [BigQuery Search Indexes](references/bigquery_search_indexes.md)
