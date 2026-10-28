---
type: Reference
title: Looker & BigQuery Interconnected Pipeline Architecture
description: 6-stage interconnected execution pipeline blueprint, 4 major failure loops, and 5-dimensional audit strategy.
tags: [looker, bigquery, pipeline-architecture, failure-loops, forensics]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: connecting-bq
    resource: /skills/vendor/looker-skills/skills/connecting-looker-to-bigquery/SKILL.md
    title: Connecting Looker to BigQuery
---

# Looker & BigQuery Interconnected Pipeline Architecture

To understand how performance problems propagate between Looker and BigQuery, you must view the system as an **interconnected execution pipeline**. A bottleneck in BigQuery is often caused by an architectural decision in LookML, and a slow dashboard is often caused by concurrency congestion rather than raw compute speed.

---

## 1. The End-to-End Query Lifecycle & Dependency Chain

Every interaction travels through six connected stages. A breakdown at any upstream stage cascades down the chain:

```text
[1. User / Schedule Action]
         │
         ▼
[2. Looker Orchestration & Queue]
         │
         ▼
[3. SQL Generation (LookML Engine)]
         │
         ▼
[4. BigQuery Admission & Slots]
         │
         ▼
[5. BigQuery Execution & Storage Engine]
         │
         ▼
[6. Looker Result Ingestion & Browser Render]
```

---

## 2. How Bottlenecks Chain Together

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             UPSTREAM LOOKER CAUSE                                │
│  • Dashboard with 25 tiles opens at 9:00 AM                                      │
│  • Explores lack partition filters (`always_filter` missing)                     │
│  • Heavy use of merged queries & Symmetric Aggregates                            │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           QUEUE & CONCURRENCY SPIKE                              │
│  • Looker exhausts JDBC connection pool (Queries enter Wait state)               │
│  • Looker opens max concurrent sessions to BigQuery                              │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            BIGQUERY SLOT CONTENTION                              │
│  • Slot starvation: 25 unpartitioned queries request slots simultaneously        │
│  • Concurrent ETL / dbt runs collide on the same reservation pool                │
│  • Fair-share scheduler throttles slots per query, inflating execution time      │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           STORAGE & EXECUTION CHOKE                              │
│  • Full table scans (missing partition pruning) blow through bytes processed     │
│  • Fan-out joins force BigQuery into massive memory shuffle & disk spills        │
│  • BI Engine bypasses acceleration due to complex SQL / missing RAM              │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          DOWNSTREAM CLIENT CRASH / LAG                           │
│  • Queries return massive row counts (100k+ rows)                                │
│  • Looker Ruby node spikes CPU joining merged query streams in-memory            │
│  • Browser DOM freezes rendering 25 high-cardinality charts                      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 4 Major Failure Loops

### 🔁 Failure Loop 1: The Concurrency & Throttling Loop
* **The Chain**: Many users or scheduled bursts $\rightarrow$ Looker connection pool fills $\rightarrow$ Looker queue wait time spikes $\rightarrow$ Wave of queries releases into BigQuery all at once $\rightarrow$ BigQuery reservation slots hit \%$ capacity $\rightarrow$ Slot allocation per query drops $\rightarrow$ Query duration extends from 2s to 45s.
* **Root Cause**: Lack of query staggering, unscheduled batch deliveries, and high tile density.
* **Where to Verify**: Compare `acquire_connection` in `system__activity/query_metrics` against `INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT` slot consumption spikes in BigQuery.
* **Remediation**:
  1. Stagger scheduled plans to odd minutes (`:07`, `:22`, `:37`, `:52`).
  2. Split dashboards with $>25$ tiles into focused multi-tab or linked dashboards.
  3. Increase connection pool limits or allocate dedicated BigQuery reservation pools for Looker.

### 🔁 Failure Loop 2: The Semantic & Storage Mismatch Loop
* **The Chain**: LookML joins tables on non-clustered or derived keys $\rightarrow$ Looker cannot prune partitions because filters aren't mandatory $\rightarrow$ BigQuery scans entire multi-terabyte tables for a 3-row KPI tile $\rightarrow$ Billed bytes soar $\rightarrow$ Query requires heavy slot power simply to read metadata and raw files.
* **Root Cause**: Explore design lacks `always_filter` or `conditionally_filter`, and tables lack matching clustering keys on filter/join dimensions.
* **Where to Verify**: `total_bytes_billed` in BigQuery `INFORMATION_SCHEMA.JOBS_BY_PROJECT` vs Explore query definition.
* **Remediation**:
  1. Add `always_filter:` or `conditionally_filter:` on partitioned date fields in LookML.
  2. Align BigQuery table clustering keys (`CLUSTER BY`) with top-filtered LookML dimensions.
  3. Use Looker Aggregate Awareness (`aggregate_table:`) for high-level KPI tiles.

### 🔁 Failure Loop 3: The Aggregation & Fan-Out Loop
* **The Chain**: :N$ relationships joined in LookML $\rightarrow$ Looker triggers **Symmetric Aggregates** (rewriting queries with `COUNT(DISTINCT ...)`, large hashing, and sub-selects) $\rightarrow$ BigQuery query planner cannot use optimized simple aggregations $\rightarrow$ Intermediate shuffle partitions blow up $\rightarrow$ Stage data spills to persistent storage.
* **Root Cause**: Incorrect `relationship:` tags in LookML or failure to pre-aggregate grain in dbt/BigQuery tables before joining.
* **Where to Verify**: Looker SQL tab (presence of `DISTINCT` primary keys in calculation) + BigQuery Stage Details (`Shuffle data spilled to disk`).
* **Remediation**:
  1. Audit primary keys (`primary_key: yes`) across all joined views.
  2. Verify explicit `relationship: many_to_one` or `one_to_one` declarations.
  3. Pre-aggregate granular child tables into Persistent Derived Tables (PDTs) before joining.

### 🔁 Failure Loop 4: The Ingestion & Client Overload Loop
* **The Chain**: Query runs fast in BigQuery (\text{ ms}$), but returns 250,000 unaggregated rows $\rightarrow$ Looker instance must download, parse, and serialize the massive JSON/streaming payload $\rightarrow$ If it's a Merged Query, Looker joins them in-memory $\rightarrow$ Looker instance runs out of memory or hits CPU spikes $\rightarrow$ Browser tab consumes 3 GB of RAM rendering DOM nodes.
* **Root Cause**: Moving computation from BigQuery (where slots are fast) to Looker/Browser layers (which are single-node bottlenecked).
* **Where to Verify**: Looker System Activity: High difference between `execute_main_query` and `async_processing` (high `stream_to_cache` or Looker JVM overhead).
* **Remediation**:
  1. Enforce query row limits (`max_total_rows` or default limits).
  2. Replace in-memory Looker merged queries with native LookML joins or warehouse views.
  3. Replace dense raw-data tables on dashboards with aggregated charts.

---

## 4. Comprehensive Multi-Dimensional Audit Strategy

Organize your performance audit across five operational dimensions:

```text
                  ┌──────────────────────────────┐
                  │ PERFORMANCE AUDIT DIMENSIONS │
                  └──────────────┬───────────────┘
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   [ 1. BY TIME ]         [ 2. BY MODEL ]         [ 3. BY WORKLOAD ]
   • Hourly heatmaps      • Cost per explore      • Scheduled vs Ad-hoc
   • Cron alignments      • Fan-out hotspots      • PDT rebuild cycles
   • Month-end spikes     • Unused explores       • Real-time alerts
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
          [ 4. BY ARTIFACT ]               [ 5. BY ACTOR ]
          • Top 10 worst dashboards       • Service accounts
          • Single tile runaways          • Bot scripts / API keys
          • Merged query maps             • Non-technical ad-hoc
```

### 1. By Time (Temporal Topology)
* **Top-of-Hour Clumping**: Check for query spikes at `:00`, `:15`, `:30`, `:45`. Moving schedules to odd minutes (`:07`, `:22`) eliminates concurrency waves without code changes.
* **ETL vs. Consumption Overlap**: Overlay dbt/Airflow pipeline runtime intervals with Looker peak usage hours to avoid running heavy transforms during peak business query hours.

### 2. By Model & Explore (Semantic Topology)
* **Cost/Slot Consumption by Model**: Group BigQuery jobs by `looker_context:model` to find which data domains account for \%$ of slot hours.
* **Explore Pruning**: Identify abandoned explores that run unoptimized legacy SQL or lack aggregate awareness.

### 3. By Workload Type (Execution Topology)
* **Scheduled vs. Interactive**: Scheduled reports can tolerate queues; interactive dashboards cannot. Verify if scheduled jobs are consuming shared reservations needed by business users in dashboards.
* **PDT vs. Query Interference**: Monitor PDT build cascades. If 5 PDTs rebuild at 8:45 AM, they starve dashboard users of connection slots and BQ resources.

### 4. By Artifact (Dashboard & Look Topology)
* **Dashboard Complexity Score Formula**:
57073\text{Complexity Score} = \text{Tiles} \times \text{Average Query Duration (s)} \times \text{Daily Views}57073

* **Tile Outliers (The Weakest Link)**: A dashboard with 12 tiles is only as fast as its single slowest tile. Isolate and optimize the $ runtime tile.

### 5. By User & Role (Behavioral Topology)
* **Heavy Explorers**: Identify users pulling raw unaggregated data into Excel/CSV via Looker.
* **Automated API Bots**: Check if custom internal apps or scripts are hammering Looker APIs and draining database connections.

---

## 5. Step-by-Step Performance Diagnostic Flowchart

When investigating a system slowdown, follow this sequence to pinpoint the exact broken link:

| Step | Metric / Area to Check | If High / Failing | Root Cause | Prescribed Remediation |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Looker System Activity: `acquire_connection` | $> 2\text{ seconds}$ | JDBC Connection Pool exhaustion, too many simultaneous tiles/users. | Stagger schedules, lower tile count, increase pool limit. |
| **2** | Looker Generated SQL | Contains `CASE WHEN ... SUM(DISTINCT)` | Symmetric Aggregates active $\rightarrow$ LookML relationship definition mismatch (:N$). | Define `primary_key: yes` and verify `relationship: many_to_one`. |
| **3** | BQ `INFORMATION_SCHEMA`: `reservation_id` & Slot Usage | Slot usage at \%$ limit | Reservation undersized or noisy-neighbor workload (ETL/PDTs) stealing slots. | Assign Looker to dedicated reservation assignment; throttle ETL. |
| **4** | BQ Job Stage: Shuffle & Spill | `spilled_bytes > 0` | Data skew, massive unaggregated joins, or Cartesian products in generated query. | Optimize join keys (avoid functions in `ON`), pre-aggregate with PDT. |
| **5** | BQ Bytes Processed vs. Table Size | Processing $> 50\%$ of table | Missing partition filter in LookML explore. | Enforce partition filters via `always_filter:` or `conditionally_filter:`. |
| **6** | Looker System Activity: `stream_to_cache` / JVM Overhead | $> 5\text{ seconds}$ after BQ finish | Tile returning $> 5,000$ rows, complex merged queries, or browser DOM overload. | Add row limits, replace merged queries with LookML joins. |
