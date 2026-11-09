---
name: looker-healthcheck
description: >-
  Comprehensive Looker instance, LookML codebase, and database warehouse healthcheck
  and audit orchestrator. Audits operational governance (tile bloat, auto-refresh,
  schedules, inactive users/content, broken datagroups/PDTs), 3-way query lifecycle
  latency phase decomposition (Looker JVM overhead % vs DB execution vs connection queue
  wait), LookML modeling quality (0-4 Transcriber rubric and SUM_DISTINCT fanouts),
  and warehouse compute diagnostics (slot contention, shuffle spills, partitioning DDL).
  Supports both rapid operational audit reports (audit_report_*.md) and full-stack
  scored Technical Design Documents (TECHNICAL_DESIGN_DOCUMENT.md). Coordinates with
  lookml-reviewer and looker-performance.
compatibility: Requires looker-cli; bq CLI optional for warehouse compute diagnostics.
license: Apache-2.0
metadata:
  version: 0.2.0
  domain: looker-operations
  status: stable
  role: orchestrator
  usage-interface: looker-cli looker-mcp
  publisher: google
  shared-refs: looker-cli-setup looker-cli-auth
---

# Looker & Warehouse Healthcheck Orchestrator

This orchestrator skill guides an agent through comprehensive auditing, diagnostic healthchecks, and remediation workflows across a **Looker instance**, its **LookML codebase**, and its **database warehouse** (Google BigQuery, Snowflake, PostgreSQL, etc.).

---

## 🎯 Dual Execution Modes

Depending on user intent and available permissions, execute in one of two modes:

```
                            HEALTHCHECK EXECUTION MODES
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
 [MODE 1: RAPID OPERATIONAL AUDIT]               [MODE 2: FULL 3-PILLAR HEALTHCHECK & TDD]
 Scope: Looker Application Layer only             Scope: Looker + LookML + Warehouse Compute
 Dialect: 100% Database-Agnostic                  Dialect: Full-Stack (BigQuery / Warehouse)
 • Tile bloat, auto-refresh, dynamic fields       • 3-way query latency phase decomposition
 • Inactive users, content & zombie crons         • 12-stage Google Cloud PSO benchmarks
 • Failed datagroups & PDT event logs             • 0–4 Transcriber LookML maturity rubric
 • looker-cli health pulse & vacuum               • INFORMATION_SCHEMA slot timelines & spills
 Output: audit_report_[instance]_[timestamp].md   Output: Scored TECHNICAL_DESIGN_DOCUMENT.md
```

---

## 🗺️ Step-by-Step Orchestration Matrix

| Phase / Pillar | Diagnostic Focus | Tool / Reference to Use | Key Deliverable |
| :--- | :--- | :--- | :--- |
| **0. Pre-flight** | Verify `looker-cli`, profile connection, authentication, and rapid pulse | `looker-cli health pulse` & [CLI Health & Vacuum Guide](references/looker_cli_health_and_vacuum.md) | Verified session & instance baseline pulse |
| **1A. Operational Governance & Content Cleanup** | Audit dashboard tile bloat (>25 tiles), auto-refresh (<30m), dynamic fields (>2/tile), merged queries, inactive accounts/content, draft assets, and failing schedules | [Content Governance Playbook](references/playbook_content_governance.md) & [System Activity Queries](references/system_activity_queries.md) | Quantified operational findings & cleanup inventory |
| **1B. 3-Way Query Latency Phase Triage** | Decompose query duration into Looker JVM Overhead % vs. DB Execution vs. Connection Queue Wait against PSO benchmarks | [Looker Performance Playbook](references/playbook_looker_performance.md) & [System Activity Queries](references/system_activity_queries.md) | Latency phase attribution (`< 20%` JVM, `< 5.0s` DB, `< 0.25s` queue) |
| **2. LookML Code Quality & Transcriber Rubric** | Audit LookML for `primary_key: yes` (`SUM(DISTINCT)` fanout prevention), explicit joins, vacuum dead fields, and score on 0–4 Transcriber rubric | [`lookml-reviewer`](../lookml-reviewer/SKILL.md) + [CLI Vacuum Guide](references/looker_cli_health_and_vacuum.md) & [Dev Governance & CI](references/development_workflows_and_ci.md) | File/line LookML violations & 0–4 Transcriber maturity score |
| **3. Warehouse Compute & Storage Audit** | Query `INFORMATION_SCHEMA` (`JOBS_TIMELINE_BY_PROJECT`, `TABLE_STORAGE`, `JOBS_BY_PROJECT`) for 24h slot contention, RAM shuffle spills, unpartitioned tables (>10M rows), and Looker Job Label billing | [BigQuery Compute Playbook](references/playbook_bigquery_compute.md) | Slot saturation curve, TB billed by model, and Partition/Cluster DDL |
| **4. Active LookML Tuning (Handoff)** | Surgically refactor slow LookML (ETL-triggered datagroups, PDT Cold-Start materialization, Aggregate Awareness rollups, parallel SQL `EXPLAIN` profiling) | Delegate to [`looker-performance`](../looker-performance/SKILL.md) & [`looker-architect`](../looker-architect/SKILL.md) | Validated LookML diffs & measured query runtime delta |
| **5. Deliverable Synthesis** | Compile findings into a quantified **Audit Report** (Mode 1) or an authoritative 30-check scored **Technical Design Document (TDD)** (Mode 2) | [TDD Playbook](references/playbook_technical_design_document.md) & [Master Scoring Rubric](references/scoring_master_rubric.md) | `audit_report_*.md` or `TECHNICAL_DESIGN_DOCUMENT.md` |

---

## ⚠️ Critical Rules of Engagement

1. **Strictly API/CLI Telemetry**: All auditing MUST be performed via `looker-cli` or Looker System Activity inline queries.
2. **NO Local Filesystem Scans for Instance Data**: Do NOT use `find`, `grep`, or local search tools to audit the remote instance. Use `looker-cli api project all_project_files [project_id]` and `looker-cli project file cat` to inspect remote LookML files.
3. **Avoid Limit Truncation**: When running System Activity inline queries with a `limit`, always run a companion `.count` query or pipe un-limited IDs to `jq 'length'` to report exact totals.
4. **Read-Only Audit & Surgical Modifications**: Never execute destructive commands (`delete`, `drop`, `truncate`) during audits. When proposing LookML fixes, stage surgical block edits without rewriting entire files.
5. **Report Actionability**: Every finding in the deliverable MUST provide:
   * Concrete identifiers (Dashboard ID, View Name, Query ID, User Name).
   * Exact Looker UI URL links (`https://[instance]/dashboards/[id]`).
   * A tailored LookML code diff or actionable remediation command.

---

## 🔍 Step 0: Pre-flight Setup & Rapid Health Pulse

1. **Verify CLI & Session Authentication**:
   ```bash
   which looker-cli && looker-cli user me
   ```
2. **Run Rapid Health Pulse**:
   ```bash
   looker-cli health pulse
   ```
   Or target specific components:
   ```bash
   looker-cli health pulse dashboard-performance
   looker-cli health pulse explore-performance
   looker-cli health pulse schedule-failures
   looker-cli health pulse db-connections
   ```
3. **Verify Warehouse Access (Mode 2 / BigQuery)**:
   ```bash
   which bq && gcloud config get-value project
   ```

---

## ⚡ The 5-Vector Forensic Diagnostic Protocol

### Vector 1: Latency Phase Decomposition (Pillar 1 — Looker Performance)
Deconstruct query duration via `system__activity/query_metrics` using `looker-cli api query run_inline_query json -`:
1. **Looker JVM Overhead %**: `(async_processing - (execute_main_query + acquire_connection)) / async_processing * 100` (Target: `< 20%`).
2. **Database Execution Time**: `execute_main_query_average` (Target: `< 5.0s`).
3. **Connection Queue Wait**: `acquire_connection_average` (Target: `< 0.25s`).
* Child References: [Looker Performance Playbook](references/playbook_looker_performance.md), [System Activity Queries](references/system_activity_queries.md)

### Vector 2: SUM(DISTINCT) Fanout & LookML Integrity (Pillar 2 — LookML Quality)
Delegate code review to [`lookml-reviewer`](../lookml-reviewer/SKILL.md):
* Check every joined view for `primary_key: yes` to eliminate `SUM(DISTINCT)` symmetric aggregate hashing overhead.
* Verify explicit `relationship:` definitions, masked technical keys (`hidden: yes`), and field descriptions.
* Scan dead explores and unused fields via `looker-cli health vacuum models` and `looker-cli health vacuum explores`.
* Validate compiler health via `looker-cli project validate <project_id>` and score on the 0–4 Transcriber rubric.
* Child References: [`lookml-reviewer`](../lookml-reviewer/SKILL.md), [Looker CLI Health & Vacuum Guide](references/looker_cli_health_and_vacuum.md), [Dev Governance & CI](references/development_workflows_and_ci.md)

### Vector 3: BigQuery Slot Saturation & Spills (Pillar 3 — Warehouse Compute)
Execute `INFORMATION_SCHEMA` queries directly via `bq query --use_legacy_sql=false --format=prettyjson "<SQL>"`:
* Check `JOBS_TIMELINE_BY_PROJECT` for `period_slot_ms`, `period_estimated_runnable_units` (queued queries), and `period_shuffle_ram_usage_ratio` (disk spills).
* Check `TABLE_STORAGE` for fact tables over 10M rows lacking date partitioning or clustering, and `JOBS_BY_PROJECT` for bytes billed by Looker model (`looker-context-history_slug`).
* Child References: [BigQuery Compute Playbook](references/playbook_bigquery_compute.md)

### Vector 4: Aggregate Awareness, PDTs & Acceleration (Pillar 3 & Active Tuning)
* Identify high-frequency explore queries scanning over 10M rows repeatedly and prescribe LookML `aggregate_table` rollups, Incremental PDTs, and BI Engine sizing.
* Delegate active LookML refactoring and parallel `EXPLAIN` profiling to [`looker-performance`](../looker-performance/SKILL.md) and [`looker-architect`](../looker-architect/SKILL.md).
* Child References: [`looker-performance`](../looker-performance/SKILL.md), [`looker-architect`](../looker-architect/references/aggregate_awareness.md), [BigQuery Compute Playbook](references/playbook_bigquery_compute.md), [Pipeline Architecture Foundation](references/looker_bigquery_pipeline_architecture.md)

### Vector 5: Concurrency Bursts, Auto-Refresh & Governance (Pillar 1 — Governance)
* Audit dashboards with over 25 tiles, over 2 dynamic fields per tile, aggressive auto-refresh (`< 30` min), and top-of-hour (`:00`) cron schedules, plus CI/CD and RBAC security posture.
* Child References: [Content Governance Playbook](references/playbook_content_governance.md), [Security Roles & Access Control](references/security_roles_and_access_control.md), [Looker CLI Health & Vacuum Guide](references/looker_cli_health_and_vacuum.md)

---

## 📝 Deliverables

### Mode 1 Deliverable: Operational Audit Report
Save to `audit_report_[instance]_[timestamp].md`:
1. **Executive Metadata & Scorecard**: Timestamp, Looker URL, Auditor, Total items flagged.
2. **Prioritized Findings**: High 🔴 (PDT/datagroup failures, >30s queries), Medium 🟡 (Tile bloat, merged queries, dynamic fields, orphaned schedules), Low 🟢 (Inactive accounts/content, draft assets).
3. **Quantified Findings & Direct URLs**: Exact counts, names, and hyperlinks to Looker UI.
4. **Actionable Recommendations**: Precise LookML code diffs or `looker-cli` remediation commands.

### Mode 2 Deliverable: Technical Design Document (TDD)
Synthesize all 3 pillars into `TECHNICAL_DESIGN_DOCUMENT.md` across 7 standard sections:
1. **Executive Summary & Modernization Objectives** (Baseline 0–100% score from [Master Scoring Rubric](references/scoring_master_rubric.md) & target SLAs)
2. **Current State Architecture & Forensic Telemetry**
3. **Target State Architecture & Data Flow** (Mermaid diagram)
4. **Pillar 1 Technical Design (Looker Performance & Content Governance)**
5. **Pillar 2 Technical Design (LookML Modeling & Code Quality — Surgical Diffs)**
6. **Pillar 3 Technical Design (BigQuery Engine & Partition/Cluster DDL)**
7. **Phased Migration Roadmap, Risk Matrix & Projected ROI**

* Child References: [TDD Playbook](references/playbook_technical_design_document.md), [Master Scoring Rubric](references/scoring_master_rubric.md), [Healthcheck Delivery Guide](references/playbook_healthcheck_delivery.md)
