---
name: looker-bq-healthcheck
description: >-
  Audits a Looker instance, LookML codebase, and BigQuery warehouse end-to-end across
  3 pillars (System Activity query latency phases, LookML 0-4 Transcriber rubric and
  SUM_DISTINCT fanouts, and BigQuery INFORMATION_SCHEMA slot contention/spills) to
  compile an executive Technical Design Document (TDD). Use when running an instance
  healthcheck, auditing dashboard/explore latency, checking BigQuery slot starvation,
  or generating a remediation TDD. Don't use for general Looker onboarding, creating
  new dashboards from scratch, or dialect migrations.
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

# Looker & BigQuery 3-Pillar Healthcheck

This orchestrator skill guides an agent to execute an end-to-end, 3-pillar diagnostic healthcheck across a Looker instance, its LookML project, and its Google Cloud BigQuery warehouse.

It correlates telemetry across **Looker System Activity**, **LookML code semantics**, and **BigQuery INFORMATION_SCHEMA**, compiling a **Technical Design Document (TDD)** with a 0–100% health score:
* **Pillar 1 (Looker Performance & Governance)**: Query phase breakdown, JVM vs. DB overhead, tile bloat (over 25 tiles), datagroup caching, and schedule staggering.
* **Pillar 2 (LookML Modeling & Quality)**: 0–4 Transcriber rubric, primary key integrity (eliminating `SUM(DISTINCT)` fanouts), explicit joins, and Conversational Analytics readiness (delegates code review to `lookml-reviewer`).
* **Pillar 3 (BigQuery Compute & Storage)**: Slot contention curves, memory/disk shuffle spills, partition/cluster DDL, and Aggregate Awareness rollups.

---

## When to Use This Skill

Activate this skill when the user asks to:
* *"Run a healthcheck or audit on our Looker instance / model"*
* *"Audit slow dashboards or slow queries (over 10s–30s) across Looker and BigQuery"*
* *"Score our LookML project on the 0–4 Transcriber rubric or check for symmetric aggregate fanouts"*
* *"Check BigQuery slot starvation, unpartitioned table scans, or query costs from Looker"*
* *"Generate an executive Technical Design Document (TDD) or remediation roadmap"*

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
Deconstruct query duration via `system__activity/query_metrics` using `looker-cli api query run_inline_query json -`:
1. **Looker JVM Overhead %**: `(async_processing - (execute_main_query + acquire_connection)) / async_processing * 100` (Target: `< 20%`).
2. **Database Execution Time**: `execute_main_query_average` (Target: `< 5.0s`).
3. **Connection Queue Wait**: `acquire_connection_average` (Target: `< 0.25s`).
* References: [Looker Performance Playbook](references/playbook_looker_performance.md), [Query Latency Breakdown](references/query_latency_breakdown.md), [System Activity Queries](references/system_activity_queries.md), [Query Outliers Diagnosis](references/query_outliers_diagnosis.md)

### Vector 2: SUM(DISTINCT) Fanout & LookML Integrity (Pillar 2 — LookML Quality)
Inspect LookML files directly via `looker-cli project file ls <project_id>` and `looker-cli project file cat <project_id> <file_path>` (or delegate to `lookml-reviewer`):
* Check every joined view for `primary_key: yes` to prevent `SUM(DISTINCT)` symmetric aggregate subqueries.
* Verify explicit `relationship:` definitions, masked keys (`hidden: yes`), and field descriptions for Gemini in Looker.
* Validate compiler health via `looker-cli project validate <project_id>`.
* References: [LookML Quality Playbook](references/playbook_lookml_quality.md), [Transcriber 0–4 Scoring Rubric](references/playbook_transcriber_scoring.md), [Conversational Analytics Best Practices](references/conversational_analytics_best_practices.md), [Henry Dead Field Pruning](references/henry_command_guide.md)

### Vector 3: BigQuery Slot Saturation & Spills (Pillar 3 — BigQuery Compute)
Execute `INFORMATION_SCHEMA` queries directly via `bq query --use_legacy_sql=false --format=prettyjson "<SQL>"`:
* Check `JOBS_TIMELINE_BY_PROJECT` for `period_slot_ms`, `period_estimated_runnable_units` (queued queries), and `period_shuffle_ram_usage_ratio` (disk spills).
* Check `TABLE_STORAGE` for fact tables over 10M rows lacking date partitioning or clustering.
* References: [BigQuery Compute Playbook](references/playbook_bigquery_compute.md), [Warehouse Optimization Guide](references/warehouse_optimization.md), [Slot Consumption Timeline](references/slot_consumption_timeline.md), [Table Partition DDL](references/table_partition_ddl.md)

### Vector 4: Aggregate Awareness & Acceleration (Pillar 3 — Rollups)
* Identify high-frequency explore queries scanning over 10M rows repeatedly and prescribe LookML `aggregate_table` rollups and BI Engine sizing.
* References: [Aggregate Awareness & Architecture](references/aggregate_awareness_and_architecture.md), [BI Engine Optimization](references/bi_engine_optimization.md)

### Vector 5: Concurrency Bursts, Auto-Refresh & Schedule Staggering (Pillar 1 — Governance)
* Audit dashboards with over 25 tiles, over 2 dynamic fields per tile, aggressive auto-refresh (`< 30` min), and top-of-hour (`:00`) cron schedules.
* References: [Content Governance Playbook](references/playbook_content_governance.md), [Large Dashboards Optimization](references/large_dashboards_optimization.md), [Scheduled Content Staggering](references/content_delivery_schedules.md)

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

* References: [TDD Playbook](references/playbook_technical_design_document.md), [Master Scoring Rubric](references/scoring_master_rubric.md), [Healthcheck Delivery Guide](references/playbook_healthcheck_delivery.md)
