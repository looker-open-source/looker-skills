# Looker System Activity Query Catalog & Telemetry Bank

This reference catalog documents the exact JSON query definitions, dimensions, and table calculation formulas for querying Looker's internal `system__activity` models via `looker-cli api query run_inline_query json -`.

> [!TIP]
> **Avoid Limit Truncation**: When running inline queries with a `limit`, always run a companion query selecting only the `.count` measure (or pipe un-limited IDs to `jq 'length'`) so total violation counts are never truncated.

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

---

## 2. Performance & Latency Decomposition Queries

### A. Per-Dashboard Performance Diagnostics (Cache vs. Database Pivot)
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": ["dashboard.id", "dashboard.title", "history.result_source", "history.query_run_count", "history.average_runtime"],
  "pivots": ["history.result_source"],
  "filters": { "history.source": "dashboard", "history.created_date": "30 days" },
  "sorts": ["history.average_runtime desc 0"],
  "limit": "50"
}
```

### B. Per-Explore Performance Diagnostics
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": ["query.view", "query.model", "history.query_run_count", "history.average_runtime"],
  "filters": { "history.created_date": "30 days", "history.status": "complete", "query.view": "-NULL" },
  "sorts": ["history.average_runtime desc"],
  "limit": "50"
}
```

### C. Per-Model Compilation Diagnostics
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": ["query.model", "history.average_runtime", "query_metrics.acquire_connection_average", "query_metrics.model_init_computed_average"],
  "filters": { "history.created_date": "30 days", "query.model": "-NULL" },
  "sorts": ["query_metrics.model_init_computed_average desc"],
  "limit": "50"
}
```

### D. Top Slowest Queries by Database Execution Time (Warehouse-Bound / Pillar 3)
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.id", "user.name", "query.model", "query.view", "dashboard.title",
    "query_metrics.async_processing", "query_metrics.execute_main_query",
    "query_metrics.acquire_connection", "history.created_time"
  ],
  "filters": { "history.created_date": "7 days", "history.status": "complete" },
  "sorts": ["query_metrics.execute_main_query desc"],
  "limit": "20"
}
```

### E. Top Slowest Queries by Looker JVM Overhead & Postprocessing (Pillar 1 & 2)
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.id", "user.name", "query.model", "query.view", "dashboard.title",
    "query_metrics.async_processing", "query_metrics.execute_main_query",
    "query_metrics.stream_to_cache", "query_metrics.postprocessing", "history.created_time"
  ],
  "filters": { "history.created_date": "7 days", "history.status": "complete" },
  "sorts": ["query_metrics.async_processing desc"],
  "limit": "20"
}
```

### F. Master 12-Stage Query Lifecycle Scorecard
```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query_metrics.async_processing_average", "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average", "query_metrics.project_init_average",
    "query_metrics.model_init_computed_average", "query_metrics.model_init_cache_average",
    "query_metrics.explore_init_average", "query_metrics.marshalled_cache_load_average",
    "query_metrics.prepare_average", "query_metrics.queued_average",
    "query_metrics.per_user_throttler_average", "query_metrics.stream_to_cache_average",
    "query_metrics.postprocessing_average"
  ],
  "limit": "1"
}
```

---

## 3. Content Governance, Schedules & PDT Health Queries

### A. Dashboards Exceeding 25 Query Tiles (Tile Bloat)
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": ["dashboard.id", "dashboard.title", "dashboard_element.count", "dashboard_element.count_text", "dashboard_element.count_look", "dashboard_element.count_merge_query"],
  "filters": { "dashboard_element.count": ">25", "dashboard.moved_to_trash": "No" },
  "sorts": ["dashboard_element.count desc"],
  "limit": "50"
}
```

### B. Dashboards with Aggressive Auto-Refresh
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": ["dashboard.id", "dashboard.title", "dashboard.refresh_interval_ordered", "user.name", "dashboard_element.count"],
  "filters": { "dashboard.refresh_interval_ordered": "NOT NULL", "dashboard.moved_to_trash": "No" },
  "sorts": ["dashboard.refresh_interval_ordered"],
  "limit": "50"
}
```

### C. Dashboards with Excessive Dynamic Fields (>2 per Tile)
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": ["dashboard.id", "dashboard.title", "query.count_of_dynamic_fields", "history.query_run_count"],
  "filters": { "query.count_of_dynamic_fields": ">2", "dashboard.moved_to_trash": "No" },
  "sorts": ["query.count_of_dynamic_fields desc"],
  "limit": "50"
}
```

### D. Active Scheduled Deliveries Owned by Inactive Users (Zombie Schedules)
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": ["user.id", "user.name", "user_facts.last_ui_login_date", "scheduled_plan.count", "scheduled_plan.name"],
  "filters": { "user_facts.last_ui_login_date": "before 90 days ago", "user.is_disabled": "No", "scheduled_plan.count": ">0" },
  "limit": "50"
}
```

### E. Unused Dashboards (0 Views in Past 90 Days)
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": ["dashboard.id", "dashboard.title", "dashboard.created_time", "user.name", "history.most_recent_run_at_date", "history.query_run_count"],
  "filters": { "dashboard.moved_to_trash": "No", "history.most_recent_run_at_date": "before 90 days ago" },
  "sorts": ["history.query_run_count desc"],
  "limit": "50"
}
```

### F. Persistent Derived Table (PDT) Build Failures
```json
{
  "model": "system__activity",
  "view": "pdt_event_log",
  "fields": ["pdt_event_log.view_name", "pdt_event_log.action", "pdt_event_log.message", "pdt_event_log.created_time"],
  "filters": { "pdt_event_log.action": "%error%", "pdt_event_log.created_time": "7 days" },
  "sorts": ["pdt_event_log.created_time desc"],
  "limit": "25"
}
```

### G. Direct Role Assignments (GBAC Violation Audit)
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": ["user.id", "user.name", "user.email", "role.name"],
  "filters": { "role.embed": "No", "user.is_disabled": "No" },
  "limit": "50"
}
```
