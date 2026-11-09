# Looker System Activity Query Catalog & Telemetry Bank

This master reference catalog documents the exact JSON query definitions, dimensions, filters, and table calculation formulas for querying Looker's internal `system__activity` models via `looker-cli api query run_inline_query json -`.

> [!TIP]
> **Piping JSON to Looker CLI**: Always pass inline JSON via pipe: `echo '{"model":"system__activity", ...}' | looker-cli api query run_inline_query json - | jq`.
> **Avoid Limit Truncation**: When running inline queries with a `limit`, run a companion query selecting only the `.count` measure (or pipe un-limited IDs to `jq 'length'`) so total counts are never truncated.

---

## 1. System Activity Calculation Formulas

* **`looker_overhead_pct`**:
  `(((${average_of_execute_main_query} + ${average_of_acquire_connection}) / ${average_of_async_processing}) - 1) * (-1)`
* **`overhead_time_seconds`**:
  `${average_of_async_processing} - (${average_of_execute_main_query} + ${average_of_acquire_connection})`
* **`cache_hit_ratio`**:
  `1 - (${history.database_result_query_count} / ${history.query_run_count})`
* **`dashboard_error_rate`**:
  `(${history.error_query_count} / ${history.total_query_count}) * 100`
* **`dashboard_killed_rate` (User Abandonment)**:
  `(${history.killed_query_count} / ${history.total_query_count}) * 100`

---

## 2. 12-Stage Master Query Lifecycle Scorecard

Evaluates the instance against Google Cloud PSO query lifecycle benchmarks:

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
    "query_metrics.postprocessing_average"
  ],
  "filters": {
    "history.created_date": "30 days"
  },
  "limit": "1"
}
```

---

## 3. 3-Way Latency Phase Breakdown by Model

Deconstructs query execution into JVM compile overhead, database runtime, and connection acquisition queue time:

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.model",
    "query.view",
    "history.query_run_count",
    "query_metrics.async_processing_average",
    "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average",
    "query_metrics.stream_to_cache_average"
  ],
  "filters": {
    "history.created_date": "30 days",
    "query.model": "-NULL"
  },
  "sorts": ["query_metrics.async_processing_average desc"],
  "limit": "50"
}
```

---

## 4. Per-Model Compilation & Schema Diagnostics

Identifies models with excessive LookML compile times (`model_init_computed_average > 2.42s` indicates model scope bloat):

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
  "filters": {
    "history.created_date": "30 days",
    "query.model": "-NULL"
  },
  "sorts": ["query_metrics.model_init_computed_average desc"],
  "limit": "50"
}
```

---

## 5. Per-Explore Performance Diagnostics

Isolates which specific Explore configurations generate long-running queries:

```json
{
  "model": "system__activity",
  "view": "history",
  "fields": ["query.view", "query.model", "history.query_run_count", "history.average_runtime"],
  "filters": {
    "history.created_date": "30 days",
    "history.status": "complete",
    "query.view": "-NULL"
  },
  "sorts": ["history.average_runtime desc"],
  "limit": "50"
}
```

---

## 6. Per-Dashboard Performance (Cache vs. Database Pivot)

Pivots runtime by result source to distinguish between slow database execution and browser/tile bloat:

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
  "filters": {
    "history.source": "dashboard",
    "history.created_date": "30 days"
  },
  "sorts": ["history.average_runtime desc 0"],
  "limit": "50"
}
```

---

## 7. Top Slowest Queries by Database Execution Time (Warehouse-Bound)

Isolates queries where `execute_main_query` dominates total duration:

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.id",
    "user.name",
    "query.model",
    "query.view",
    "dashboard.title",
    "query_metrics.async_processing",
    "query_metrics.execute_main_query",
    "query_metrics.acquire_connection",
    "history.created_time"
  ],
  "filters": {
    "history.created_date": "7 days",
    "history.status": "complete"
  },
  "sorts": ["query_metrics.execute_main_query desc"],
  "limit": "20"
}
```

---

## 8. Top Slowest Queries by JVM Overhead & Postprocessing (Looker-Bound)

Identifies queries bogged down by client-side table calculations, in-memory pivots, or formatting:

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.id",
    "user.name",
    "query.model",
    "query.view",
    "dashboard.title",
    "query_metrics.async_processing",
    "query_metrics.execute_main_query",
    "query_metrics.stream_to_cache",
    "query_metrics.postprocessing",
    "history.created_time"
  ],
  "filters": {
    "history.created_date": "7 days",
    "history.status": "complete"
  },
  "sorts": ["query_metrics.async_processing desc"],
  "limit": "20"
}
```

---

## 9. Specific Single Query Phase Decomposition (Deep Outlier Inspection)

Inspects the 12-stage lifecycle of an individual slow Query ID:

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.id",
    "query_metrics.async_processing",
    "query_metrics.execute_main_query",
    "query_metrics.acquire_connection",
    "query_metrics.queued",
    "query_metrics.per_user_throttler",
    "query_metrics.stream_to_cache",
    "query_metrics.postprocessing",
    "query_metrics.model_init_computed",
    "query_metrics.explore_init"
  ],
  "filters": {
    "query.id": "<TARGET_QUERY_ID>"
  },
  "limit": "1"
}
```

---

## 10. Dashboard Error & Killed Query Rate (Abandonment Telemetry)

Pinpoints dashboards where users frequently abandon queries (`history.status = 'killed'`):

```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "history.database_result_query_count",
    "history.query_run_count"
  ],
  "filters": {
    "history.status": "error,killed",
    "dashboard.title": "-NULL",
    "history.created_date": "30 days"
  },
  "sorts": ["history.query_run_count desc"],
  "limit": "25"
}
```

---

## 11. Dashboard & Look Operational Complexity

### A. Tile Bloat (Dashboards with > 25 Query Tiles)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id"],"filters":{"dashboard_element.count":">25"}}' | looker-cli api query run_inline_query json - | jq 'length'
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","dashboard_element.count"],"filters":{"dashboard_element.count":">25"},"sorts":["dashboard_element.count desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### B. Aggressive Auto-Refresh Dashboards
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.count"],"filters":{"dashboard.refresh_interval_ordered":"NOT NULL","dashboard.moved_to_trash":"No"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.title","dashboard.refresh_interval_ordered","user.name","dashboard.id","dashboard_element.count","dashboard_element.count_text","dashboard_element.total_query_tiles"],"filters":{"dashboard.refresh_interval_ordered":"NOT NULL","dashboard.moved_to_trash":"No"},"sorts":["dashboard.refresh_interval_ordered"],"limit":"100"}' | looker-cli api query run_inline_query json - | jq
  ```

### C. Excessive Dynamic Fields (> 2 per tile)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id"],"filters":{"query.count_of_dynamic_fields":">2"}}' | looker-cli api query run_inline_query json - | jq 'length'
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","query.count_of_dynamic_fields"],"filters":{"query.count_of_dynamic_fields":">2"},"sorts":["query.count_of_dynamic_fields desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### D. Merged Queries (In-Memory JVM Joins)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.count"],"filters":{"result_maker.is_merge_query":"Yes","dashboard.moved_to_trash":"No"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","dashboard_element.id","result_maker.merge_query_id"],"filters":{"result_maker.is_merge_query":"Yes","dashboard.moved_to_trash":"No"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### E. Dashboard Average Runtime Drilldown
```bash
echo '{"model":"system__activity","view":"dashboard_performance","fields":["dashboard.title","dashboard_history_stats.avg_runtime"],"sorts":["dashboard_history_stats.avg_runtime desc"],"limit":"15"}' | looker-cli api query run_inline_query json - | jq
```

---

## 12. Pipeline, Cache & PDT Health

### A. Failed Datagroups
* **API Check**:
  ```bash
  looker-cli api datagroup all_datagroups | jq '.[] | select(.trigger_error != null) | {name: .name, model: .model_name, error: .trigger_error}'
  ```
* **System Activity Query**:
  ```bash
  echo '{"model":"system__activity","view":"datagroup","fields":["datagroup.name","datagroup.model_name","datagroup.trigger_error"],"filters":{"datagroup.trigger_error":"-NULL"}}' | looker-cli api query run_inline_query json - | jq
  ```

### B. Failed PDT Builds (Past 24 Hours)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"pdt_event_log","fields":["pdt_event_log.count"],"filters":{"pdt_event_log.action":"%error%","pdt_event_log.created_date":"24 hours"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"pdt_event_log","fields":["pdt_event_log.view_name","pdt_event_log.model_name","pdt_event_log.action","pdt_event_log.error_reason","pdt_event_log.created_time"],"filters":{"pdt_event_log.action":"%error%","pdt_event_log.created_date":"24 hours"},"sorts":["pdt_event_log.created_time desc"]}' | looker-cli api query run_inline_query json - | jq
  ```

### C. Cache Efficiency (Cache Hits vs. Database Runs)
```bash
echo '{"model":"system__activity","view":"history","fields":["history.result_source","history.query_run_count"],"pivots":["history.result_source"],"filters":{"history.result_source":"-NULL","history.created_date":"30 days"},"sorts":["history.result_source"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
```

---

## 13. Inactive Content & User Hygiene

### A. Inactive Accounts (No UI Login in > 90 Days)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"user","fields":["user.count"],"filters":{"user_facts.last_ui_login_date":"before 90 days ago","user.is_disabled":"No"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"user","fields":["user.created_date","user.id","user.name","user_facts.last_ui_login_credential_type","user_facts.last_ui_login_date","history.most_recent_query_date"],"filters":{"user_facts.last_ui_login_date":"before 90 days ago","user.is_disabled":"No"},"sorts":["user.created_date desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### B. Inactive Content (Dashboards & Looks Not Queried in > 60 Days)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"content_usage","fields":["content_usage.content_count"],"filters":{"content_usage.days_since_last_accessed":">=60","content_usage.dashboard_deleted":"No","content_usage.look_deleted":"No"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"content_usage","fields":["content_usage.content_id","content_usage.content_title","content_usage.content_type","content_usage.api_total","content_usage.embed_total","content_usage.favorites_total","content_usage.schedule_total"],"filters":{"content_usage.days_since_last_accessed":">=60","content_usage.dashboard_deleted":"No","content_usage.look_deleted":"No"},"limit":"100"}' | looker-cli api query run_inline_query json - | jq
  ```

### C. Draft / Test / Copy Dashboards & Looks
* **Dashboards**:
  ```bash
  echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title"],"filters":{"dashboard.title":"%test%,%copy%,%draft%","dashboard.moved_to_trash":"No"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```
* **Looks**:
  ```bash
  echo '{"model":"system__activity","view":"look","fields":["look.id","look.title"],"filters":{"look.title":"%test%,%copy%,%draft%","look.deleted_date":"NULL"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

---

## 14. Schedule Health & Hotspots

### A. Hourly Schedule Hotspots (Peak Burst Hours)
```bash
echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_job.created_hour_of_day","scheduled_job.count"],"sorts":["scheduled_job.count desc"],"limit":"24"}' | looker-cli api query run_inline_query json - | jq
```

### B. Failing Schedules
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_job.count"],"filters":{"scheduled_job.status":"failure"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.id","scheduled_plan.name","scheduled_job.status","scheduled_job.status_detail"],"filters":{"scheduled_job.status":"failure"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### C. Orphaned Schedules (Owner Account is Disabled)
* **Total Count**:
  ```bash
  echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.count"],"filters":{"user.is_disabled":"Yes"}}' | looker-cli api query run_inline_query json - | jq
  ```
* **Details**:
  ```bash
  echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.id","scheduled_plan.name","user.name"],"filters":{"user.is_disabled":"Yes"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

---

## 15. Remote LookML Single-Pass Inspection Loop

Run Looker's compiler validator and inspect remote LookML files via API without local filesystem scans:

```bash
proj="<PROJECT_ID>"
echo "=== Auditing Remote LookML for Project: $proj ==="

# 1. Run built-in Looker validator
looker-cli api project validate_project "$proj" | jq

# 2. Single-pass inspection over LKML files
for file in $(looker-cli api project all_project_files "$proj" | jq -r '.[] | select(.extension==".lkml") | .path'); do
  content=$(looker-cli project file cat "$proj" "$file")
  
  # Wildcard Includes
  echo "$content" | grep -n -iE 'include:\s*"*\*\.view' && echo "  └─ ⚠️ Wildcard include in $file"
  
  # Missing Primary Keys
  if [[ "$file" == *.view.lkml ]]; then
    echo "$content" | grep -q "primary_key:\s*yes" || echo "  └─ ⚠️ Missing primary key in $file"
  fi
  
  # Number Type for ID Dimensions
  echo "$content" | grep -n -iE "dimension:\s*[a-zA-Z0-9_]*id" -A 5 | grep -i "type:\s*number" && echo "  └─ ⚠️ Number ID dimension in $file"
  
  # Hardcoded Database References
  echo "$content" | grep -n 'sql:' | grep -v '\${' | grep '\.' && echo "  └─ ⚠️ Hardcoded DB ref in $file"
done
```
