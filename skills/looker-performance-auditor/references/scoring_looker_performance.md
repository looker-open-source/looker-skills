---
type: Playbook
title: Pillar 1 Looker Performance & Query Lifecycle Scoring Rubric
description: Authoritative 0–100 scoring criteria, latency thresholds, and point deduction standards for Pillar 1 (Checks P1-01 to P1-10).
tags: [scoring, pillar-1, looker-performance, latency, benchmarks, pso]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-31T10:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-31T10:00:00Z" }
sources:
  - id: benchmarks
    resource: /skills/looker_performance/references/benchmarks.md
    title: Google Cloud PSO Latency Benchmarks
  - id: master-scoring
    resource: /skills/shared/playbooks/scoring_master_rubric.md
    title: Master Healthcheck Scoring Standard
---

# 🏛️ Pillar 1: Looker Performance & Query Lifecycle Scoring Rubric

This playbook establishes the exact scoring criteria and point deduction thresholds for **Pillar 1** (Checks `P1-01` through `P1-10`).

---

## 📊 1. Pillar 1 Evaluation Matrix

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P1-01`** | **Query Latency Phase Breakdown** | Database runtime $< 2.0\text{s}$; JVM overhead $< 20\%$ | Latency $2.0 - 5.0\text{s}$; overhead $20 - 40\%$ | Average latency $> 10.0\text{s}$; overhead $> 50\%$ |
| **`P1-02`** | **Connection Pool Wait Time** | Queue wait $< 100\text{ms}$ | Queue wait $500\text{ms} - 2.0\text{s}$ | Connection pool queue starvation ($> 5.0\text{s}$) |
| **`P1-03`** | **Dashboard Query Density** | All dashboards $\le 25\text{ tiles}$ | Monolithic dashboards with $26 - 35\text{ tiles}$ | Extreme tile bloat ($> 35\text{ tiles}$) causing JVM stalls |
| **`P1-04`** | **Auto-Refresh Rate Limits** | Auto-refresh $\ge 30\text{ minutes}$ | Auto-refresh between $15 - 30\text{ minutes}$ | Aggressive auto-refresh ($< 15\text{ minutes}$) |
| **`P1-05`** | **Schedule Time Staggering** | Cron schedules distributed off-peak (e.g. `:07`, `:22`) | Minor clustering around `:15` or `:30` | Top-of-Hour pileup (`:00` cron stampede) |
| **`P1-06`** | **Concurrency Peaks & Queue Depths** | Smooth concurrency profile; zero thread throttling | Peak concurrent queries $20 - 30$ | Server-wide query thread exhaustion |
| **`P1-07`** | **Stale / Unused Dashboard Inventory** | Zero unviewed content in $> 90\text{ days}$ | 1–5 stale dashboards | Massive unused content bloat (>10 unviewed dashboards) |
| **`P1-08`** | **Unfiltered Dashboard Queries** | Enforce required filters on fact explores | Optional filters on large fact explores | Unbounded historical queries executing without filters |
| **`P1-09`** | **In-Memory Merged Queries** | Zero in-memory merge queries in production | Small merges ($< 1,000\text{ rows}$) | Massive in-memory joins ($> 10,000\text{ rows}$) in JVM |
| **`P1-10`** | **Datagroup ETL Synchronization** | Explores inherit ETL watermark SQL triggers | Static `persist_for` intervals | Volatile cache (`GENERATE_UUID()`) or default 24h |

---

## 🧮 2. Pillar 1 Score Calculation

$$\text{Pillar 1 Score} = \frac{\sum_{i=1}^{10} \text{Score}(\text{P1-0}i)}{10}$$

* **Score $\ge 90$**: **Exemplary** (Sub-second dashboards, optimal ETL cache, zero thread queues).
* **Score $75 - 89$**: **Healthy** (Minor schedule staggering or tile splitting recommended).
* **Score $60 - 74$**: **Warning** (Noticeable latency lag or dashboard tile bloat).
* **Score $< 60$**: **Critical Action Required** (Severe JVM memory pressure or query queue pileup).
