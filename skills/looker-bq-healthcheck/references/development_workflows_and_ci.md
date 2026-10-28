---
type: Reference
title: Development Workflows, Governance & CI/CD Guide
description: 3-Tier Maturity Framework, LookML data test protocols, and automated CI/CD pipelines for LookML engineering governance.
tags: [lookml, ci-cd, data-tests, git, governance, spectacles]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: vendor-testing-suite
    resource: /skills/vendor/looker-skills/skills/looker-architect/references/testing_suite.md
    title: LookML Testing Suite
---

# Development Workflows, Governance & CI/CD Playbook

This reference document defines the **3-Tier Maturity Framework**, **LookML Data Test Protocols**, and **Automated CI/CD Pipelines** for establishing robust LookML engineering governance.

---

## 🔍 Part 1: How to Review & Diagnose Development Workflows

### 1. The 3-Tier Maturity Framework

```
                           THE 3-TIER MATURITY FRAMEWORK
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ Tier 1: Git & Reviews     │ Tier 2: Automated Testing │ Tier 3: Multi-Stage QA    │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • Protected Main Branch   │ • Native LookML Data Tests│ • Multi-Instance Release: │
 │ • Mandatory Pull Requests │ • CI Content Validation   │   Dev -> QA -> Production │
 │ • Branch Naming Standards │ • Automated LookML Linter │ • Automated Spectacles CI │
 │ • Peer Review Checklists  │ • Pre-Merge Gateways      │ • Zero Downtime Deploys   │
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

### 2. Common Governance Anti-Patterns & Risk Audit

| Governance Anti-Pattern | Risk Level | Diagnostic Observation |
| :--- | :---: | :--- |
| **Direct Commits to Main** | **CRITICAL** | Developers push unreviewed changes directly to production, causing immediate syntax breaks. |
| **No Automated Testing** | **HIGH** | Absence of `tests/*.test.lkml` allows silent logic regressions in revenue or tax calculations. |
| **Untested Content Changes** | **HIGH** | Renaming/deleting a LookML field breaks downstream production dashboards without warning. |

---

## 🛠️ Part 2: How to Rectify & Enforce CI/CD Governance

### Tier 1: Enforcing Git Branch Protection & Peer Reviews
1. In your Git provider (GitHub / GitLab), enable **Branch Protection** on `main` / `production`.
2. Require at least **1 approving review** from a Senior LookML Developer before merging.

---

### Tier 2: Declaring Native LookML Unit Data Tests
Create `tests/model_integrity.test.lkml` to automatically verify data invariants:

```lookml
# tests/model_integrity.test.lkml

# 1. Primary Key Uniqueness Test
test: assert_orders_primary_key_unique {
  explore_source: orders {
    column: order_id { field: orders.id }
    column: order_count { field: orders.count }
    sorts: [orders.count: desc]
    limit: 5
  }
  assert: primary_key_has_no_duplicates {
    expression: ${orders.count} = 1 ;;
  }
  assert: primary_key_is_not_null {
    expression: NOT is_null(${orders.id}) ;;
  }
}

# 2. Revenue Invariant Test
test: assert_total_revenue_non_negative {
  explore_source: orders {
    column: total_revenue { field: orders.total_revenue }
    filters: {
      field: orders.status
      value: "complete"
    }
  }
  assert: revenue_is_positive {
    expression: ${orders.total_revenue} >= 0 ;;
  }
}
```

---

### Tier 3: Automated GitHub Actions CI/CD Pipeline
Create `.github/workflows/looker_ci.yml` to automatically validate all pull requests before merging:

```yaml
name: LookML Quality Assurance CI

on:
  pull_request:
    branches: [ main, production ]

jobs:
  validate-lookml:
    name: LookML Compiler & Test Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run LookML Validation via Looker CLI
        env:
          LOOKERSDK_BASE_URL: ${{ secrets.LOOKERSDK_BASE_URL }}
          LOOKERSDK_CLIENT_ID: ${{ secrets.LOOKERSDK_CLIENT_ID }}
          LOOKERSDK_CLIENT_SECRET: ${{ secrets.LOOKERSDK_CLIENT_SECRET }}
        run: |
          pip install google-adk requests
          python -c "from agent.tools.dynamic_cli import looker_cli_execute; print(run_lookml_validation())"
```
