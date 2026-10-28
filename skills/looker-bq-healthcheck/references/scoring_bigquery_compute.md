---
type: Playbook
title: Pillar 3 BigQuery Engine & Compute Optimization Scoring Rubric
description: Authoritative 0–100 scoring criteria, storage layout standards, slot utilization curves, and point deduction standards for Pillar 3 (Checks P3-21 to P3-30).
tags: [scoring, pillar-3, bigquery, compute, slots, partitioning, clustering]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-31T10:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-31T10:00:00Z" }
sources:
  - id: bq-optimization
    resource: /skills/bigquery_compute/references/warehouse_optimization.md
    title: BigQuery Warehouse Optimization Reference
  - id: master-scoring
    resource: /skills/shared/playbooks/scoring_master_rubric.md
    title: Master Healthcheck Scoring Standard
---

# ⚡ Pillar 3: BigQuery Engine & Compute Optimization Scoring Rubric

This playbook establishes the exact scoring criteria and point deduction thresholds for **Pillar 3** (Checks `P3-21` through `P3-30`).

---

## 📊 1. Pillar 3 Evaluation Matrix

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P3-21`** | **Table Partitioning & Clustering** | 100% of large fact tables partitioned by date & clustered | Partitioned without cluster keys | **Unpartitioned fact tables** (>10M rows) |
| **`P3-22`** | **BI Engine In-Memory Acceleration** | BI Engine memory allocated targeting hot fact tables | Memory allocated but $< 50\%$ hit rate | No BI Engine reservation configured |
| **`P3-23`** | **PDT Build Failures & Event Log** | Zero PDT build failures in past 7 days | 1–2 intermittent PDT timeouts | Cascading PDT build failures blocking dashboards |
| **`P3-24`** | **Warehouse Slot Contention** | Slot usage $< 500\text{ slots}$; 0 queue wait | Peak slot usage $500 - 1,500\text{ slots}$ | Slot starvation ($> 2,000\text{ slots}$); queries throttled |
| **`P3-25`** | **Query Memory & Shuffle Spills** | 0 memory spills (Executed fully in memory) | Minor memory disk spill | Severe stage shuffle spill to disk |
| **`P3-26`** | **Query Cost & Bytes Billed** | Scans pruned by partition filter ($< 100\text{ MB}$) | Queries scanning $100\text{ MB} - 1.0\text{ GB}$ | Unbounded full scans ($> 3.0\text{ GB / run}$) |
| **`P3-27`** | **Aggregate Awareness Acceleration** | High-traffic explores route to `aggregate_table` | Partial rollup matching | All queries scan raw un-aggregated fact tables |
| **`P3-28`** | **BigQuery Text Search Indexes** | Text search uses `SEARCH()` with search indexes | Standard `LIKE` / `REGEXP_CONTAINS` | Regex joins forcing Cartesian cross scans |
| **`P3-29`** | **Long Running Query Thread Health** | All interactive queries complete in $< 10\text{s}$ | Queries run between $10 - 30\text{s}$ | Zombie queries stalling threads for $> 60\text{s}$ |
| **`P3-30`** | **Unpartitioned Full Table Scans** | Semantic layer enforces partition filters | Manual filters only | Explores allow unbounded historical full scans |

---

## 🧮 2. Pillar 3 Score Calculation

$$\text{Pillar 3 Score} = \frac{\sum_{i=21}^{30} \text{Score}(\text{P3-}i)}{10}$$

* **Score $\ge 90$**: **Exemplary** (100% partitioned fact tables, BI Engine accelerated, <500 slots consumed).
* **Score $75 - 89$**: **Healthy** (Minor clustering or PDT timing adjustments recommended).
* **Score $60 - 74$**: **Warning** (Unpartitioned scans or moderate slot contention).
* **Score $< 60$**: **Critical Action Required** (Severe slot starvation or multi-gigabyte unpartitioned scans).
