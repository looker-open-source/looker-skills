# Query Performance Audit & Forensic Triage Playbook

This reference document defines the diagnostic and remediation protocol for auditing query performance, query lifecycle latencies, connection contention, and Looker JVM internal overhead.

## 1. Progressive System Activity History Diagnostics (Hierarchical Drilldown)

To isolate slow queries using the **System Activity History & Query Metrics Explores**, follow a top-down hierarchy:
1. **Model Level Diagnostics**: Compile latency (`model_init_computed_average`) & model scope bloat.
2. **Explore Level Diagnostics**: Heavy Explores & unpartitioned fact table scans.
3. **Dashboard & User Diagnostics**: Cache vs. Query result pivots, tile bloat (`> 25` tiles), and user concurrency.
4. **Specific Query Signature & SQL**: Query ID (`query.id`), dynamic fields, table calculations, and SQL Runner inspection.

### Critical System Activity Dimension Rules (Mandatory)
1. **Model Dimension**: Always use `query.model` (never `history.model_name` or `query_metrics.model`).
2. **Explore Dimension**: Always use `query.view` (in System Activity, `query.view` represents the Explore name).
3. **Execution Date**: Always use `history.created_date` (`query.created_date` is when the query was first defined).
4. **Status Filter**: Always filter `history.status = 'complete'` when measuring average runtimes so aborted or failed 0-second queries do not skew metrics.

---

### Step 1: Per-Model Performance & Compilation Diagnostics
Evaluate performance at the macro model level to isolate models with excessive query runtimes or heavy compile latencies before queries reach the database.
* **Key Measures**: `history.query_run_count`, `history.average_runtime`, `query_metrics.acquire_connection_average`, `query_metrics.model_init_computed_average`.
* **Analysis**: If `model_init_computed_average > 2.42s`, the model is bloated with too many included files. Scope models into domain-specific `.model.lkml` files.
* **Inline Query (`looker-cli api query run_inline_query json -`)**:
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.model",
    "history.query_run_count",
    "history.average_runtime",
    "query_metrics.acquire_connection_average",
    "query_metrics.model_init_computed_average"
  ],
  "filters": { "history.created_date": "30 days", "query.model": "-NULL" },
  "sorts": ["history.average_runtime desc"],
  "limit": "50"
}
```

### Step 2: Per-Explore Diagnostics
Drill down into the target model to isolate which specific Explore configurations generate heavy, long-running queries.
* **Analysis**: Explores with `average_runtime > 10.0s` indicate missing partition filters on fact tables, complex unindexed joins, or missing Aggregate Awareness rollups.
* **Inline Query**:
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": ["query.view", "query.model", "history.query_run_count", "history.average_runtime"],
  "filters": {
    "query.model": "thelook",
    "history.created_date": "30 days",
    "history.status": "complete",
    "query.view": "-NULL"
  },
  "sorts": ["history.average_runtime desc"],
  "limit": "50"
}
```

### Step 3: Per-Dashboard & User Diagnostics
Determine which dashboards and users are executing queries against the slow Explores, and pivot by `history.result_source` (`query` vs. `cache`):
* **Slow under `result_source: query`**: Database execution bottleneck $\rightarrow$ apply warehouse partition filters or caching datagroups.
* **Slow even under `result_source: cache`**: Dashboard has **tile bloat (>25 tiles)** or excessive dynamic fields forcing browser layout thread contention.
* **Inline Query**:
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "user.name",
    "history.result_source",
    "history.query_run_count",
    "history.average_runtime"
  ],
  "pivots": ["history.result_source"],
  "filters": { "history.source": "dashboard", "history.created_date": "30 days" },
  "sorts": ["history.average_runtime desc 0"],
  "limit": "50"
}
```

### Step 4: Drilling into the Specific Slow Query & 5-Vector Root Cause Analysis
Isolate the exact query signatures (`query.id`) and autonomously inspect their generated SQL (`looker-cli api query query <id> --fields sql`) and LookML definitions:
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "query.id",
    "query.view",
    "query.model",
    "query.dynamic_fields",
    "history.slug",
    "history.query_run_count",
    "history.average_runtime"
  ],
  "filters": {
    "query.model": "thelook",
    "query.view": "YOUR_SLOW_EXPLORE_NAME",
    "history.created_date": "30 days",
    "history.status": "complete"
  },
  "sorts": ["history.average_runtime desc"],
  "limit": "10"
}
```

When you identify the top slow Query IDs, evaluate all **5 Root Cause Vectors**:
1. **Vector 1 (Phase Breakdown)**: Query `system__activity/query_metrics` for that `query.id` to verify if latency was physical database execution (`execute_main_query`), connection pool wait (`acquire_connection`), or network streaming (`stream_to_cache`).
2. **Vector 2 (SQL & Join Inefficiencies)**: Inspect the generated SQL for redundant `LEFT JOIN`s or `SUM(DISTINCT ...)` symmetric aggregation overhead caused by missing `primary_key: yes` or bad `relationship:` parameters.
3. **Vector 3 (Aggregate Acceleration)**: If the query is an intentional full-table scan for lifetime/cohort metrics, prescribe **LookML Aggregate Awareness (`aggregate_table:`)** or an **Incremental PDT**.
4. **Vector 4 (Warehouse Slot Contention)**: Query `INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT` via `bq query` to check if BigQuery slots were saturated at that execution timestamp.
5. **Vector 5 (Colocated Query Bursts)**: Query `system__activity/history` for all queries executed at the same timestamp (`history.created_time`) to see if a >25-tile dashboard or cron burst saturated the instance.

---

## 2. The 3-Way Forensic Triage Framework

When slow queries or long dashboard loading times are detected (`async_processing > 8.0s`), classify the bottleneck into one of three categories:

1. **Database Warehouse Bound (`execute_main_query > 70%` of `async_processing`)**:
   * *Lifetime Metrics*: Implement Aggregate Awareness (`aggregate_table`).
   * *Accidental Scans*: Add `always_filter` or `conditionally_filter` in the LookML explore.
   * *Join Inefficiencies*: Remove unused joins and fix `primary_key` fanouts.
2. **Looker JVM Overhead Bound (`Looker Overhead > 30%` of `async_processing`)**:
   * Remove in-memory Merged Queries.
   * Push heavy Table Calculations (`query.count_of_dynamic_fields > 2`) down into LookML measures.
   * Lower 5,000-row limits on KPI and summary tiles.
3. **Pool & Queue Contention (`acquire_connection > 0.25s` or `per_user_throttler > 1.0s`)**:
   * Stagger cron schedules away from top-of-hour (`:00`).
   * Deconstruct >25-tile dashboards into focused, linked dashboards.
   * Increase `max_connections` per node in Looker Connection Settings.

---

## 3. Instance-Wide Performance KPI Scorecard Query

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query_metrics.async_processing_average",
    "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average",
    "query_metrics.project_init_average",
    "query_metrics.model_init_computed_average",
    "query_metrics.model_init_cache_average",
    "query_metrics.explore_init_average",
    "query_metrics.marshalled_cache_load_average",
    "query_metrics.prepare_average",
    "query_metrics.queued_average",
    "query_metrics.per_user_throttler_average",
    "query_metrics.stream_to_cache_average",
    "query_metrics.postprocessing_average",
    "history.query_run_count",
    "history.database_result_query_count"
  ],
  "filters": { "history.created_date": "30 days" },
  "limit": "1"
}
```
