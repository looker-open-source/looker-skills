# Looker Performance & Query Lifecycle Playbook

This master playbook defines the diagnostic protocols, Google Cloud PSO benchmarks, progressive drilldown workflows, 5-vector root cause analysis, and remediation patterns for auditing Looker query performance, JVM overhead, and connection concurrency.

---

## 1. Executive 3-Way Latency Triage Framework

When slow queries or long dashboard loading times occur (`async_processing > 5.0s`), classify the bottleneck into one of three categories:

```
                          SLOW QUERY LATENCY DETECTED
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 [WAREHOUSE BOUND]              [JVM OVERHEAD BOUND]           [POOL & QUEUE CONTENTION]
 execute_main_query > 70%       Overhead % > 30%               acquire_connection > 0.25s
 • Full table scans             • Dynamic fields (>2/tile)     • Top-of-hour cron stampedes
 • Missing partition filters    • Merged queries in RAM        • Dashboard tile bursts (>25)
 • Symmetric aggregation        • Unbounded row limits         • Undersized connection pool
```

### Remediation Pathways:
1. **Warehouse Bound (`execute_main_query > 70%` of `async_processing`)**:
   * *Missing Partition Filters*: Add `always_filter` or `conditionally_filter` in the LookML explore.
   * *High-Frequency Fact Scans*: Implement LookML Aggregate Awareness (`aggregate_table:`) or Incremental PDTs.
   * *Symmetric Aggregates (`SUM_DISTINCT`)*: Fix missing `primary_key: yes` and verify join `relationship:` cardinality.
2. **Looker JVM Overhead Bound (`Looker Overhead > 30%` of `async_processing`)**:
   * *Table Calculation Abuse*: Push dynamic calculations down into native LookML dimensions and measures.
   * *Merged Queries*: Refactor in-memory merges into native LookML joins or PDTs.
   * *Row Limits*: Clamp default 5,000-row limits on KPI cards and summary tiles to 1 or 10.
3. **Pool & Queue Contention (`acquire_connection > 0.25s` or `per_user_throttler > 1.0s`)**:
   * *Schedule Hotspots*: Stagger cron schedules away from `:00` to off-peak minutes (`:07`, `:22`, `:37`, `:52`).
   * *Tile Bloat*: Deconstruct dashboards with $>25$ query tiles into tabs or modular child dashboards.
   * *Connection Limits*: Increase `max_connections` per node in Looker Connection Settings.

---

## 2. Google Cloud PSO Query Lifecycle Benchmarks

The Looker query execution lifecycle consists of three distinct phases:
1. **Initialization Phase**: Schema compilation, explore join graph resolution, and SQL generation (`project_init`, `model_init`, `explore_init`, `prepare`).
2. **Execution Phase**: Connection acquisition, worker queuing, and warehouse execution (`per_user_throttler`, `queued`, `acquire_connection`, `execute_main_query`).
3. **Post-Processing Phase**: Network streaming, table calculation execution, and formatting (`stream_to_cache`, `postprocessing`, `load_main_query_in_memory`).

### Master 12-Stage PSO Benchmark Matrix

| Lifecycle Stage | Metric Field | Target Benchmark | Warning Threshold | Critical Threshold | Root Cause / Diagnostic Meaning |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Async Processing** | `async_processing_average` | **`< 5.00s`** | `> 9.999s` | `> 14.999s` | Total end-user perceived query latency. |
| **Looker Overhead** | `(Async - (Main+Conn)) / Async` | **`< 20.0%`** | `> 30.0%` | `> 50.0%` | % of query time spent inside Looker JVM. |
| **Cache Hit Ratio** | `1 - (DB_Runs / Total_Runs)` | **`> 50.0%`** | `< 40.0%` | `< 20.0%` | Efficiency of datagroups and caching layer. |
| **Project Init** | `project_init` | **`< 0.05s`** | `> 0.100s` | `> 0.250s` | Time to initialize LookML project schema. |
| **Model Init (Compute)** | `model_init_computed` | **`< 2.42s`** | `> 2.440s` | `> 5.000s` | Time to compile model from raw LookML on cache miss. |
| **Model Init (Cache)** | `model_init_cache` | **`< 0.50s`** | `> 1.000s` | `> 2.500s` | Time to load pre-compiled model schema from cache. |
| **Explore Init (Compute)**| `explore_init` | **`< 0.233s`** | `> 0.233s` | `> 0.500s` | Time to compile Explore join graph from LookML. |
| **Explore Init (Cache)** | `marshalled_cache_load` | **`< 0.351s`** | `> 0.351s` | `> 0.750s` | Time to load Explore schema from memory disk cache. |
| **SQL Prepare** | `prepare` | **`< 0.20s`** | `> 0.439s` | `> 1.000s` | Looker SQL generation time (Liquid parsing). |
| **Acquire Connection** | `acquire_connection` | **`< 0.238s`** | `> 0.238s` | `> 0.500s` | Connection pool acquisition and handshake. |
| **Worker Queue Time** | `queued` | **`0.00s`** | `> 0.100s` | `> 0.500s` | Wait time for available Looker worker thread. |
| **Per-User Throttle** | `per_user_throttler` | **`0.00s`** | `> 0.000s` | `> 1.000s` | Wait time due to user exceeding 15 concurrent queries. |
| **Main Query Exec** | `execute_main_query` | **`< 4.87s`** | `> 5.000s` | `> 15.000s` | Raw database warehouse SQL execution time. |
| **Totals Query Exec** | `execute_totals_query` | **`< 0.238s`** | `> 0.500s` | `> 1.500s` | Subtotal and grand total database query runtime. |
| **Stream to Cache** | `stream_to_cache` | **`< 0.223s`** | `> 0.223s` | `> 0.500s` | Streaming and formatting records into browser cache. |
| **Post-Processing** | `postprocessing` | **`< 0.223s`** | `> 0.223s` | `> 0.500s` | Applying table calculations and UI formatting. |
| **In-Memory Loading** | `load_main_query_in_memory` | **`< 0.10s`** | `> 0.238s` | `> 0.500s` | Loading entire result set into instance memory. |

---

## 3. Progressive Hierarchical Drilldown Methodology

Follow this top-down hierarchy using System Activity inline queries in [system_activity_queries.md](system_activity_queries.md):

1. **Step 1: Model-Level Compilation Diagnostics**:
   * Measure `model_init_computed_average`. If $> 2.42\text{s}$, the model file is bloated with wildcard includes (`include: "/*.view"`) or too many disparate explores.
   * *Action*: Break monolithic models into domain-specific `.model.lkml` files.
2. **Step 2: Explore-Level Performance**:
   * Measure `average_runtime` per `query.view`. Explores with $> 10\text{s}$ average runtime indicate missing partition filters, unindexed joins, or missing rollups.
3. **Step 3: Dashboard & User Pivoting**:
   * Pivot runtime by `history.result_source` (`query` vs `cache`).
   * If queries are slow only under `query`, the bottleneck is warehouse execution. If slow even under `cache`, the bottleneck is frontend tile bloat or dynamic fields.
4. **Step 4: Query ID / Slug Isolation & SQL Inspection**:
   * Isolate the top slow Query IDs and Slugs (`query.slug` from `system__activity/query_metrics`) and inspect generated SQL (`looker-cli query runquery <query_slug_or_id> --format sql`) and LookML definitions.

---

## 4. The 5-Vector Root Cause Forensic Framework

When diagnosing slow queries, **never assume adding a date filter is the only fix**. Legitimate business queries (e.g. lifetime order counts, customer lifetime value) require historical data. Evaluate queries across all 5 vectors:

```
                          SLOW QUERY OUTLIER DETECTED
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
   [VECTOR 1]     [VECTOR 2]      [VECTOR 3]      [VECTOR 4]     [VECTOR 5]
   LIFECYCLE      SQL & JOIN      AGGREGATE       WAREHOUSE      CONCURRENT
   PHASE SPLIT    INEFFICIENCIES  AWARENESS       CONTENTION     BURSTS / TILES
```

### Vector 1: Multi-Phase Lifecycle Split
Check `system__activity/query_metrics` for the exact `query.id`:
* `execute_main_query`: Warehouse database execution.
* `acquire_connection`: If high ($>0.24\text{s}$), connection pool is starved.
* `queued`: Looker worker queue delay.
* `stream_to_cache` / `load_main_query_in_memory`: Large result set serialization over the network.
* `postprocessing`: In-memory table calculations and formatting.

### Vector 2: SQL & Join Inefficiencies
Inspect physical SQL generated via `looker-cli query runquery <query_slug_or_id> --format sql`:
* **Redundant Joined Tables**: Looker `LEFT JOIN`ing views that have no selected fields in `SELECT`. Ensure explore join declarations use proper `relationship:` parameters and join conditions.
* **Symmetric Aggregations (`SUM_DISTINCT`)**: Looker injects `SUM(DISTINCT CAST(...))` when it detects a fanout risk from a missing `primary_key: yes` or incorrect join cardinality.
* **Non-Key Join Predicates**: Functions or string comparisons in `ON` clauses (`LOWER(TRIM(...))`) preventing partition pruning.

### Vector 3: Valid Unfiltered Metrics vs. Aggregate Table Acceleration
* When a query legitimately analyzes all-time customer cohorts or full-history totals, do NOT force an artificial date filter.
* **Prescribe Aggregate Awareness (`aggregate_table:`)**: Pre-compute daily/monthly rollups into compact aggregate tables. Looker automatically routes the query to the pre-aggregated table, scanning 10,000 rows instead of 50 million raw records.

### Vector 4: Warehouse Concurrency & Slot Contention
* When `execute_main_query > 20s`, verify whether BigQuery was under slot starvation at that timestamp via `INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT`.

### Vector 5: Colocated Query Bursts
* Check `system__activity/history` for other queries running at the exact same second (`history.created_time`). Detect whether a $>25$-tile dashboard fired or a top-of-hour cron burst exhausted connection capacity.

---

## 5. User Persona Profiling & Abandonment Analytics

### Persona Tiers and Target SLAs:
| Persona Tier | Identification Filter | Target Average Runtime | Primary Bottleneck Risk |
| :--- | :--- | :---: | :--- |
| **Viewer Users** | `user_facts.is_viewer: 'Yes'` | **`< 3.0s`** | Dashboard tile bloat; un-cached production views. |
| **Explorer Users** | `user_facts.is_explorer: 'Yes'` | **`< 5.0s`** | Massive row limits, ad-hoc custom fields, unindexed explores. |
| **Developers** | `user_facts.is_developer: 'Yes'` | **`< 10.0s`** | Dev-mode cache misses; uncommitted LookML compilation. |
| **Admins** | `user_facts.is_admin: 'Yes'` | **`-`** | Heavy System Activity audits and background maintenance. |

### Query Complexity Classification:
* **Clean Baseline Queries**: `query.dynamic_fields: EMPTY`, `query.formatted_pivots: EMPTY`, `query.total: 'No'`. Measures warehouse baseline performance.
* **Feature-Laden Queries**: Heavy dynamic fields (`query.dynamic_fields: "-EMPTY"`), row totals, or multi-field pivots executing in client RAM.

### Abandonment (Killed Query Rate):
$$\text{Dashboard Killed Rate \%} = \frac{\text{Count of Queries with Status 'killed'}}{\text{Total Queries for Dashboard}} \times 100$$

> [!WARNING]
> A Killed Query Rate $> 5\%$ indicates severe user frustration and abandonment. Users are actively hitting "Cancel" or closing tabs because content fails to load in reasonable time.
