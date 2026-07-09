# Caching, Datagroups, & Cache-Warming Manual

This reference handbook details the standards for configuring caching strategies, datagroups, and cache-warming pipelines in Looker models. Effective caching reduces database query costs and accelerates dashboard loads by serving pre-computed results directly from Looker's cache.

---

## 1. Centralized Caching Architecture

Every Looker model **MUST** implement a centralized caching strategy defined at the model level using `datagroups`.

> [!WARNING]
> **Prohibition of Ad-Hoc Persist Times**: Using plain `persist_for` (e.g., `persist_for: "2 hours"`) on individual explores is strictly **prohibited** for production environments. It results in uncoordinated cache expirations, high database load, and redundant queries.
> 
> **Standard**: Always use a centralized `datagroup` and assign it using `persist_with: datagroup_name` at the explore or model level.

### Standard Datagroup Template:
```lookml
# In the model file
datagroup: monthly_etl_datagroup {
  # 1. Trigger query checks if the daily ingestion completed
  sql_trigger: SELECT completed_at FROM dataset_name.etl_metadata WHERE table_name = 'daily_metrics' ORDER BY completed_at DESC LIMIT 1 ;;
  
  # 2. Fallback age limits stale data in case of ETL failure
  max_cache_age: "24 hours"
  
  label: "Monthly Ingestion Datagroup"
  description: "Busts the cache when the daily ETL metadata table records a successful run."
}

# Apply globally to all explores in the model
persist_with: monthly_etl_datagroup
```

---

## 2. Dialect-Specific Metadata Triggers (`sql_trigger`)

The `sql_trigger` query runs periodically in the background (typically every 5 minutes) on your database. Because it executes frequently, the query **MUST be extremely lightweight and free**. 

> [!CAUTION]
> **Avoid Heavy Aggregate Scans**: Running `SELECT MAX(created_at) FROM large_events_table` on a table with 100M+ rows that is not partitioned is a critical performance anti-pattern. It triggers a full table scan every 5 minutes, resulting in massive database costs.
> 
> **Standard**: Always query small metadata catalog tables, ETL log tables, or database metadata schemas.

### Optimized Dialect-Specific Triggers:

#### A. Google Cloud BigQuery (Free Catalog Metadata)
Query BigQuery's internal metadata tables, which are updated instantaneously at zero query cost:
```lookml
# Triggers cache bust when the table modified time changes
sql_trigger: SELECT last_modified_time FROM `my-project.my_dataset.__TABLES__` WHERE table_id = 'my_table' ;;
```

#### B. Google Cloud Spanner (Lightweight Commit Logs)
Query a dedicated, single-row ETL status table instead of running scans on heavy tables:
```lookml
# Triggers cache bust when the ingestion pipeline updates the timestamp
sql_trigger: SELECT last_ingested_timestamp FROM etl_metadata.spanner_runs WHERE table_id = 'metrics_table' ;;
```

#### C. Snowflake (Free Metadata Schema)
Query Snowflake's metadata schema, which reads from the metadata storage without spinning up a virtual warehouse:
```lookml
# Triggers cache bust when the table modified time updates
sql_trigger: SELECT LAST_ALTERED FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'MY_SCHEMA' AND TABLE_NAME = 'MY_TABLE' ;;
```

---

## 3. The Three-Tier Caching Architecture

Align your explores and dashboards to one of these three caching tiers based on the data refresh frequency:

### Tier 1: Batch-ETL Ingested (Daily/Hourly Ingestion)
*   **Use Case**: Dashboard data only updates at fixed intervals (e.g., daily at 2:00 AM or hourly).
*   **Strategy**: Use an ETL-Triggered datagroup (Section 2). All users are served 100% from Looker's cache throughout the day. The cache is only invalidated when new data actually arrives.

### Tier 2: Micro-Batch / Streaming (Continuous Ingestion)
*   **Use Case**: Data is continuously streaming into the database, but users do not need real-time freshness.
*   **Strategy**: Use a short-duration, fixed-interval cache (e.g., 15 minutes) to protect the database from concurrent spikes.
    ```lookml
    datagroup: streaming_fifteen_minute_cache {
      sql_trigger: SELECT CURRENT_DATE() ;; # Rebuild cache metadata daily
      max_cache_age: "15 minutes"          # Keep queries in cache for max 15 mins
    }
    ```

### Tier 3: Static / Historical Data (Long-Term Caching)
*   **Use Case**: Explores that query static, historical partitions (e.g., closed years, archived transaction logs).
*   **Strategy**: Long-term caching (e.g., 1 week or 1 month) to prevent the database from ever re-processing unchanged historical data.
    ```lookml
    datagroup: static_historical_cache {
      sql_trigger: SELECT EXTRACT(MONTH FROM CURRENT_DATE()) ;; # Rebuild monthly
      max_cache_age: "168 hours"                                # 1 week cache retention
    }
    ```

---

## 4. Advanced: Developer Cache-Busting Parameters

To allow developers or power users to bypass the cache and query the database in real-time (e.g., during data audits or debugging) **without** invalidating the cache for other business users, implement a **Cache-Busting Looker Parameter**.

### LookML Implementation:
1.  **Define a Bypass Parameter** in the refined view:
    ```lookml
    parameter: cache_bypass {
      type: unquoted
      allowed_value: { label: "Use Cache (Recommended)" value: "use_cache" }
      allowed_value: { label: "Force Refresh (Live Query)" value: "bypass" }
      default_value: "use_cache"
    }
    ```
2.  **Inject the Parameter into the Explore/Join SQL**:
    Incorporate a dynamic Liquid comment inside the `sql_on:` or `sql_table_name:` parameter. Looker will generate a unique SQL query string when "bypass" is selected, forcing the database to run a live query instead of pulling from the Looker cache:
    ```lookml
    explore: orders {
      # Injects a unique SQL comment when the parameter is set to 'bypass'
      sql_always_where: 
        1=1 
        {% if orders.cache_bypass._parameter_value == 'bypass' %}
          AND '{{ character_generator }}' = '{{ character_generator }}' -- Cache Bypass Active
        {% endif %} ;;
    }
    ```

---

## 5. Automated Cache-Warming Pipeline

To prevent the first morning user from experiencing a slow dashboard load while the database compiles the queries for the first time after an ETL cache bust, you **MUST** implement **Cache Warming**.

### The API-Driven Cache-Warming Protocol:
1.  **Trigger Webhook**: Configure your orchestrator (Airflow, dbt Cloud, or a cron job) to trigger a webhook immediately after the ETL pipeline completes.
2.  **Looker API Script**: The webhook runs a script that calls the Looker API to pre-compute the dashboard queries.
3.  **Bash Implementation (Looker CLI)**:
    Run this script in your orchestration environment to warm a specific dashboard's cache:
    ```bash
    #!/bin/bash
    # 1. Fetch all tile query IDs from the dashboard
    DASHBOARD_ID="124"
    QUERY_IDS=$(looker-cli api dashboard dashboard_elements $DASHBOARD_ID --fields query_id | grep -o '"query_id": [0-9]*' | awk '{print $2}')
    
    # 2. Run each query in the background to warm the database and Looker cache
    for QID in $QUERY_IDS; do
      echo "Warming query ID: $QID"
      looker-cli api query run_query --query_id $QID --result_format json > /dev/null &
    done
    wait
    echo "Cache warming complete for Dashboard $DASHBOARD_ID!"
    ```
