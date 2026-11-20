# BigQuery Engine & Compute Optimization Playbook (Pillar 3)

This master playbook defines the diagnostic protocols, `INFORMATION_SCHEMA` telemetry queries, scoring thresholds, and prescriptive remediation patterns for evaluating and optimizing Google Cloud BigQuery compute, slot allocation, partition pruning, BI Engine acceleration, and query costs.

---

## 🏛️ The 10 BigQuery Compute Checks (P3-21 to P3-30)

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P3-21`** | **Table Partitioning & Clustering** | 100% of large fact tables partitioned by date & clustered | Partitioned without cluster keys | **Unpartitioned fact tables** (>10M rows) |
| **`P3-22`** | **BI Engine In-Memory Acceleration** | BI Engine reservation allocated targeting hot tables | Memory allocated but <50% hit rate | No BI Engine reservation configured |
| **`P3-23`** | **PDT Build Health & Cascades** | Zero PDT build failures in past 7 days | 1–2 intermittent PDT timeouts | Frequent cascading PDT build failures |
| **`P3-24`** | **Warehouse Slot Contention** | Slot usage < 500 slots; no queue wait | Peak slot usage 500 - 1,500 slots | Slot starvation (>2,000 slots); queries throttled |
| **`P3-25`** | **Query Memory & Shuffle Spills** | 0 memory spills (Executed fully in memory) | Minor memory disk spill | Severe stage shuffle spill to disk |
| **`P3-26`** | **Query Cost & Bytes Billed** | Scans pruned by partition filter (<100 MB) | Queries scanning 100 MB - 1.0 GB | Unbounded full scans (> 3.0 GB / run) |
| **`P3-27`** | **Aggregate Awareness Acceleration** | High-traffic explores route to `aggregate_table` | Partial rollup matching | All queries scan raw un-aggregated fact tables |
| **`P3-28`** | **BigQuery Text Search Indexes** | Text search uses `SEARCH()` with search indexes | Standard `LIKE` / `REGEXP_CONTAINS` | Regex joins forcing Cartesian cross scans |
| **`P3-29`** | **Long Running Query Thread Health** | All interactive queries complete in < 10s | Queries run between 10 - 30s | Zombie queries stalling threads for > 60s |
| **`P3-30`** | **Unpartitioned Full Table Scans** | Semantic layer enforces partition filters | Manual filters only | Explores allow unbounded historical full scans |

---

## 🛠️ Step-by-Step Diagnostic SQL Inquest

Execute these queries via `bq query --use_legacy_sql=false --format=prettyjson "<SQL>"` or the BigQuery Studio console:

### Step 1: Physical Partitioning & Clustering (`INFORMATION_SCHEMA.PARTITIONS` & `TABLES`)
Inspect table partitioning expressions, clustering columns, and logical storage across target datasets (`INFORMATION_SCHEMA.TABLE_STORAGE` is region-scoped and does not expose `partition_id` or `clustering_fields`; join dataset-scoped `PARTITIONS` and `TABLES` instead):
```sql
SELECT
  p.table_name,
  SUM(p.total_rows) AS total_rows,
  ROUND(SUM(p.total_logical_bytes) / POW(1024, 3), 2) AS size_gb,
  COUNT(DISTINCT IF(p.partition_id != '__NULL__', p.partition_id, NULL)) AS partition_count,
  REGEXP_EXTRACT(t.ddl, r'PARTITION BY ([^\n;]+)') AS partition_expr,
  REGEXP_EXTRACT(t.ddl, r'CLUSTER BY ([^\n;]+)') AS clustering_fields
FROM `<project_id>.<dataset_id>`.INFORMATION_SCHEMA.PARTITIONS AS p
LEFT JOIN `<project_id>.<dataset_id>`.INFORMATION_SCHEMA.TABLES AS t
  USING (table_catalog, table_schema, table_name)
GROUP BY p.table_name, t.ddl
HAVING SUM(p.total_rows) > 1000000
ORDER BY total_rows DESC
LIMIT 100;
```

---

### Step 2: Slot Utilization Timeline (`INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT`)
Check whether queries are being throttled by warehouse slot starvation over the last 24 hours (always include `job_creation_time` alongside `period_start` to enable partition pruning on `JOBS_TIMELINE_BY_PROJECT`):
```sql
SELECT
  TIMESTAMP_TRUNC(period_start, HOUR) as hour_window,
  ROUND(AVG(period_slot_ms) / 1000, 2) as avg_slots,
  ROUND(MAX(period_slot_ms) / 1000, 2) as peak_slots
FROM `region-us`.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT
WHERE job_creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND period_start >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1
ORDER BY hour_window DESC
LIMIT 24;
```

#### Diagnostic Thresholds:
* **Slot Starvation**: `peak_slots` consistently reaching or exceeding the project reservation limit (e.g. 2,000 slots) during morning dashboard peaks (8:00 AM – 10:00 AM).
* **Remediation**: Stagger scheduled deliveries away from top-of-hour bursts, implement `aggregate_table` rollups, or allocate dedicated reservations for Looker workloads.

---

### Step 3: Top Expensive Looker Queries & Costs by Job Labels (`INFORMATION_SCHEMA.JOBS_BY_PROJECT`)
Looker attaches structured metadata labels to every query dispatched to BigQuery (`looker-context-user_id`, `looker-context-history_slug`, `looker-context-instance_slug`). Filter directly using these labels:

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
  ROUND(total_bytes_billed / POW(1024, 3), 2) AS gb_billed,
  ROUND((total_bytes_billed / POW(10, 12)) * 6.25, 4) AS cost_usd,
  ROUND(total_slot_ms / 1000, 2) AS slot_seconds,
  bi_engine_statistics.bi_engine_mode AS bi_engine_mode,
  query
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = 'QUERY'
  AND EXISTS (
    SELECT 1 FROM UNNEST(labels) WHERE key LIKE 'looker-context%'
  )
ORDER BY total_bytes_billed DESC
LIMIT 10;
```

---

### Step 4: BigQuery Memory & Stage Shuffle Spills
Identify queries where intermediate data exceeded available RAM and spilled to disk:
```sql
SELECT
  job_id,
  creation_time,
  ROUND(total_slot_ms / 1000, 2) AS slot_seconds,
  (SELECT SUM(s.shuffle_output_bytes_spilled_to_disk) FROM UNNEST(query_info.query_stages) s) AS total_spilled_bytes
FROM `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND job_type = 'QUERY'
  AND EXISTS (
    SELECT 1 FROM UNNEST(query_info.query_stages) s WHERE s.shuffle_output_bytes_spilled_to_disk > 0
  )
ORDER BY total_spilled_bytes DESC
LIMIT 10;
```

---

## 📝 Prescriptive Remediation Patterns

### 1. Partitioning & Clustering DDL Generator Pattern
Recreate unpartitioned tables with date partitioning and high-cardinality clustering:
```sql
CREATE OR REPLACE TABLE `<project_id>.<dataset_id>.<fact_table>_partitioned`
PARTITION BY DATE(created_at)
CLUSTER BY user_id, status
OPTIONS(
  description = "Partitioned and clustered fact table for Looker acceleration",
  require_partition_filter = FALSE
) AS
SELECT * FROM `<project_id>.<dataset_id>.<fact_table>`;
```

---

### 2. BigQuery BI Engine & In-Memory Acceleration

**BigQuery BI Engine** accelerates SQL queries to sub-500ms response times without consuming project slots.

#### SQL Compatibility Matrix for Full BI Engine Acceleration:
| Feature / Syntax | Accelerated by BI Engine (`FULL`) | Triggers Fallback (`DISABLED` / `PARTIAL`) |
| :--- | :--- | :--- |
| **Join Type** | Standard Equi-Joins (`A.id = B.id`) | Non-equi joins (`A.val > B.val`), Cross joins (`type: cross`) |
| **Join Conditions** | Clean dimension references (`${orders.user_id}`) | Functions in join keys (`LOWER(TRIM(...))`, `REGEXP_CONTAINS`) |
| **Aggregations** | `SUM`, `COUNT`, `AVG`, `MIN`, `MAX` | Complex user-defined JavaScript UDFs in aggregations |
| **Table Types** | Partitioned & clustered physical tables | Multi-layer un-materialized SQL subqueries |

#### Recommended Sizing Formula:
$$\text{Recommended BI Engine Reservation (GB)} = \sum \text{Hot Table Partitions (Past 30 Days)} \times 1.25$$

Verify acceleration status in `INFORMATION_SCHEMA.JOBS_BY_PROJECT` by checking `bi_engine_statistics.bi_engine_mode = 'FULL'`.

---

### 3. BigQuery Search Indexes (`SEARCH()`) for Text-Heavy LookML Views

When users perform freeform text search (e.g. error logs, URLs, notes), `LIKE '%keyword%'` forces full table scans. Deploy a BigQuery Search Index to achieve sub-second lookups:

```sql
-- Create Search Index in BigQuery
CREATE SEARCH INDEX IF NOT EXISTS events_search_idx
ON `<project_id>.<dataset_id>.events`(traffic_source, uri, user_agent);
```

#### Push Down to LookML View:
```lookml
view: events {
  sql_table_name: `<project_id>.<dataset_id>.events` ;;

  dimension: uri {
    type: string
    sql: ${TABLE}.uri ;;
  }

  filter: uri_search {
    type: string
    description: "Sub-second token search powered by BigQuery Search Index"
    sql: SEARCH(${TABLE}.uri, {% parameter uri_search %}) ;;
  }
}
```

---

### 4. LookML Aggregate Awareness Pattern for BigQuery

```lookml
explore: order_items {
  persist_with: etl_datagroup

  aggregate_table: rollup__daily_sales_by_status {
    query: {
      dimensions: [created_date, status, users.country]
      measures: [total_sale_price, order_count]
      timezone: "UTC"
    }
    materialization: {
      datagroup_trigger: etl_datagroup
      partition_keys: ["created_date"]
      cluster_keys: ["status"]
    }
  }
}
```
