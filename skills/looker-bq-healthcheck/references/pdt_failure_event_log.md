---
type: Attested Computation
title: PDT Build Failure Event Log
description: Sanctioned Looker System Activity query to isolate Persistent Derived Table build failures, error codes, and trigger failures.
status: stable
runtime: Looker
parameters:
  - name: model_name
    type: string
    required: false
  - name: days
    type: integer
    required: false
executor: { resource: agent/tools/looker_api.py, receipt: "['query_id', 'failed_pdts', 'error_messages']" }
attester: { resource: evals/test_tools.py }
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: pdt-event-log
    resource: system__activity/pdt_event_log
    title: Looker System Activity PDT Event Log Explore
---

# Computation

```json
{
  "model": "system__activity",
  "view": "pdt_event_log",
  "fields": [
    "pdt_event_log.view_name",
    "pdt_event_log.action",
    "pdt_event_log.status",
    "pdt_event_log.error_message",
    "pdt_event_log.created_time"
  ],
  "filters": {
    "pdt_event_log.action": "create-fail",
    "pdt_event_log.created_date": "7 days"
  },
  "sorts": ["pdt_event_log.created_time desc"],
  "limit": "25"
}
```

Identifies derived table build errors and broken datagroup cascades.[^pdt-event-log]

[^pdt-event-log]: Looker System Activity PDT Event Log Explore
