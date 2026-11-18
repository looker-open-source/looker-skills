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
    # BigQuery PDT Configuration
    partition_by: "order_date"
    cluster_by: ["user_id", "status"] # Max 4 fields, order from highest to lowest cardinality
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

## 3. The "Cold Start" PDT Load Protocol (Preventing Initial Build Crashes)

Incremental PDTs are highly efficient because daily builds only process the last 24 hours of data. However, the **first run (initial load)** must compile and write the entire historical dataset. On massive tables, this cold start query will take hours or days, exceeding database timeout limits and crashing.

To prevent initial load crashes, the agent and developers **MUST** execute the **PDT Initial Load Mitigation Protocol**:

```
[Initial Build] ➔ [Phase 1: Apply Date Cap (30 Days)] ➔ [Build Succeeds in Seconds] ➔ [Phase 2: Remove Cap / Deploy Incrementals] ➔ [Daily Batches Backfill History Safely]
```

### Phase 1: Historical Capping (LookML Phase-In)
Configure your LookML PDT query to dynamically cap the historical scan on the first run. Leverage the `{% if incremented %}` Liquid variable to detect if Looker is running a full rebuild or a daily increment:

```lookml
view: pdt_historical_transactions {
  derived_table: {
    sql:
      SELECT
        transaction_id,
        transaction_date,
        user_id,
        amount
      FROM raw_transactions
      WHERE
        {% if incremented %}
          # Daily incremental runs: Look back 3 days to capture late data
          transaction_date >= DATE_SUB({% increment_value %}, INTERVAL 3 DAY)
        {% else %}
          # COLD START HACK: Cap the initial load to 30 days to prevent timeout
          transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        {% endif %}
    ;;
    
    datagroup_trigger: daily_etl_datagroup
    increment_key: "transaction_date"
    increment_offset: 3
  }
}
```

### Phase 2: Historical Backfilling (Bootstrap & Expand)
1.  **Deploy capped PDT**: Run the initial build. Since it is capped to 30 days, the query will execute in seconds, successfully materializing the physical table in your database.
2.  **Historical Backfill**: Once the table exists, write a temporary SQL script or use database features to backfill historical data backwards (in monthly or weekly batches) directly in the database warehouse.
3.  **Deploy Incremental Code**: Remove the temporary cap from the LookML code. Since the historical data now exists physically in the database, daily incremental runs will execute smoothly on top of it.

### Phase 3: Architectural Offloading (ELT Outsourcing)
If a historical dataset is too massive to be compiled or backfilled even in batches within Looker's PDT layer (exceeding database resources), the agent **MUST** offload the materialization:
*   **The Standard**: Outsource the materialization to the database warehouse layer (using **dbt**, scheduled database queries, or database materialized views).
*   **Looker Mapping**: Define Looker as a standard, read-only view mapping directly to the database-materialized table. This keeps Looker lightweight and protects the BI server.

---

## 4. Incremental PDT Standards
*   **`increment_key` (Mandatory)**: Must always be a time-based column (date, hour, month).
*   **`increment_offset` (Mandatory)**: Always set a sensible look-back offset (e.g., `3` days) to capture late-arriving data and prevent data discrepancies.
*   **Incremental Filter**: Always wrap your derived table SQL query in `{% if incremented %} ... {% else %} ... {% endif %}` to ensure Looker compiles a lightweight `WHERE` clause during incremental runs.
