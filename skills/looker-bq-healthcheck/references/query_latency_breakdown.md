# Computation

```json
{
  "model": "system__activity",
  "view": "query_metrics",
  "fields": [
    "query.model",
    "query.view",
    "query_metrics.async_processing_average",
    "query_metrics.execute_main_query_average",
    "query_metrics.acquire_connection_average",
    "query_metrics.stream_to_cache_average"
  ],
  "filters": {
    "query.model": "@model_name",
    "history.created_date": "30 days"
  },
  "sorts": ["query_metrics.async_processing_average desc"],
  "limit": "50"
}
```

Deconstructs query execution into JVM compile overhead, database runtime, and connection acquisition queue time per Google PSO standards.[^system-activity-query-metrics]

[^system-activity-query-metrics]: Looker System Activity Query Metrics Explore
