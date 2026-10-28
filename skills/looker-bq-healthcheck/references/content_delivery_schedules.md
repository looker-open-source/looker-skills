---
type: Reference
title: Content Delivery & Schedule Optimization Guide
description: Diagnostic protocols, failure pattern matching, and automated cleanup procedures for scheduled deliveries and scheduler queue optimization.
tags: [looker, scheduler, cron, queue, zombie-schedules]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: system-activity-schedules
    resource: system__activity/scheduled_plan
    title: Looker System Activity Scheduled Plan Explore
---

# Content Delivery & Schedule Optimization Playbook

This reference document defines the diagnostic protocols, failure pattern matching, and automated cleanup procedures for optimizing scheduled deliveries, eliminating queue congestion, and purging zombie schedules.

---

## 🔍 Part 1: How to Review & Diagnose Scheduling Bottlenecks

### 1. Core Scheduling Failure Patterns

```
                                  SCHEDULED DELIVERY BOTTLENECK
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
[ZOMBIE SCHEDULES]                   [BROKEN CONTENT DELIVERY]            [TIMEOUTS & CONGESTION]
Inactive Users (>90 days login)      Fatal LookML/Content Errors          Warehouse / Concurrency Limits
 • Former employees running daily     • "The view for this Look not found" • "Query execution timeout"
 • Scheduled jobs never cancelled     • "User cannot run Dashboard"        • "Enqueue for execute" queue lag
 • Wasting DB compute & licenses      • "Not authorized to run plan"       • Top-of-the-hour pileups (:00)
```

---

### 2. Diagnostic Telemetry Queries (System Activity)

#### A. Inactive Users with Active Schedules (Zombie Schedules)
Locates active schedules owned by users who have not logged in for over 90 days:
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": [
    "user.name",
    "user_facts.last_ui_login_date",
    "history.most_recent_query_date",
    "scheduled_job.count"
  ],
  "filters": {
    "user_facts.last_ui_login_date": "before 90 days ago",
    "user.is_disabled": "No",
    "scheduled_job.count": ">0"
  },
  "sorts": ["scheduled_job.count desc"],
  "limit": "100"
}
```

#### B. Schedules Failing with Fatal Content/Permission Errors
Identifies scheduled jobs continuously failing on deleted views, Looks, or revoked permissions:
```json
{
  "model": "system__activity",
  "view": "scheduled_plan",
  "fields": [
    "scheduled_plan.id",
    "scheduled_job.status",
    "user.name",
    "scheduled_job.status_detail",
    "scheduled_plan_destination.type",
    "scheduled_plan_destination.format"
  ],
  "filters": {
    "scheduled_job.status_detail": "%An API error occurred%,%User missing permission to send to specified destination%,%Not authorized to run scheduled plan%,%The view for this Look cannot be found%,%User cannot run Look%,%User cannot run Dashboard%"
  },
  "sorts": ["scheduled_plan.id desc"],
  "limit": "100"
}
```

#### C. Hourly Queue Congestion Heatmap (`enqueue_for_execute`)
```json
{
  "model": "system__activity",
  "view": "scheduled_plan",
  "fields": [
    "scheduled_job_stage.started_hour_of_day",
    "scheduled_job_stage.started_day_of_week",
    "scheduled_job_stage.avg_runtime",
    "scheduled_job.count"
  ],
  "filters": {
    "scheduled_job_stage.stage": "enqueue_for_execute",
    "scheduled_plan.run_once": "no"
  },
  "sorts": ["scheduled_job_stage.avg_runtime desc"],
  "limit": "100"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate Scheduler Congestion

### Remediation Protocol 1: Staggering Top-of-Hour Schedule Stacking
* **Problem**: Over 80% of business schedules default to `:00` (e.g. `08:00`, `09:00`), exhausting all Looker renderer and database connection threads.
* **Fix**:
  1. Distribute cron schedules across non-zero minute windows:
     * Batch 1 (Executive): `08:07 AM` (`7 8 * * *`)
     * Batch 2 (Operations): `08:22 AM` (`22 8 * * *`)
     * Batch 3 (Regional): `08:37 AM` (`37 8 * * *`)
     * Batch 4 (Marketing): `08:52 AM` (`52 8 * * *`)

---

### Remediation Protocol 2: Eliminating "Send All Results" Memory Hazards
* **Problem**: Scheduled deliveries using the **"Send All Results"** setting run un-paged queries that stream millions of records into Looker JVM memory, causing Out-Of-Memory (OOM) instance crashes.
* **Fix**:
  1. In schedule settings, set **Results** to `All Results in Table` or cap at `50,000 rows`.
  2. For large data extracts, use Looker Action Hub / Webhook to stream directly into Google Cloud Storage (GCS) or S3.

---

### Remediation Protocol 3: Programmatic Deletion of Zombie & Fatal Schedules
* Execute programmatic deletion of orphaned scheduled plans via Looker API:
```bash
# Delete broken scheduled plan by ID
looker-cli api scheduled_plan delete --scheduled-plan-id=<SCHEDULED_PLAN_ID>
```
