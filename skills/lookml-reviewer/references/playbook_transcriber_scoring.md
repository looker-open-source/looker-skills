---
type: Playbook
title: LookML Model Review & Transcriber Scoring Rubric
description: Official 0–4 evaluation rubric across LookML Modeling Quality, End-User Experience, Architecture & PDTs, and Governance & Testing.
tags: [transcriber, scoring-rubric, evaluation, lookml, governance]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: benchmarks
    resource: /skills/custom/healthcheck/references/benchmarks.md
    title: Google Cloud PSO Latency Benchmarks
  - id: dev-workflows
    resource: /skills/custom/healthcheck/references/development_workflows_and_ci.md
    title: Development Workflows & CI/CD
---

# LookML Model Review & Transcriber Scoring Rubric

## 1. Objective & Purpose
Evaluate LookML codebases against the official **Transcriber Framework** (0–4 grading scale across 4 Focus Dimensions) to assess modeling hygiene, end-user usability, architecture scalability, and data governance.

```
                           THE 4 TRANSCRIBER DIMENSIONS
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ Dimension 1:              │ Dimension 2:              │ Dimension 3:              │ Dimension 4:              │
 │ LookML Modeling Quality   │ End-User Experience       │ Architecture & Scale      │ Governance & Testing      │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • Primary Keys Declared   │ • Raw Foreign Keys Hidden │ • Event Datagroup Caching │ • LookML Data Tests       │
 │ • Explicit Relationships  │ • User Descriptions       │ • Incremental PDT Keys    │ • Mandatory Pull Requests │
 │ • Clean snake_case Naming │ • Drill Fields Configured │ • Aggregate Awareness     │ • GBAC Group Permissions  │
 │ • DRY Dimension / Measure │ • Group Labels & View Sets│ • Hub & Spoke Modularity  │ • CI/CD Automated Checks  │
 └───────────────────────────┴───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## 2. The Transcriber 0–4 Evaluation Grading Rubric

| Score | Rating | Definition & Observable Criteria |
| :---: | :--- | :--- |
| **`0`** | **Unsatisfactory** | Project violates core fundamentals: Missing primary keys on joined views (causing fanout multiplication), raw unhidden surrogate keys exposed to business users, monolithic 5,000-line model files, no datagroups configured. |
| **`1`** | **Needs Improvement** | Partial compliance: Fact views declare primary keys, but dimension views lack them; arbitrary `persist_for: "24 hours"` on explores; ~50% of fields lack descriptions; users report confusing field pickers. |
| **`2`** | **Meets Expectations** *(Baseline)* | Adheres to best practices ~85–90% of the time: All joined views have `primary_key: yes` and explicit `relationship:` declarations; snake_case naming enforced; major explores use datagroups; basic descriptions on core measures. |
| **`3`** | **Exceeds Expectations** | Consistent engineering rigor: 100% field description coverage; comprehensive `drill_fields:` on all measures; `group_label` used for multi-currency or date dimensions; `fields: []` used to cap explores at 40–50 fields; pull requests enforced. |
| **`4`** | **Exceptional** | State-of-the-art enterprise LookML: Dynamic Aggregate Awareness tables (`aggregate_table`) accelerating queries to < 1s; automated CI/CD pipeline running LookML tests on every commit; Hub & Spoke modular project imports; strict Group-Based Access Control (GBAC). |

---

## 3. Deep-Dive Dimension Audit Checklist

### Dimension 1: LookML Modeling Quality (Weight: 30%)
- [ ] **Primary Key Integrity**: Every view joined into an explore has exactly one dimension declared with `primary_key: yes`.
- [ ] **Explicit Join Relationships**: Every `join:` block explicitly specifies `relationship: many_to_one`, `one_to_many`, or `one_to_one`.
- [ ] **Symmetric Aggregation Safety**: Measures never aggregate fields from joined views without proper primary keys.
- [ ] **Clean Syntax & Casing**: All identifiers adhere strictly to `snake_case` (no capital letters or hyphens in dimension/measure names).

### Dimension 2: End-User Experience & Usability (Weight: 25%)
- [ ] **Technical Key Masking**: Raw foreign keys, surrogate keys, and hash IDs are marked `hidden: yes`.
- [ ] **Field Descriptions**: All business measures and dimensions declare clear, human-readable `description:` strings.
- [ ] **Visual Drill Paths**: Every core KPI measure provides actionable `drill_fields:` linking to detail views.
- [ ] **Field Picker Hygiene**: Explores limit exposed fields to 40–50 through `fields: [ALL_FIELDS*, -unneeded_view*]`.
- [ ] **Logical Grouping**: Date dimensions and related metrics use `group_label:` and `group_item_label:`.

### Dimension 3: Enterprise Architecture & PDT Performance (Weight: 25%)
- [ ] **Centralized Datagroups**: Explores and PDTs inherit caching policies from ETL-triggered `datagroup` definitions.
- [ ] **Incremental PDT Strategy**: Tables exceeding 10M rows define `increment_key:` and `increment_offset:`.
- [ ] **Aggregate Table Rollups**: High-traffic dashboards utilize `aggregate_table:` to serve summary metrics from compact rollups.
- [ ] **Modular File Hierarchy**: Explores, views, and models reside in dedicated `/explores`, `/views`, `/models` directories.

### Dimension 4: Data Governance & Development Culture (Weight: 20%)
- [ ] **LookML Data Tests**: Automated unit tests declared in `tests/*.test.lkml` verifying primary key uniqueness and business invariants.
- [ ] **Git PR Review Process**: Direct merging to `production` is blocked; peer review required on feature branches.
- [ ] **Group-Based Access Control (GBAC)**: Permissions and roles assigned exclusively to SAML/SSO synchronized groups.
- [ ] **Automated CI Validation**: `looker-cli project validate` or Spectacles integrated into GitHub Actions / GitLab CI.

---

## 4. Code Comparison: Score 0 (Unsatisfactory) vs. Score 4 (Exceptional)

### ❌ Score 0 Anti-Pattern
```lookml
# Monolithic, missing primary keys, unhidden IDs, no descriptions, static caching
explore: orders {
  persist_for: "4 hours"
  join: users {
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
}

view: orders {
  sql_table_name: raw_data.orders ;;
  dimension: id { type: number sql: ${TABLE}.id ;; } # Missing primary_key: yes!
  dimension: user_id { type: number sql: ${TABLE}.user_id ;; } # Exposed to users!
  measure: revenue { type: sum sql: ${TABLE}.sale_price ;; } # Missing description & formatting!
}
```

### ✅ Score 4 Exceptional Standard
```lookml
# Modular explore with Datagroup caching, explicit cardinality, aggregate table
explore: orders {
  persist_with: warehouse_etl_daily_datagroup
  description: "Core e-commerce transactions explore powered by daily ETL refresh."
  
  join: users {
    relationship: many_to_one
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
  
  aggregate_table: rollup__daily_sales {
    query: {
      dimensions: [orders.created_date, users.country]
      measures: [orders.total_revenue, orders.count]
    }
    materialization: {
      datagroup_trigger: warehouse_etl_daily_datagroup
    }
  }
}

view: orders {
  sql_table_name: `project.dataset.orders` ;;
  
  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
    description: "Unique order identifier (Primary Key)."
  }
  
  dimension: user_id {
    hidden: yes
    type: number
    sql: ${TABLE}.user_id ;;
  }
  
  measure: total_revenue {
    type: sum
    sql: ${TABLE}.sale_price ;;
    value_format_name: usd
    description: "Total gross merchandise value from completed customer orders."
    drill_fields: [id, users.name, created_date, total_revenue]
  }
}
```

---

## 5. Transcriber Scoring Calculator Formula

$$ \text{Final Transcriber Score} = (0.30 \times S_{\text{Modeling}}) + (0.25 \times S_{\text{UX}}) + (0.25 \times S_{\text{Architecture}}) + (0.20 \times S_{\text{Governance}}) $$

* **Overall Score $\ge 3.50$**: **Class A (Enterprise Ready)**
* **Overall Score $2.50 - 3.49$**: **Class B (Production Stable)**
* **Overall Score $1.50 - 2.49$**: **Class C (Optimization Required)**
* **Overall Score $< 1.50$**: **Class D (Immediate Technical Remediation Needed)**
