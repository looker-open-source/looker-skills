---
type: Attested Computation
title: BigQuery Query Cost & Bytes Billed Audit
description: Sanctioned BigQuery SQL query to compute total gigabytes billed and dollar costs grouped by user and job.
status: stable
runtime: bigquery
parameters:
  - name: hours
    type: integer
    required: false
  - name: cost_per_tb
    type: float
    required: false
executor: { resource: agent/tools/bq_client.py, receipt: "['job_id', 'executed_sql', 'total_gb_billed', 'estimated_cost_usd']" }
attester: { resource: evals/test_tools.py }
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: bq-jobs-by-project
    resource: region-us.INFORMATION_SCHEMA.JOBS_BY_PROJECT
    title: BigQuery Jobs by Project
---

# Computation

```sql
SELECT
  user_email,
  -- Extract Looker Job Labels
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-user_id') AS looker_user_id,
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-history_slug') AS looker_history_slug,
  (SELECT value FROM UNNEST(labels) WHERE key = 'looker-context-instance_slug') AS looker_instance_slug,
  COUNT(1) as total_queries,
  ROUND(SUM(total_bytes_billed) / POW(1024, 3), 2) as total_gb_billed,
  ROUND((SUM(total_bytes_billed) / POW(10, 12)) * 6.25, 4) as estimated_cost_usd,
  ROUND(SUM(total_slot_ms) / 1000, 2) as total_slot_seconds
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE
  creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
  AND job_type = 'QUERY'
  AND EXISTS (
    SELECT 1 FROM UNNEST(labels) WHERE key LIKE 'looker-context%'
  )
GROUP BY 1, 2, 3, 4
ORDER BY total_gb_billed DESC
LIMIT 20;
```

Audits on-demand query execution expenses and identifies costly unpruned query scans using structured BigQuery Job Labels.[^bq-jobs-by-project]

[^bq-jobs-by-project]: BigQuery Jobs by Project
