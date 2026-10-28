---
type: Playbook
title: Pillar 2 LookML Modeling Quality & Architecture Scoring Rubric
description: Authoritative 0–100 scoring criteria, AST inspection rules, and point deduction standards for Pillar 2 (Checks P2-11 to P2-20).
tags: [scoring, pillar-2, lookml, modeling, code-quality, primary-keys, ast]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-31T10:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-31T10:00:00Z" }
sources:
  - id: transcriber-scoring
    resource: /skills/lookml_quality/playbooks/playbook_transcriber_scoring.md
    title: LookML Transcriber Scoring Rubric
  - id: master-scoring
    resource: /skills/shared/playbooks/scoring_master_rubric.md
    title: Master Healthcheck Scoring Standard
---

# 🧬 Pillar 2: LookML Modeling Quality & Architecture Scoring Rubric

This playbook establishes the exact scoring criteria and point deduction thresholds for **Pillar 2** (Checks `P2-11` through `P2-20`).

---

## 📊 1. Pillar 2 Evaluation Matrix

| Check ID | Diagnostic Focus | Target / Passing (100 pts) | Warning (50 pts) | Failing / Critical (0 pts) |
| :--- | :--- | :--- | :--- | :--- |
| **`P2-11`** | **LookML Syntax & Compiler Health** | 0 compiler warnings or validation errors | Deprecation notices only | LookML validation errors breaking explores |
| **`P2-12`** | **Primary Key Integrity** | `primary_key: yes` declared on 100% of joined views | Declared on fact views, missing on 1 dimension view | Missing primary keys on fact/joined views (forcing `SUM_DISTINCT`) |
| **`P2-13`** | **Explicit Join Cardinality** | `relationship: many_to_one` declared explicitly | Missing relationship on 1–2 minor views | Missing `relationship:` on one-to-many joins (fanout risk) |
| **`P2-14`** | **Dead Field Detection (Henry Vacuum)** | Clean field catalog (0 unreferenced fields) | $< 10\%$ unreferenced fields | $> 30\%$ dead fields cluttering context window and UI |
| **`P2-15`** | **Masked Technical Foreign Keys** | Raw IDs, surrogate keys, and hashes set to `hidden: yes` | Unhidden IDs in developer explores | Raw foreign keys (`user_id`, `session_id`) exposed to end users |
| **`P2-16`** | **Modular File & Folder Hygiene** | Dedicated `/explores`, `/views`, `/models` directories | Minor view file clutter in root | Monolithic 5,000-line model files mixing views and explores |
| **`P2-17`** | **Standard snake_case Naming** | 100% identifiers adhere to clean `snake_case` | 1–2 camelCase or capitalized dimensions | Inconsistent naming conventions across core metrics |
| **`P2-18`** | **User-Facing Field Descriptions** | 100% of business measures & dimensions have descriptions | $50 - 80\%$ description coverage | Missing descriptions on core business KPIs |
| **`P2-19`** | **Explore Field Picker Capping** | Explores expose $\le 50\text{ fields}$ via `fields: []` | Explores expose $50 - 100\text{ fields}$ | Massive 200+ field explores overwhelming users and AI agents |
| **`P2-20`** | **Table Calculation Pushdown** | Calculations pushed down to native SQL/LookML | Minor simple UI table calculations | Heavy table calculations executing in browser memory |

---

## 🧮 2. Pillar 2 Score Calculation

$$\text{Pillar 2 Score} = \frac{\sum_{i=11}^{20} \text{Score}(\text{P2-}i)}{10}$$

* **Score $\ge 90$**: **Exemplary** (100% primary keys, explicit relationships, full description coverage, clean AST).
* **Score $75 - 89$**: **Healthy** (Minor field masking or dead field vacuuming recommended).
* **Score $60 - 74$**: **Warning** (Missing primary keys or unmasked foreign keys).
* **Score $< 60$**: **Critical Action Required** (Fanout join risks or broken LookML validation).
