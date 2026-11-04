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
