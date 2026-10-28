---
name: looker-performance-auditor
description: >-
  Audits Looker query lifecycle latency (Looker JVM overhead % vs DB execution vs
  connection wait), dashboard tile density (over 25 tiles), auto-refresh intervals,
  dynamic fields, schedule staggering, and System Activity history. Use when
  diagnosing slow Looker dashboards, connection pool queuing, or content governance
  issues. Don't use for Looker onboarding or creating new dashboards from scratch.
compatibility: Requires looker-cli.
license: Apache-2.0
metadata:
  version: 0.1.0
  domain: looker-operations
  status: preview
  usage-interface: looker-cli looker-mcp
  publisher: google
  shared-refs: looker-cli-setup looker-cli-auth
---

# Looker Performance & Content Auditor

This skill audits Looker instance performance, query lifecycle phases, dashboard bloat, and content governance using `looker-cli` and `system__activity`.

It isolates whether latency stems from **Looker JVM processing**, **database execution**, or **connection queue starvation**, and prescribes specific architectural fixes.

---

## When to Use This Skill

Activate this skill when:
* Users report that Looker dashboards or explores are running slowly.
* Diagnosing whether query slowness is caused by Looker (table calculations, rendering) or the underlying warehouse.
* Auditing dashboard hygiene (tile counts over 25, unchecked auto-refresh intervals, over 2 dynamic fields per tile).
* Analyzing query queueing and connection pool contention.
* Re-architecting scheduled delivery plans stacked at top-of-hour (`:00`).

---

## Critical Behavioral Directives

1. **Prerequisite Check (`looker-base`)**: If the Looker MCP tools or `looker-cli` aren't available, ask the user to install `looker-base` (and consult `looker-cli-setup` / `looker-cli-auth`).
2. **Reality Mapping First**: Confirm the target Looker profile/instance or specific slow Dashboard ID / Explore name before running deep-dive inline queries.
3. **Avoid Limit Truncation**: When querying `system__activity` with a `limit`, always run a separate `.count` query or pipe un-limited IDs to `jq 'length'` so totals are accurate.
4. **Surgical Modification**: Never perform full-file rewrites when recommending or applying LookML caching or filter changes.

---

## Tooling & Execution Commands

* **Looker Health Pulse Pre-Check**:
  ```bash
  looker-cli health pulse dashboard-performance && looker-cli health pulse explore-performance
  ```
* **Looker System Activity Inline Query Runner**:
  ```bash
  echo '<JSON_QUERY>' | looker-cli api query run_inline_query json - | jq
  ```

---

## The 3-Way Latency Triage Methodology

Deconstruct query duration via `system__activity/query_metrics`:

$$\text{Looker Overhead \%} = \frac{\text{async\_processing} - (\text{execute\_main\_query} + \text{acquire\_connection})}{\text{async\_processing}} \times 100$$

| Metric | Target SLA | Root Cause If High | Remediation Playbook |
| :--- | :--- | :--- | :--- |
| **Looker JVM Overhead %** | **`< 20%`** | Heavy table calculations, giant pivot tables, merged queries, complex Liquid templating. | Shift computations to LookML measures or warehouse views; prune exposed fields. |
| **Database Execution Time** | **`< 5.0s`** | Unpartitioned table scans, missing primary keys (symmetric aggregation), un-indexed filters. | Inspect SQL via `looker-cli api query query <id> --fields sql`; see `lookml-reviewer` and `bq-jobs-diagnostics`. |
| **Connection Wait Time** | **`< 0.25s`** | Exhausted connection pool, massive concurrency burst (over 25 tiles loading simultaneously). | Lower dashboard tile density; increase max connections; stagger schedules. |

---

## Deep-Dive References

* [Looker Performance Playbook](references/playbook_looker_performance.md)
* [Content Governance & Scheduling Playbook](references/playbook_content_governance.md)
* [Query Latency Phase Breakdown](references/query_latency_breakdown.md)
* [System Activity Audit Queries](references/system_activity_queries.md)
* [History Query Analysis](references/history_query_analysis.md)
* [Query Outliers Diagnosis](references/query_outliers_diagnosis.md)
* [Large Dashboards Optimization (Over 25 Tiles)](references/large_dashboards_optimization.md)
* [Single Dashboard Optimization Checklist](references/single_dashboard_optimization.md)
* [Scheduled Content Staggering](references/content_delivery_schedules.md)
* [Performance Benchmarks](references/benchmarks.md)
