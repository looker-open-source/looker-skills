---
name: looker-performance-optimizer
description: Master developer skill for auditing, diagnosing, and optimizing query performance in Looker projects. Enforces caching alignment, PDT materialization strategies, and parallel subagent SQL profiling.
---

# Looker Performance Optimizer

This master developer skill governs the lifecycle of auditing, diagnosing, and optimizing query performance in new or existing Looker projects. It enforces a strict performance-first design, database caching alignment, strategic data materialization, and advanced SQL profiling using parallel subagents and Looker MCP tools.

All optimizations developed under this skill must be dialect-agnostic, database-efficient, and preserve the integrity of existing business logic.

---

## 1. Operating Modes (Preventative vs. Reactive)

This skill operates in two distinct modes to address performance at different stages of the development lifecycle:

### Mode A: Performance-by-Design (Preventative Engineering)
Use this mode when adding *new* explores, views, or Persistent Derived Tables (PDTs) to an existing project. The agent **MUST** ensure that performance is engineered from the first second:
1.  **Correct Join Cardinalities**: Declare precise join relationships (`many_to_one`, `one_to_one`) immediately to prevent compiler-driven Symmetric Aggregations.
2.  **PDT Indexing & Partitioning**: Every new PDT definition **MUST** declare partition keys and clustering/index keys based on the fields most commonly used as dashboard filters.
3.  **ETL-Aligned Caching**: Every new explore **MUST** be assigned to a centralized `datagroup` triggered by an ETL/ELT metadata query, avoiding arbitrary `persist_for` time windows.

### Mode B: Active Performance Tuning (Reactive Brownfield)
Use this mode when diagnosing and optimizing an active, slow dashboard or explore in production. The agent **MUST** execute this 5-phase performance pipeline:
1.  **Aesthetic Audit & Baseline**: Swich to Developer Mode and run a baseline test of the slow dashboard tiles via Looker MCP or CLI. Record query run times, query IDs, and database costs (bytes scanned/slots used).
2.  **Parallel Query Profiling (Subagent-Assisted)**: Spawn specialized subagents to analyze the generated SQL and run `EXPLAIN` plans concurrently, isolating the database bottlenecks (see Section 6 for delegation rules).
3.  **Surgical Performance Refactoring**: Apply targeted, localized edits to the LookML layer:
    *   Align caching datagroups.
    *   Materialize heavy transformations into PDTs (following the PDT Decision Matrix).
    *   Correct join relationships and implement join pruning.
4.  **Verification & Delta Measurement**: Re-run the compiler (`health_analyze`) to ensure zero syntax errors, re-execute the queries, and document the performance improvement matrix.
5.  **Safe Production Deploy**: Deploy the optimized, validated LookML branch to production.

---

## 2. Caching & ETL Alignment Rules

Tuning caching is the fastest way to reduce database warehouse costs and accelerate dashboard loads.

*   **Prohibition of Arbitrary Persist Times**: Using plain `persist_for: "24 hours"` or similar static durations on explores is strictly **prohibited** for production environments. It results in stale data and redundant, expensive database queries.
*   **Mandatory Datagroups**: All explores **MUST** inherit their caching policy from a centralized `datagroup` defined in the model file.
*   **ETL-Triggered Caching**: Datagroups **MUST** be triggered by a `sql_trigger_value` query that monitors the actual data refresh rate of the warehouse (e.g., querying ETL metadata tables or checking `MAX(created_at)`).
*   **Cache-Busting Safeguards**: Define a sensible `max_cache_age` (e.g., 24 hours) as a fallback so that if the ETL pipeline fails to update, the cache eventually expires, ensuring users do not view extremely stale data.

---

## 3. Persistent Derived Table (PDT) Materialization Rules

When on-the-fly SQL compilation of complex joins and row-level transformations takes too long, the data must be materialized into a Persistent Derived Table (PDT).

### A. The Master PDT Decision Matrix
Before turning a view or explore into a PDT, the agent **MUST** evaluate the query using this 4-quadrant decision matrix:

| Metric / Quadrant | Materialize as PDT | Keep as Live Query |
| :--- | :--- | :--- |
| **1. Complexity** | Query performs heavy transformations (e.g., complex regex, string parsing, window functions) or multiple join layers, taking **>10 seconds** to execute. | Query performs simple filters and clean, indexed joins, executing in **<3 seconds**. |
| **2. Frequency** | The explore/dashboard is critical, highly concurrent, and opened hundreds of times daily by business users. | The explore is used esporadically for ad-hoc deep dives by advanced data analysts. |
| **3. Data Freshness** | The business requires hourly, daily, or near-real-time updates, which fits standard rebuild schedules. | The business requires absolute, second-level real-time data freshness. |
| **4. Table Size** | The underlying raw tables are massive (>50M rows) and lack partition indexes. | The underlying tables are small (<10M rows) and perfectly indexed. |

### B. The "Cold Start" PDT Load Protocol
To prevent massive, historical PDTs (especially Incremental PDTs) from crashing during their initial load due to database timeouts, resource exhaustion, or slot limits, the agent **MUST** execute this mitigation protocol:

1.  **Historical Capping (Phase-in)**: In the initial LookML PDT definition, temporarily cap the historical query using a conditional date filter (e.g., querying only the last 30 days of data). This ensures the physical table is created successfully on the database in seconds.
2.  **Incremental Backfill (Bootstrap & Expand)**: Once the initial table is created, programmatically expand the historical filter backwards in manageable batches (e.g., month-by-month backfills) to build the full history without triggering a single, massive transaction crash.
3.  **Dry-Run Cost Estimation**: Prior to building a heavy PDT, call Looker MCP's `query` or `query_sql` tools to run a dry-run estimation of the bytes scanned to verify if it will exceed database connection query limits.
4.  **Architectural Offloading (ELT Outsourcing)**: If a historical dataset is too massive to be compiled or backfilled within Looker's PDT layer, the agent **MUST** instruct the developer to offload the materialization to the database warehouse layer (using dbt, scheduled queries, or database materialized views), mapping Looker as a standard read-only view.

---

## 4. LookML Semantic Refactoring Rules

Optimizing the semantic modeling layer eliminates compiler-driven redundancies and ensures the database only processes the minimum required data.

*   **Eliminate Symmetric Aggregations**: Ensure that join relationships (`relationship`) are accurately declared. If a join is defined as `many_to_one` but behaves as `one_to_many`, Looker's compiler will inject expensive `_distinct` aggregate functions (e.g., `SUM_DISTINCT`, `AVG_DISTINCT`) into the SQL, causing massive performance degradation.
*   **Join Pruning**: Structure explores so that Looker only joins the tables that are actually queried by the user's selected fields. Leverage the `required_joins` parameter to control join paths tightly.
*   **Outlaw Heavy Liquid Loops in SQL**: Writing complex Liquid conditional loops inside `sql:` parameters that compile into massive SQL `CASE WHEN` chains is strictly **prohibited**. These chains cannot be indexed by database engines and result in full table scans. Replace them with clean LookML dimensions or pre-computed PDT columns.

---

## 5. Looker CLI & MCP Diagnostics Matrix

To diagnose query performance and run execution plans, the AI agent **MUST** leverage either the Looker CLI or the Looker MCP server. Looker MCP is preferred for programmatic database introspection.

| Performance Action | Looker CLI Command | Looker MCP Tool |
| :--- | :--- | :--- |
| **Fetch Generated SQL** | `looker-cli api query query <id> --fields sql` | `query(query_id)` or `query_sql` |
| **Run Query (Test)** | `looker-cli api query run_query --query_id <id>` | `query` or `run_dashboard` |
| **Check Query State** | `looker-cli api query query_task ...` | `health_pulse` or `health_analyze` |
| **Database Introspection** | *N/A* | `get_connection_table_columns` |
| **LookML Compile Check** | `looker-cli project validate <id>` | `health_analyze` |

---

## 6. AI Agent Execution & Subagent Delegation Guidelines

To optimize execution speed, prevent token bloat, and avoid hitting turn or context limits in your agentic environment, follow these execution strategies:

### 1. Parallel Query Profiling & Context Isolation (Mandatory)
Diagnosing multiple slow dashboard queries generates massive SQL statements, database execution plans, and JSON payloads. To keep the main developer conversation pristine and cost-effective, the main agent **MUST** delegate diagnostics:
1.  **Identify Slow Tiles**: Catalog all slow visualization tiles on the target dashboard.
2.  **Spawn SQL Profiler Subagents**: For each slow explore or tile identified, spawn a specialized "SQL Profiler Subagent" to run concurrently.
3.  **Subagent Diagnostics Task**:
    *   Retrieve the generated SQL via Looker MCP.
    *   Execute an `EXPLAIN` or `EXPLAIN ANALYZE` query directly against the target connection.
    *   Parse the execution plan to identify the exact bottleneck (e.g., full table scan, missing index, Symmetric Aggregations).
    *   Compile a **Pruned Performance Report** consisting of exactly:
        *   The offending SQL fragment.
        *   The identified bottleneck.
        *   The exact, actionable LookML remediation (e.g., add caching datagroup, correct join relationship, or create an incremental PDT).
    *   Report the pruned findings back to the main agent and self-terminate.
4.  **Pruned Integration**: The main agent receives only the condensed, highly actionable reports from the subagents and coordinates the refactoring, keeping the main conversation completely free of raw database plan dumps.

### 2. The Rule of Surgical Modification (No Full Rewrites)
To protect developer comments, preserve custom dimensions, and optimize API token efficiency, the agent **MUST** adhere to the following surgical editing protocol:
*   **Prohibition of Full Rewrites**: During any performance refactoring or tuning iteration on an *existing* LookML file, the agent **MUST NOT** rewrite, regenerate, or reconstruct the entire file from scratch.
*   **Targeted Block Replacements**: The agent **MUST** perform surgical, localized block replacements (such as search-and-replace, line-targeted edits, or targeted tool calls) to modify *only* the specific joins, datagroups, or SQL parameters that require optimization.
*   **Preservation**: Unrelated dimensions, measures, explore joins, and developer-written comments **MUST** remain completely untouched.
