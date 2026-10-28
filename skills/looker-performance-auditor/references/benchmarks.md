---
type: Reference
title: Google Cloud PSO Benchmark Standards & Query Lifecycle
description: Official Google Cloud PSO performance benchmarks, query lifecycle definitions, SLA warning thresholds, and latency targets.
tags: [looker, pso, benchmarks, latency, sla, query-lifecycle]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: pso-standards
    resource: "https://cloud.google.com/looker/docs"
    title: Google Cloud PSO Looker Performance Standards
    author: "team:google-pso"
---

# Google Cloud PSO Benchmark Standards & Query Lifecycle Playbook

This reference document defines the official **Google Cloud PSO Performance Benchmarks**, **Query Lifecycle Definitions**, **Warning Thresholds**, and **Remediation Protocols** for evaluating Looker query performance.

---

## 🔍 Part 1: How to Review & Diagnose Query Lifecycles

### 1. The 3 Phases of the Looker Query Lifecycle

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 1. INITIALIZATION PHASE: LookML Compilation & Schema Resolution                             │
 │    • project_init ──> model_init_cache / computed ──> explore_init ──> prepare (SQL gen)   │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 2. EXECUTION PHASE: Concurrency, Connection Acquisition & Warehouse Run                     │
 │    • per_user_throttler ──> queued ──> acquire_connection ──> execute_main_query           │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3. POST-PROCESSING PHASE: Stream, Format, In-Memory Calculations & Totals                   │
 │    • execute_totals_query ──> stream_to_cache ──> load_process_and_stream / in_memory      │
 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Core Mathematical Diagnostic Formulas

#### A. Looker Internal Overhead Percentage:
$$ \text{Looker Overhead \%} = \frac{\text{async\_processing} - (\text{execute\_main\_query} + \text{acquire\_connection})}{\text{async\_processing}} \times 100 $$
* **Optimal**: $< 20.0\%$ (Looker spends minimal time parsing/formatting in JVM memory).
* **Warning**: $> 30.0\%$ (Indicates heavy table calculations, in-memory merges, or massive un-paged result sets).
* **Critical**: $> 50.0\%$ (Severe Looker JVM memory pressure; browser rendering bottlenecks).

#### B. Instance Cache Hit Ratio:
$$ \text{Cache Hit Ratio \%} = \left( 1 - \frac{\text{Count of Database Queries (source != 'cache')}}{\text{Total Query Runs}} \right) \times 100 $$
* **Optimal**: $> 50.0\%$ (Explores inherit centralized datagroups aligned to warehouse ETL).
* **Warning**: $< 40.0\%$ (Redundant queries hitting the database warehouse).
* **Critical**: $< 20.0\%$ (Cache disabled or misaligned `persist_for` windows).

---

### 3. Master Google Cloud PSO Benchmark Matrix

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

### 4. Telemetry Extraction Query
Execute this query in `system__activity` to evaluate all 12 stages against PSO benchmarks:
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "history.created_date",
    "query_metrics.async_processing_average",
    "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average",
    "query_metrics.model_init_computed_average",
    "query_metrics.model_init_cache_average",
    "query_metrics.explore_init_average",
    "query_metrics.marshalled_cache_load_average",
    "query_metrics.prepare_average",
    "query_metrics.queued_average",
    "query_metrics.per_user_throttler_average",
    "query_metrics.stream_to_cache_average",
    "query_metrics.postprocessing_average"
  ],
  "filters": {
    "history.created_date": "30 days"
  },
  "limit": "30"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate Benchmark Breaches

When diagnostic metrics exceed warning or critical thresholds, execute the targeted remediation protocol:

### Remediation Protocol 1: Connection Pool Starvation (`acquire_connection > 0.238s`)
* **Root Cause**: Looker sends more concurrent queries than the connection pool allows, stalling worker threads.
* **Fix**:
  1. Open **Admin** $\rightarrow$ **Connections** $\rightarrow$ Edit Connection.
  2. Increase `Max Connections per Node` from default (30) to `40–60` (verify warehouse connection limits).
  3. Stagger scheduled dashboard deliveries away from top-of-the-hour (`:00`) spikes.

### Remediation Protocol 2: Model Compilation Latency (`model_init_computed > 2.42s`)
* **Root Cause**: Monolithic `.model.lkml` files containing dozens of unused or complex explores.
* **Fix**:
  1. Split monolithic model files into domain-scoped models (e.g. `ecommerce_orders.model.lkml`, `marketing_attribution.model.lkml`).
  2. Move explore declarations into dedicated `/explores` files and `include:` only what is needed.

### Remediation Protocol 3: High Looker Overhead (`Overhead > 20%`)
* **Root Cause**: In-memory merged queries, complex frontend table calculations, or 5,000-row limits on KPI cards.
* **Fix**:
  1. Refactor merged queries into native LookML `join:` explores (see [merged_queries_remediation.md](merged_queries_remediation.md)).
  2. Push table calculations into native warehouse SQL dimensions/measures or derived tables.
  3. Set `limit: 1` on single-value KPI cards.

### Remediation Protocol 4: SQL Generation Delays (`prepare > 0.20s`)
* **Root Cause**: Deeply nested Liquid loops (`{% for ... %}`), dynamic derived tables, or circular view extensions.
* **Fix**:
  1. Replace complex Liquid with static LookML parameters and `sql_always_where:`.
  2. Materialize dynamic derived tables into Persistent Derived Tables (PDTs) with datagroup triggers.
