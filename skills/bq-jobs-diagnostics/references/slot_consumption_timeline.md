---
type: Attested Computation
title: BigQuery Slot Consumption Timeline (24 Hours)
description: Sanctioned BigQuery SQL query to evaluate 24-hour hourly slot utilization and peak saturation across query jobs.
status: stable
runtime: bigquery
parameters:
  - name: hours
    type: integer
    required: false
  - name: region
    type: string
    required: false
executor: { resource: agent/tools/bq_client.py, receipt: "['job_id', 'executed_sql', 'avg_slots', 'peak_slots', 'total_rows']" }
attester: { resource: evals/test_tools.py }
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: bq-jobs-timeline
    resource: region-us.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT
    title: BigQuery Jobs Timeline by Project
---

# Computation

```sql
SELECT
  TIMESTAMP_TRUNC(period_start, HOUR) as hour_window,
  ROUND(AVG(period_slot_ms) / 1000, 2) as avg_slots,
  ROUND(MAX(period_slot_ms) / 1000, 2) as peak_slots
FROM
  `region-us`.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT
WHERE
  period_start >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY 1
ORDER BY hour_window DESC
LIMIT 24;
```

Measures warehouse slot contention and saturation against project reservations.[^bq-jobs-timeline]

[^bq-jobs-timeline]: BigQuery Jobs Timeline by Project
