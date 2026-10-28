---
type: Playbook
title: Master Healthcheck 30-Check Scoring Standard & Mathematical Formulation
description: Unified Google Cloud PSO multi-pillar scoring methodology, mathematical formulas, and 30-check evaluation standards.
tags: [scoring, master, methodology, rubric, benchmarks, pso, multi-pillar, evaluation]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-31T10:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-31T10:00:00Z" }
sources:
  - id: p1-scoring
    resource: /skills/looker_performance/playbooks/scoring_looker_performance.md
    title: Pillar 1 Looker Performance Scoring
  - id: p2-scoring
    resource: /skills/lookml_quality/playbooks/scoring_lookml_quality.md
    title: Pillar 2 LookML Quality Scoring
  - id: p3-scoring
    resource: /skills/bigquery_compute/playbooks/scoring_bigquery_compute.md
    title: Pillar 3 BigQuery Compute Scoring
---

# 🏆 Master Healthcheck 30-Check Scoring Standard

This master playbook establishes the unified scoring architecture across all **3 Healthcheck Pillars** (30 automated checks).

---

## 🗺️ 1. Complete Symmetrical Scoring Directory Map

```
skills/
├── shared/
│   └── playbooks/
│       └── scoring_master_rubric.md          ◄── MASTER SCORING STANDARD (This Document)
│
├── looker_performance/
│   └── playbooks/
│       └── scoring_looker_performance.md     ◄── PILLAR 1 SCORING (Checks P1-01 to P1-10)
│
├── lookml_quality/
│   └── playbooks/
│       └── scoring_lookml_quality.md         ◄── PILLAR 2 SCORING (Checks P2-11 to P2-20)
│
└── bigquery_compute/
    └── playbooks/
        └── scoring_bigquery_compute.md       ◄── PILLAR 3 SCORING (Checks P3-21 to P3-30)
```

---

## 🧮 2. Mathematical Scoring Formulation

### A. Micro-Check Point Assignment:
Every check receives one of three standardized outcomes:
* ✅ **`PASSED`**: **100 points** (Meets or exceeds Google Cloud PSO standards).
* ⚠️ **`WARNING`**: **50 points** (Sub-optimal implementation; performance degradation risk).
* ❌ **`CRITICAL / FAIL`**: **0 points** (Active bottleneck; severe compute cost or query timeout).

### B. Pillar Score Calculation (0–100):
$$\text{Pillar Score} = \frac{\sum_{i=1}^{10} \text{Check Score}_i}{10}$$

### C. Overall Instance Health Score (0–100):
$$\text{Overall Health Score} = \frac{\text{Pillar 1 Score} + \text{Pillar 2 Score} + \text{Pillar 3 Score}}{3}$$

---

## 🏆 3. Executive Health Grade Thresholds

| Overall Score | Grade | Executive Meaning | Recommended Action |
| :---: | :---: | :--- | :--- |
| **`90 – 100`** | **A (Exemplary)** | Production-hardened enterprise architecture. | Regular monthly drift monitoring. |
| **`75 – 89`** | **B+ (Good)** | Minor optimization potential; low risk. | Implement minor field cleanups. |
| **`60 – 74`** | **B- (Fair)** | **Optimization Recommended**; moderate compute cost. | Deploy partitioning & primary key fixes. |
| **`< 60`** | **F (Critical)** | **Critical Action Required**; slot starvation risk. | Execute TDD remediation immediately. |
