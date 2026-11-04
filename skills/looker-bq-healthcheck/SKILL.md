---
name: looker-bq-healthcheck
description: >-
  Orchestrates an end-to-end 3-pillar healthcheck across a Looker instance
  (System Activity 3-way query latency breakdown), LookML codebase (0-4 Transcriber
  rubric and SUM_DISTINCT fanouts), and BigQuery warehouse (INFORMATION_SCHEMA slot
  contention, shuffle spills, and partitioning) to compile a scored Technical Design
  Document (TDD). Coordinates looker-audit, lookml-reviewer, looker-performance-optimizer,
  and child diagnostic references. Use when running a full-stack Looker + BigQuery
  healthcheck, diagnosing cross-layer query latency or slot starvation, or generating
  an executive remediation TDD. Don't use for Looker onboarding, creating new
  dashboards from scratch, or dialect migrations.
compatibility: Requires looker-cli and bq CLI.
license: Apache-2.0
metadata:
  version: 0.1.0
  domain: looker-operations
  status: preview
  role: orchestrator
  usage-interface: looker-cli looker-mcp
  publisher: google
  shared-refs: looker-cli-setup looker-cli-auth
---

# Looker & BigQuery 3-Pillar Healthcheck Orchestrator

This parent orchestrator skill guides an agent through an end-to-end, 3-pillar diagnostic healthcheck and remediation workflow across a **Looker instance**, its **LookML codebase**, and its **Google Cloud BigQuery warehouse**.

To provide a predictable, non-overlapping agent workflow, this orchestrator coordinates existing repository skills alongside specialized child reference playbooks:

## Step-by-Step Orchestration Matrix

| Pillar / Phase | Diagnostic & Remediation Goal | Skill / Child Reference to Use | Key Deliverable / Verification |
| :--- | :--- | :--- | :--- |
| **0. Pre-flight** | Verify `looker-cli`, `bq` CLI, and rapid instance health pulse | Step 0 below (`looker-cli health pulse`) | Authenticated Looker + GCP session & baseline pulse |
| **1A. Looker Instance & Governance Audit** | Audit dashboard tile bloat (over 25 tiles), auto-refresh, dynamic fields, merged queries, cache hit ratio, broken datagroups/PDTs, and inactive content/schedules | [`looker-audit`](../looker-audit/SKILL.md) + [Content Governance Playbook](references/playbook_content_governance.md) | Quantified Looker operational & governance findings |
| **1B. 3-Way Query Latency Triage** | Decompose slow query duration via `system__activity/query_metrics` into Looker JVM Overhead % vs. DB Execution vs. Connection Queue Wait | Child Ref: [Looker Performance Playbook (`looker-performance-auditor`)](references/playbook_looker_performance.md) & [Query Latency Breakdown](references/query_latency_breakdown.md) | 3-way latency bottleneck attribution (`< 20%` JVM, `< 5.0s` DB, `< 0.25s` queue) |
| **2. LookML Quality & Transcriber Rubric** | Audit LookML views/explores for `primary_key: yes` (`SUM(DISTINCT)` fanout prevention), explicit joins, and score on the 0–4 Transcriber Maturity Rubric | [`lookml-reviewer`](../lookml-reviewer/SKILL.md) + Child Refs: [LookML Quality Playbook](../lookml-reviewer/references/playbook_lookml_quality.md) & [Transcriber 0–4 Rubric](../lookml-reviewer/references/playbook_transcriber_scoring.md) | File/line LookML violations & 0–4 Transcriber maturity score |
| **3. BigQuery Compute & Storage Audit** | Query `INFORMATION_SCHEMA` (`JOBS_TIMELINE_BY_PROJECT`, `TABLE_STORAGE`, `JOBS_BY_PROJECT`) for slot saturation, RAM shuffle spills, unpartitioned tables over 10M rows, and rollup candidates | Child Ref: [BigQuery Compute Playbook (`bq-jobs-diagnostics`)](references/playbook_bigquery_compute.md) & [Warehouse Optimization Guide](references/warehouse_optimization.md) | Slot contention timeline, TB billed by model, and Partition/Cluster DDL |
| **4. Active LookML Tuning** | Surgically refactor slow LookML (ETL-triggered datagroups, PDT Cold-Start materialization, Aggregate Awareness rollups, parallel SQL `EXPLAIN` profiling) | [`looker-performance-optimizer`](../looker-performance-optimizer/SKILL.md) + [Aggregate Awareness Guide](references/aggregate_awareness_and_architecture.md) | Validated LookML diffs & measured query runtime delta |
| **5. Executive TDD Compilation** | Synthesize all 3 pillars into a 0–100% scored **Technical Design Document (TDD)** with phased migration roadmap | Child Refs: [TDD Playbook](references/playbook_technical_design_document.md) & [Master Scoring Rubric](references/scoring_master_rubric.md) | `TECHNICAL_DESIGN_DOCUMENT.md` |

---

## Critical Behavioral Directives

1. **Prerequisite Check (`looker-base`)**: If the Looker MCP tools or `looker-cli` aren't available, ask the user to install `looker-base` (and consult `looker-cli-setup` / `looker-cli-auth`).
2. **Reality Mapping First**: Confirm the target Looker profile/instance, LookML project name, and BigQuery project/region (`region-us`, `region-eu`, etc.) before running diagnostic queries.
3. **Read-Only Audit & Surgical Modification**: Never execute destructive commands (`delete`, `drop`, `truncate`) or create unrequested Git branches. When proposing or applying LookML fixes, perform surgical block edits without rewriting entire files.
4. **Avoid Limit Truncation**: When running System Activity inline queries with a `limit`, always run a companion `.count` query or pipe un-limited IDs to `jq 'length'` to report exact totals.

---

## Step 0: Pre-flight CLI & Pulse Verification

1. **Verify `looker-cli` & Authentication**:
   ```bash
   which looker-cli && looker-cli user me
   ```
2. **Verify `bq` CLI Access**:
   ```bash
   which bq && gcloud config get-value project
   ```
3. **Rapid Health Pulse Pre-Check**:
   ```bash
   looker-cli health pulse dashboard-performance && looker-cli health pulse explore-performance
   ```

---

## The 5-Vector Diagnostic Protocol

### Vector 1: Latency Phase Decomposition (Pillar 1 — Looker Performance)
Run the operational checklist in [`looker-audit`](../looker-audit/SKILL.md), then deconstruct query duration via `system__activity/query_metrics` using `looker-cli api query run_inline_query json -`:
1. **Looker JVM Overhead %**: `(async_processing - (execute_main_query + acquire_connection)) / async_processing * 100` (Target: `< 20%`).
2. **Database Execution Time**: `execute_main_query_average` (Target: `< 5.0s`).
3. **Connection Queue Wait**: `acquire_connection_average` (Target: `< 0.25s`).
* Child References (`looker-performance-auditor`): [Looker Performance Playbook](references/playbook_looker_performance.md), [Query Latency Breakdown](references/query_latency_breakdown.md), [System Activity Queries](references/system_activity_queries.md), [Query Outliers Diagnosis](references/query_outliers_diagnosis.md), [History Query Analysis](references/history_query_analysis.md), [Performance Benchmarks](references/benchmarks.md), [Looker Performance Scoring](references/scoring_looker_performance.md)

### Vector 2: SUM(DISTINCT) Fanout & LookML Integrity (Pillar 2 — LookML Quality)
Delegate code review to [`lookml-reviewer`](../lookml-reviewer/SKILL.md) via `looker-cli project file ls <project_id>` and `looker-cli project file cat <project_id> <file_path>`:
* Check every joined view for `primary_key: yes` to prevent `SUM(DISTINCT)` symmetric aggregate subqueries.
* Verify explicit `relationship:` definitions, masked keys (`hidden: yes`), and field descriptions for Gemini in Looker.
* Validate compiler health via `looker-cli project validate <project_id>` and score on the 0–4 Transcriber rubric.
* Child References: [LookML Quality Playbook](../lookml-reviewer/references/playbook_lookml_quality.md), [Transcriber 0–4 Scoring Rubric](../lookml-reviewer/references/playbook_transcriber_scoring.md), [Conversational Analytics Best Practices](../lookml-reviewer/references/conversational-analytics-best-practices.md), [LookML Quality Scoring](references/scoring_lookml_quality.md), [Henry Dead Field Pruning](references/henry_command_guide.md), [Merged Queries Remediation](references/merged_queries_remediation.md), [PDT Failure Event Log](references/pdt_failure_event_log.md), [Spectacles CI Setup](references/spectacles_ci_setup.md), [Legacy Runtime Checklist](references/legacy_runtime_checklist.md), [Runtime Migration Recipe](references/runtime_migration_recipe.md), [Content Validation Recipe](references/content_validation_recipe.md), [House Keeping Recipe](references/house_keeping_recipe.md)

### Vector 3: BigQuery Slot Saturation & Spills (Pillar 3 — BigQuery Compute)
Execute `INFORMATION_SCHEMA` queries directly via `bq query --use_legacy_sql=false --format=prettyjson "<SQL>"`:
* Check `JOBS_TIMELINE_BY_PROJECT` for `period_slot_ms`, `period_estimated_runnable_units` (queued queries), and `period_shuffle_ram_usage_ratio` (disk spills).
* Check `TABLE_STORAGE` for fact tables over 10M rows lacking date partitioning or clustering, and `JOBS_BY_PROJECT` for bytes billed by Looker model (`looker-context-history_slug`).
* Child References (`bq-jobs-diagnostics`): [BigQuery Compute Playbook](references/playbook_bigquery_compute.md), [Warehouse Optimization Guide](references/warehouse_optimization.md), [Slot Consumption Timeline](references/slot_consumption_timeline.md), [Table Partition DDL](references/table_partition_ddl.md), [Bytes Billed by Model](references/bytes_billed_by_model.md), [BigQuery Compute Scoring](references/scoring_bigquery_compute.md), [BigQuery Search Indexes](references/bigquery_search_indexes.md)

### Vector 4: Aggregate Awareness, PDTs & Acceleration (Pillar 3 & Active Tuning)
* Identify high-frequency explore queries scanning over 10M rows repeatedly and prescribe LookML `aggregate_table` rollups, Incremental PDTs, and BI Engine sizing.
* Delegate active LookML refactoring and parallel `EXPLAIN` profiling to [`looker-performance-optimizer`](../looker-performance-optimizer/SKILL.md).
* Child References: [Aggregate Awareness & Architecture](references/aggregate_awareness_and_architecture.md), [BI Engine Optimization](references/bi_engine_optimization.md), [Incremental PDTs Guide](references/incremental_pdts_guide.md), [Looker-BigQuery Pipeline Architecture](references/looker_bigquery_pipeline_architecture.md)

### Vector 5: Concurrency Bursts, Auto-Refresh & Governance (Pillar 1 — Governance)
* Cross-reference [`looker-audit`](../looker-audit/SKILL.md) findings on dashboards with over 25 tiles, over 2 dynamic fields per tile, aggressive auto-refresh (`< 30` min), and top-of-hour (`:00`) cron schedules, plus CI/CD and RBAC security posture.
* Child References: [Content Governance Playbook](references/playbook_content_governance.md), [Large Dashboards Optimization](references/large_dashboards_optimization.md), [Single Dashboard Optimization](references/single_dashboard_optimization.md), [Scheduled Content Staggering](references/content_delivery_schedules.md), [Development Workflows & CI](references/development_workflows_and_ci.md), [Security Roles & Access Control](references/security_roles_and_access_control.md)

---

## Deliverable: Technical Design Document (TDD)

Synthesize all findings into `TECHNICAL_DESIGN_DOCUMENT.md` across 7 standard sections:
1. **Executive Summary & Modernization Objectives** (Baseline 0–100% score & target SLAs)
2. **Current State Architecture & Forensic Telemetry**
3. **Target State Architecture & Data Flow** (Mermaid diagram)
4. **Pillar 1 Technical Design (Looker Performance & Content Governance)**
5. **Pillar 2 Technical Design (LookML Modeling & Code Quality — Surgical Diffs)**
6. **Pillar 3 Technical Design (BigQuery Engine & Partition/Cluster DDL)**
7. **Phased Migration Roadmap, Risk Matrix & Projected ROI**

* Child References: [TDD Playbook](references/playbook_technical_design_document.md), [Master Scoring Rubric](references/scoring_master_rubric.md), [Healthcheck Delivery Guide](references/playbook_healthcheck_delivery.md)

