# 🏆 Master Healthcheck 30-Check Scoring Standard

This master rubric establishes the unified scoring architecture, point deduction thresholds, and calculation formulas across all **3 Healthcheck Pillars** (30 automated checks).

---

## 🧮 1. Mathematical Scoring Formulation

### A. Micro-Check Point Assignment
Every individual check receives one of three standardized outcomes:
* ✅ **`PASSED`**: **100 points** (Meets or exceeds Google Cloud PSO enterprise standards).
* ⚠️ **`WARNING`**: **50 points** (Sub-optimal implementation; performance degradation risk).
* ❌ **`CRITICAL / FAIL`**: **0 points** (Active bottleneck; severe compute cost, query timeout, or data fanout).

### B. Pillar Score Calculation (0–100):
$$\text{Pillar Score} = \frac{\sum_{i=1}^{10} \text{Check Score}_i}{10}$$

### C. Overall Instance Health Score (0–100):
$$\text{Overall Health Score} = \frac{\text{Pillar 1 Score} + \text{Pillar 2 Score} + \text{Pillar 3 Score}}{3}$$

### D. Executive Health Grade Thresholds:
| Overall Score | Grade | Executive Meaning | Recommended Action |
| :---: | :---: | :--- | :--- |
| **`90 – 100`** | **A (Exemplary)** | Production-hardened enterprise architecture. | Regular monthly drift monitoring. |
| **`75 – 89`** | **B+ (Good)** | Minor optimization potential; low risk. | Implement minor field cleanups. |
| **`60 – 74`** | **B- (Fair)** | **Optimization Recommended**; moderate compute cost. | Deploy partitioning & primary key fixes. |
| **`< 60`** | **F (Critical)** | **Critical Action Required**; slot starvation risk. | Execute TDD remediation immediately. |

---

## 🏛️ 2. Pillar 1: Looker Performance & Content Governance (`P1-01` to `P1-10`)

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P1-01`** | **Query Latency Phase Breakdown** | Database runtime $< 2.0\text{s}$; JVM overhead $< 20\%$ | Latency $2.0 - 5.0\text{s}$; overhead $20 - 40\%$ | Average latency $> 10.0\text{s}$; overhead $> 50\%$ |
| **`P1-02`** | **Connection Pool Wait Time** | Queue wait $< 100\text{ms}$ (`acquire_connection < 0.238s`) | Queue wait $500\text{ms} - 2.0\text{s}$ | Connection pool queue starvation ($> 5.0\text{s}$) |
| **`P1-03`** | **Dashboard Query Density** | All dashboards $\le 25\text{ query tiles}$ | Dashboards with $26 - 35\text{ tiles}$ | Extreme tile bloat ($> 35\text{ tiles}$) causing JVM stalls |
| **`P1-04`** | **Auto-Refresh Rate Limits** | Auto-refresh off or $\ge 30\text{ minutes}$ | Auto-refresh between $15 - 30\text{ minutes}$ | Aggressive auto-refresh ($< 15\text{ minutes}$) |
| **`P1-05`** | **Schedule Time Staggering** | Cron schedules distributed off-peak (e.g. `:07`, `:22`) | Minor clustering around `:15` or `:30` | Top-of-Hour pileup (`:00` cron stampede) |
| **`P1-06`** | **Concurrency Peaks & Throttling** | Smooth concurrency profile; zero thread throttling | Peak concurrent queries $20 - 30$ | Server-wide query thread exhaustion (`per_user_throttler > 1s`) |
| **`P1-07`** | **Stale / Unused Dashboard Inventory** | Zero unviewed content in $> 90\text{ days}$ | 1–5 stale dashboards | Massive unused content bloat (>10 unviewed dashboards) |
| **`P1-08`** | **Unfiltered Dashboard Queries** | Enforce required filters on fact explores (`always_filter`) | Optional filters on large fact explores | Unbounded historical queries executing without filters |
| **`P1-09`** | **In-Memory Merged Queries** | Zero in-memory merge queries in production | Small merges ($< 1,000\text{ rows}$) | Massive in-memory joins ($> 10,000\text{ rows}$) in JVM |
| **`P1-10`** | **Datagroup ETL Synchronization** | Explores inherit ETL watermark SQL triggers | Static `persist_for` intervals | Volatile cache (`GENERATE_UUID()`) or default 24h |

---

## 🧬 3. Pillar 2: LookML Modeling Quality & Architecture (`P2-11` to `P2-20`)

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P2-11`** | **LookML Syntax & Compiler Health** | 0 compiler warnings or validation errors | Deprecation notices only | LookML validation errors breaking explores |
| **`P2-12`** | **Primary Key Integrity** | `primary_key: yes` declared on 100% of joined views | Declared on fact views, missing on 1 dimension view | Missing primary keys on fact/joined views (forcing `SUM_DISTINCT`) |
| **`P2-13`** | **Explicit Join Cardinality** | `relationship: many_to_one` declared explicitly | Missing relationship on 1–2 minor views | Missing `relationship:` on one-to-many joins (fanout risk) |
| **`P2-14`** | **Dead Field Detection (`looker-cli health vacuum`)** | Clean field catalog (0 unreferenced fields) | $< 10\%$ unreferenced fields | $> 30\%$ dead fields cluttering context window and UI |
| **`P2-15`** | **Masked Technical Foreign Keys** | Raw IDs, surrogate keys, and hashes set to `hidden: yes` | Unhidden IDs in developer explores | Raw foreign keys (`user_id`, `session_id`) exposed to end users |
| **`P2-16`** | **Modular File & Folder Hygiene** | Dedicated `/explores`, `/views`, `/models` directories | Minor view file clutter in root | Monolithic 5,000-line model files mixing views and explores |
| **`P2-17`** | **Standard snake_case Naming** | 100% identifiers adhere to clean `snake_case` | 1–2 camelCase or capitalized dimensions | Inconsistent naming conventions across core metrics |
| **`P2-18`** | **User-Facing Field Descriptions** | 100% of business measures & dimensions have descriptions | $50 - 80\%$ description coverage | Missing descriptions on core business KPIs |
| **`P2-19`** | **Explore Field Picker Capping** | Explores expose $\le 50\text{ fields}$ via `fields: []` | Explores expose $50 - 100\text{ fields}$ | Massive 200+ field explores overwhelming users and AI agents |
| **`P2-20`** | **Table Calculation Pushdown** | Calculations pushed down to native SQL/LookML | Minor simple UI table calculations | Heavy table calculations executing in browser memory |

---

## ⚡ 4. Pillar 3: BigQuery Engine & Compute Optimization (`P3-21` to `P3-30`)

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P3-21`** | **Table Partitioning & Clustering** | 100% of large fact tables partitioned by date & clustered | Partitioned without cluster keys | **Unpartitioned fact tables** (>10M rows) |
| **`P3-22`** | **BI Engine In-Memory Acceleration** | BI Engine memory allocated targeting hot fact tables | Memory allocated but $< 50\%$ hit rate | No BI Engine reservation configured |
| **`P3-23`** | **PDT Build Health & Cascades** | Zero PDT build failures in past 7 days | 1–2 intermittent PDT timeouts | Cascading PDT build failures blocking dashboards |
| **`P3-24`** | **Warehouse Slot Contention** | Slot usage $< 500\text{ slots}$; 0 queue wait | Peak slot usage $500 - 1,500\text{ slots}$ | Slot starvation ($> 2,000\text{ slots}$); queries throttled |
| **`P3-25`** | **Query Memory & Shuffle Spills** | 0 memory spills (Executed fully in memory) | Minor memory disk spill | Severe stage shuffle spill to disk |
| **`P3-26`** | **Query Cost & Bytes Billed** | Scans pruned by partition filter ($< 100\text{ MB}$) | Queries scanning $100\text{ MB} - 1.0\text{ GB}$ | Unbounded full scans ($> 3.0\text{ GB / run}$) |
| **`P3-27`** | **Aggregate Awareness Acceleration** | High-traffic explores route to `aggregate_table` | Partial rollup matching | All queries scan raw un-aggregated fact tables |
| **`P3-28`** | **BigQuery Text Search Indexes** | Text search uses `SEARCH()` with search indexes | Standard `LIKE` / `REGEXP_CONTAINS` | Regex joins forcing Cartesian cross scans |
| **`P3-29`** | **Long Running Query Thread Health** | All interactive queries complete in $< 10\text{s}$ | Queries run between $10 - 30\text{s}$ | Zombie queries stalling threads for $> 60\text{s}$ |
| **`P3-30`** | **Unpartitioned Full Table Scans** | Semantic layer enforces partition filters | Manual filters only | Explores allow unbounded historical full scans |
