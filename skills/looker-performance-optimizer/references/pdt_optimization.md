# PDT, Materialization, & "Cold Start" Optimization Manual

This reference handbook details the standards for implementing, optimizing, and managing Persistent Derived Tables (PDTs) and Incremental PDTs in Looker. PDTs move heavy processing out of query execution time by materializing complex database transformations directly in the warehouse.

---

## 1. The Master PDT Decision Matrix

Do **NOT** write PDTs for simple, raw tables. Every PDT introduces database storage costs, maintenance overhead, and build-time resource consumption. Use this 4-quadrant decision matrix to determine when to materialize:

| Metric / Quadrant | Materialize as PDT | Keep as Live Query |
| :--- | :--- | :--- |
| **1. Query Complexity** | Query performs CPU-heavy operations (e.g., complex regex, window functions, multi-stage joins) taking **>10 seconds** to run. | Query performs simple filters, aggregates, and clean, indexed joins executing in **<3 seconds**. |
| **2. Query Frequency** | Explore/dashboard is critical, highly concurrent, and opened hundreds of times daily by business users. | Explore is used sporadically for ad-hoc deep dives and research by data analysts. |
| **3. Data Freshness** | Business accepts a cache freshness latency of hourly, daily, or batch-aligned refresh. | Business demands absolute, second-level live real-time data freshness. |
| **4. Table Size** | The underlying raw source tables are massive (>50M rows) and unpartitioned. | The underlying tables are small (<10M rows) and perfectly indexed. |

---

## 2. Dialect-Specific Optimization Standards

Materialized tables **MUST** be physically optimized to ensure fast scanning during user queries. Apply dialect-specific parameters:

### A. Google Cloud BigQuery (Partition & Cluster)
*   **Standard**: Always partition by a date or timestamp column, and cluster by high-frequency filter fields (e.g., IDs, categories).
    ```lookml
    # BigQuery PDT Configuration (inside derived_table)
    partition_keys: ["order_date"]     # BigQuery: only one date/time column
    cluster_keys: ["user_id", "status"] # Max 4 columns; column order affects which filters benefit
    ```

### B. Google Cloud Spanner (Secondary Indexes & Interleaving)
*   **Standard**: Cloud Spanner requires explicit primary keys. When materializing tables in Spanner, ensure you declare secondary indexes or interleave structures for optimal join performance.
    ```lookml
    # Spanner PDT Configuration
    # (Indexes are defined in the DDL/SQL statement of the derived table)
    derived_table: {
      sql:
        CREATE TABLE pdt_user_orders_summary (
          user_id INT64 NOT NULL,
          order_date DATE NOT NULL,
          total_orders INT64,
          total_spent NUMERIC
        ) PRIMARY KEY (user_id, order_date);
        
        # Create secondary index for fast date filtering
        CREATE INDEX idx_pdt_user_orders_date ON pdt_user_orders_summary (order_date);
      ;;
    }
    ```

### C. Snowflake (Clustering Keys)
*   **Standard**: Snowflake automatically manages partitioning, but for tables >1TB, you **MUST** define explicit clustering keys.
    ```lookml
    # Snowflake PDT Configuration
    cluster_keys: ["order_date", "user_id"]
    ```

---

## 3. The "Cold Start" PDT Load Protocol (Initial Build of Incremental PDTs)

Incremental PDTs are highly efficient because later builds only append new increments. However, the first time a query runs on an incremental PDT, Looker builds the **entire** PDT to get the initial data. On massive tables, this initial build may take a significant amount of time, as would building any large table.

Do **not** try to cap the initial build with a temporary filter that is removed later. Changing the derived table's `sql` is a change to the table's definition: after deploy, the previous production table is marked as expired and dropped, and the new definition is built from scratch, so a manually backfilled table is not carried over.

```
[Phase 1: Define the Incremental PDT] ➔ [Phase 2: Pre-build in Development Mode] ➔ [Deploy within 24h, unchanged] ➔ [Phase 3 if the full build exceeds database limits]
```

### Phase 1: Define the Incremental PDT Correctly
For SQL-based PDTs, connect the increment key to the database time column with the `{% incrementcondition %}` Liquid filter. The `increment_key` must name a time-based dimension defined in the PDT's view file, and `{% incrementcondition %}` must reference a TIMESTAMP column (or an expression that evaluates to one) from the `FROM` clause, not a SQL alias or a dimension name:

```lookml
view: pdt_historical_transactions {
  derived_table: {
    datagroup_trigger: daily_etl_datagroup
    increment_key: "transaction_date"
    increment_offset: 3
    sql:
      SELECT
        transaction_id,
        DATE(raw_transactions.transaction_ts) AS transaction_date,
        user_id,
        amount
      FROM raw_transactions
      WHERE {% incrementcondition %} raw_transactions.transaction_ts {% endincrementcondition %}
    ;;
  }

  dimension_group: transaction {
    type: time
    timeframes: [date, week, month, year]
    datatype: date
    sql: ${TABLE}.transaction_date ;;
  }

  # Define the remaining dimensions (transaction_id, user_id, amount) as usual.
}
```

### Phase 2: Pre-build the Initial Table in Development Mode
If a development version of the PDT is persisted when you deploy, Looker can often use it as the production table, so users do not wait for the initial build:
1.  **Build in Development Mode**: Query the PDT in Development Mode (or use **Rebuild Derived Tables & Run** from an Explore) to trigger the full initial build.
2.  **Deploy promptly and unchanged**: Development tables are treated as `persist_for: "24 hours"`. Deploy within 24 hours of querying the development table, without further changes to the PDT definition.
3.  **Avoid abbreviated development tables**: A PDT that uses `dev_filters` or an `if prod` / `if dev` conditional `WHERE` clause cannot reuse its development table in production, since that table holds an abbreviated dataset.

### Phase 3: Architectural Offloading (ELT Outsourcing)
If a historical dataset is too massive to be built within Looker's PDT layer (exceeding database resources), the agent **MUST** offload the materialization:
*   **The Standard**: Outsource the materialization to the database warehouse layer (using **dbt**, scheduled database queries, or database materialized views).
*   **Looker Mapping**: Define Looker as a standard, read-only view mapping directly to the database-materialized table. This keeps Looker lightweight and protects the BI server.

---

## 4. Incremental PDT Standards
*   **`increment_key` (Mandatory)**: Must name a time-based LookML dimension at a truncated absolute timeframe (for example, a `date` or `month` timeframe; timeframes such as day of week are not supported).
*   **`increment_offset` (Mandatory)**: Always set a sensible look-back offset (e.g., `3` days) to capture late-arriving data and prevent data discrepancies.
*   **Incremental Filter**: For SQL-based PDTs, always add `WHERE {% incrementcondition %} table.timestamp_column {% endincrementcondition %}` so Looker can generate the increment's filter. LookML-based (native) PDTs do not need it.
