---
type: Playbook
title: Unused Content, Dead LookML & Schedule Cleanup Playbook
description: Operational procedures, diagnostic detection queries, and safe deprecation funnels for stale dashboards, inactive explores, and zombie schedules.
tags: [looker, content-governance, cleanup, deprecation, henry, schedules]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: system-activity
    resource: /skills/custom/healthcheck/references/system_activity_queries.md
    title: System Activity Query Bank
  - id: henry-guide
    resource: /skills/custom/refactoring/references/henry_command_guide.md
    title: Henry CLI Guide
---

# Unused Content, Dead LookML & Schedule Cleanup Playbook

This reference document defines the operational procedures, diagnostic detection queries, and safe deprecation funnels for eliminating stale dashboards, inactive explores, dead LookML fields, and zombie schedules.

---

## 🔍 Part 1: How to Review & Diagnose Unused Content & Code

### 1. The 3-Stage Content Deprecation Funnel

To avoid breaking downstream business reports or deleting content needed for quarterly audits, follow this structured deprecation lifecycle:

```
                     CONTENT LIFECYCLE & DEPRECATION FUNNEL
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ Stage 1: Identification   │ Stage 2: Soft Deprecation │ Stage 3: Permanent Purge  │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • 90-day System Activity  │ • Move Dashboards to Trash│ • Hard delete after 30d   │
 │ • Henry Vacuum Dead Code  │ • Mark Explores hidden:yes│ • Remove LookML fields    │
 │ • Fatal Schedule Scans    │ • Disable Zombie Schedules│ • Reassign owner to SvcAcct│
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

### 2. Diagnostic Telemetry Queries (System Activity)

#### A. Unused Dashboards (0 Views in Past 90 Days)
```json
{
  "model": "system__activity",
  "view": "dashboard",
  "fields": [
    "dashboard.id",
    "dashboard.title",
    "dashboard.created_time",
    "user.name",
    "history.most_recent_run_at_date",
    "history.query_run_count"
  ],
  "filters": {
    "dashboard.moved_to_trash": "No",
    "history.most_recent_run_at_date": "before 90 days ago"
  },
  "sorts": ["history.query_run_count desc"],
  "limit": "50"
}
```

#### B. Inactive Explores (0 Queries in Past 90 Days)
```json
{
  "model": "system__activity",
  "view": "history",
  "fields": [
    "query.model",
    "query.view",
    "history.query_run_count",
    "history.most_recent_run_at_date"
  ],
  "filters": {
    "history.most_recent_run_at_date": "before 90 days ago",
    "query.model": "-NULL"
  },
  "sorts": ["history.query_run_count asc"],
  "limit": "50"
}
```

#### C. Zombie Schedules (Inactive Owners > 90 Days)
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": [
    "user.id",
    "user.name",
    "user_facts.last_ui_login_date",
    "scheduled_plan.count",
    "scheduled_plan.name"
  ],
  "filters": {
    "user_facts.last_ui_login_date": "before 90 days ago",
    "user.is_disabled": "No",
    "scheduled_plan.count": ">0"
  },
  "limit": "50"
}
```

---

## 🛠️ Part 2: How to Rectify & Remediate Unused Assets

### Step 1: Scan Dead LookML Fields via Henry CLI
Execute Henry vacuum to catalog fields that have had 0 queries across all models in the last 90 days:
```bash
# Scan model for unused dimensions and measures
henry vacuum --model=ecommerce_analytics --timeframe=90
```

---

### Step 2: Soft-Deprecate Inactive Explores
Do not immediately delete explore definitions from LookML if they might be used by ad-hoc queries. Add `hidden: yes` to remove them from the UI field picker:
```lookml
explore: legacy_order_archive {
  hidden: yes
  description: "⚠️ Deprecated: Decommissioned on 2026-08-11. Use 'orders' explore instead."
  ...
}
```

---

### Step 3: Move Inactive Dashboards to Trash
* Soft-delete dashboards with 0 views in >90 days via Looker API:
```bash
looker-cli api dashboard update --dashboard-id=<ID> --body '{"deleted": true}'
```
* Looker keeps soft-deleted content in the **Trash** for 30 days before permanent deletion, allowing easy recovery if requested by a user.
