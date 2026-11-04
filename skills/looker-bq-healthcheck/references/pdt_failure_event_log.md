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
