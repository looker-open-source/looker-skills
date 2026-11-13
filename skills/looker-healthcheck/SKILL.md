---
name: looker-healthcheck
description: "Runs an instance-wide Looker operational health check, System Activity telemetry audit, content/schedule governance review, or BigQuery warehouse INFORMATION_SCHEMA slot and storage diagnostic. Use when auditing a live Looker instance via looker-cli health pulse/vacuum/analyze, triaging system__activity (history, query_metrics, pdt_event_log, scheduled_plan, content_usage), finding instance-wide PDT build errors or unused content, or scoring overall instance health. Don't use for refactoring a specific LookML view, explore, PDT, or datagroup in code (use looker-performance) or static LookML style and PR code reviews (use lookml-reviewer)."
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

Load **only** the reference file and line ranges required for the active diagnostic branch (in Mode 2, execute Pillar 1, Pillar 2, and Pillar 3 in parallel tracks or subagents after Step 0):

| Phase / Pillar | Diagnostic Focus | Gated Reference Playbooks & Section Line Ranges | Key Deliverable |
| :--- | :--- | :--- | :--- |
| **0. Pre-flight** | Verify `looker-cli` in `PATH`, authentication, and rapid instance pulse | `looker-cli health pulse` & [looker_cli_health_and_vacuum.md](references/looker_cli_health_and_vacuum.md) (`Lines 24-56`) | Verified session & instance baseline pulse |
| **1A. Operational Governance & Content Cleanup** | Audit dashboard tile bloat (>25 tiles), auto-refresh (<30m), dynamic fields (>2/tile), merged queries, inactive accounts/content, draft assets, and failing schedules | [system_activity_queries.md](references/system_activity_queries.md) (`Lines 280-430`) & [playbook_content_governance.md](references/playbook_content_governance.md) (`Lines 10-129`) | Quantified operational findings & cleanup inventory |
| **1B. 3-Way Query Latency Phase Triage** | Decompose query duration into Looker JVM Overhead % vs. DB Execution vs. Connection Queue Wait against PSO benchmarks | [system_activity_queries.md](references/system_activity_queries.md) (`Lines 11-279`) & [playbook_looker_performance.md](references/playbook_looker_performance.md) (`Lines 7-145`) | Latency phase attribution (`< 20%` JVM, `< 5.0s` DB, `< 0.25s` queue) |
| **2. LookML Code Quality, Vacuum & RBAC Security** | Audit Top 3 active projects for `primary_key: yes`, 365d unused models, scoped `vacuum`, RBAC permission sets, and 0–4 Transcriber rubric | [system_activity_queries.md](references/system_activity_queries.md) (`Lines 396-401`, `Lines 431-458`), [looker_cli_health_and_vacuum.md](references/looker_cli_health_and_vacuum.md) (`Lines 57-143`), [security_roles_and_access_control.md](references/security_roles_and_access_control.md) (`Lines 7-141`), [development_workflows_and_ci.md](references/development_workflows_and_ci.md) (`Lines 7-120`), & [`lookml-reviewer`](../lookml-reviewer/SKILL.md) | File/line LookML violations, RBAC audit & 0–4 Transcriber score |
| **3. Warehouse Compute & Storage Audit** | Query `INFORMATION_SCHEMA` (`JOBS_TIMELINE_BY_PROJECT`, `PARTITIONS`+`TABLES`, `JOBS_BY_PROJECT`) for 24h slot contention, RAM shuffle spills, unpartitioned tables (>1M rows), and Looker Job Label billing | [playbook_bigquery_compute.md](references/playbook_bigquery_compute.md) (`Lines 7-206`) & [looker_bigquery_pipeline_architecture.md](references/looker_bigquery_pipeline_architecture.md) (`Lines 7-176`) | Slot saturation curve, TB billed by model, and Partition/Cluster DDL |
| **4. Active LookML Tuning (Handoff)** | Surgically refactor slow LookML (ETL-triggered datagroups, PDT Cold-Start materialization, Aggregate Awareness rollups, parallel SQL `EXPLAIN` profiling) | Delegate to [`looker-performance`](../looker-performance/SKILL.md) & [`looker-architect`](../looker-architect/SKILL.md) | Validated LookML diffs & measured query runtime delta |
| **5. Deliverable Synthesis** | Compile findings into a quantified **Audit Report** (Mode 1) or a 30-check scored **Technical Design Document (TDD)** (Mode 2); load [playbook_healthcheck_delivery.md](references/playbook_healthcheck_delivery.md) (`Lines 24-133`) only for customer engagement planning | [scoring_master_rubric.md](references/scoring_master_rubric.md) (`Lines 7-78`) & [playbook_technical_design_document.md](references/playbook_technical_design_document.md) (`Lines 9-124`) | `audit_report_*.md` or `TECHNICAL_DESIGN_DOCUMENT.md` |

---

## ⚠️ Critical Rules of Engagement

1. **Strictly API/CLI Telemetry**: All auditing MUST be performed via `looker-cli` or Looker System Activity inline queries.
2. **NO Local Filesystem Scans for Instance Data**: Do NOT use `find`, `grep`, or local search tools to audit the remote instance or locate binaries across `/`. Use `looker-cli api project all_project_files [project_id]` and `looker-cli project file cat` to inspect remote LookML files.
3. **Avoid Limit Truncation & Use Early-Exit Count Gates**: Always run the `.count` query (or pipe IDs with `"limit":"5000"` to `jq 'length'`) **first** to report exact totals; if `Count == 0`, skip the corresponding `Details` query.
4. **Read-Only Audit & Surgical Modifications**: Never execute destructive commands (`delete`, `drop`, `truncate`) during audits. When proposing LookML fixes, stage surgical block edits without rewriting entire files.
5. **Report Actionability**: Every finding in the deliverable MUST provide:
   * Concrete identifiers (Dashboard ID, View Name, Query ID/Slug, User Name).
   * Exact Looker UI URL links (`https://[instance]/dashboards/[id]`).
   * A tailored LookML code diff or actionable remediation command.

---

## 🔍 Step 0: Pre-flight Setup & Rapid Health Pulse

1. **Verify CLI & Session Authentication (Ensure `~/.local/bin` is in `PATH`; never scan `/` with `find`)**:
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   command -v looker-cli && looker-cli user me
   ```
   If `looker-cli` is missing or unauthenticated, stop and guide the user through `installing-looker-cli` or `authenticating-looker-cli`.
2. **Run Rapid Health Pulse**:
   * **For Mode 2 (Full Healthcheck)**, run `looker-cli health pulse` **once** (it automatically runs all 6 checks: `db-connections`, `dashboard-performance`, `dashboard-errors`, `explore-performance`, `schedule-failures`, and `legacy-features`):
     ```bash
     looker-cli health pulse
     ```
   * **For Targeted Triage**, run only the specific subcommand needed (do NOT re-run individual subcommands after running bare `looker-cli health pulse`):
     ```bash
     looker-cli health pulse dashboard-performance   # or: dashboard-errors | explore-performance | schedule-failures | db-connections | legacy-features
     ```
3. **Verify Warehouse Access (Mode 2 / BigQuery)**:
   ```bash
   command -v bq && gcloud config get-value project
   ```

---

## ⚡ The 5-Vector Forensic Diagnostic Protocol

*(In Mode 2, execute Vectors 1+5, Vector 2, and Vector 3 concurrently in parallel subagents or background jobs after Step 0 completes.)*

### Vector 1: Latency Phase Decomposition (Pillar 1 — Looker Performance)
Deconstruct query duration via `system__activity/query_metrics` using `looker-cli api query run_inline_query json -`:
1. **Looker JVM Overhead %**: `(async_processing - (execute_main_query + acquire_connection)) / async_processing * 100` (Target: `< 20%`).
2. **Database Execution Time**: `execute_main_query_average` (Target: `< 5.0s`).
3. **Connection Queue Wait**: `acquire_connection_average` (Target: `< 0.25s`).
* Child References: [playbook_looker_performance.md](references/playbook_looker_performance.md) (`Lines 7-145`), [system_activity_queries.md](references/system_activity_queries.md) (`Lines 11-279`)

### Vector 2: SUM(DISTINCT) Fanout, Vacuum & LookML Integrity (Pillar 2 — LookML Quality)
* Identify the **Top 3 active projects** from `system__activity/history` and check for **365-day unused LookML models** (`system_activity_queries.md` `Lines 396-401`, excluding `system__activity` and `marketplace_*`).
* Run `looker-cli health vacuum models --project=<project_id>`. **NEVER run bare `looker-cli health vacuum explores` without `--model` and `--explore` flags** (which loops across every explore on the instance and times out); always scope to specific flagged explores:
  ```bash
  looker-cli health vacuum explores --model=<model_name> --explore=<explore_name>
  ```
* Validate compiler health via `looker-cli project validate <project_id>`. Before running the Section 15 remote LookML inspection loop (`system_activity_queries.md` `Lines 431-458`), check the view count; **if `> 50` view files exist, ask the user which project or views to prioritize** before fetching file contents.
* Check every joined view for `primary_key: yes` (to eliminate `SUM(DISTINCT)` symmetric aggregate overhead), explicit `relationship:` definitions, `type: string` on ID keys, `hidden: yes` on foreign keys, and score on the 0–4 Transcriber rubric.
* Child References: [`lookml-reviewer`](../lookml-reviewer/SKILL.md), [looker_cli_health_and_vacuum.md](references/looker_cli_health_and_vacuum.md) (`Lines 57-143`), [development_workflows_and_ci.md](references/development_workflows_and_ci.md) (`Lines 7-120`)

### Vector 3: BigQuery Slot Saturation & Spills (Pillar 3 — Warehouse Compute)
Execute `INFORMATION_SCHEMA` queries directly via `bq query --use_legacy_sql=false --format=prettyjson "<SQL>"`:
* Check `` `region-<region>`.INFORMATION_SCHEMA.JOBS_TIMELINE_BY_PROJECT `` (filtering on both `job_creation_time` and `period_start`) for `period_slot_ms` and slot saturation.
* Check dataset-scoped `` `<project_id>.<dataset_id>`.INFORMATION_SCHEMA.PARTITIONS `` joined with `TABLES` for fact tables over 1M rows lacking date partitioning or clustering, and `` `region-<region>`.INFORMATION_SCHEMA.JOBS_BY_PROJECT `` for bytes billed by Looker job labels (`looker-context-history_slug`), BI Engine mode, and stage shuffle spills (`shuffle_output_bytes_spilled_to_disk`).
* Child References: [playbook_bigquery_compute.md](references/playbook_bigquery_compute.md) (`Lines 7-206`)

### Vector 4: Aggregate Awareness, PDTs & Acceleration (Pillar 3 & Active Tuning)
* Identify high-frequency explore queries scanning over 10M rows repeatedly and prescribe LookML `aggregate_table` rollups, Incremental PDTs, and BI Engine sizing.
* Delegate active LookML refactoring and parallel `EXPLAIN` profiling to [`looker-performance`](../looker-performance/SKILL.md) and [`looker-architect`](../looker-architect/SKILL.md).
* Child References: [`looker-performance`](../looker-performance/SKILL.md), [`looker-architect`](../looker-architect/references/aggregate_awareness.md), [playbook_bigquery_compute.md](references/playbook_bigquery_compute.md) (`Lines 121-206`), [looker_bigquery_pipeline_architecture.md](references/looker_bigquery_pipeline_architecture.md) (`Lines 7-176`)

### Vector 5: Concurrency Bursts, Auto-Refresh, Content & RBAC Governance (Pillar 1 & 2 — Governance)
* Audit dashboards with over 25 tiles, over 2 dynamic fields per tile, aggressive auto-refresh (`< 30` min), merged queries, top-of-hour (`:00`) cron schedules, 7-day failed schedules, zombie schedules owned by disabled users, 90-day inactive users, 60-day unused content (**caveat**: verify whether flagged dashboards are quarterly or annual executive reports before recommending deletion), `%test%,%copy%,%draft%` content (both `.count` and detail queries), and RBAC permission sets (`admin`, `manage_models`, `see_lookml`, `develop`, `see_system_activity`, `see_users`).
* Child References: [playbook_content_governance.md](references/playbook_content_governance.md) (`Lines 10-129`), [security_roles_and_access_control.md](references/security_roles_and_access_control.md) (`Lines 7-141`), [system_activity_queries.md](references/system_activity_queries.md) (`Lines 280-430`)

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
