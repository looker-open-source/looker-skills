---
type: Attested Computation
title: Query Latency Phase Decomposition
description: Sanctioned Looker System Activity query to decompose total query duration into Looker JVM overhead, database execution, and connection queue wait times.
status: stable
runtime: Looker
parameters:
  - name: model_name
    type: string
    required: true
  - name: timeframe
    type: string
    required: false
executor: { resource: agent/tools/looker_api.py, receipt: "['query_id', 'executed_at', 'result_source', 'async_processing_average', 'execute_main_query_average', 'acquire_connection_average']" }
attester: { resource: evals/test_tools.py }
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: system-activity-query-metrics
    resource: system__activity/query_metrics
    title: Looker System Activity Query Metrics Explore
---

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
