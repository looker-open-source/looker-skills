# Development Workflows, Governance & CI/CD Playbook

This master playbook defines the **3-Tier Development Maturity Framework**, **LookML Data Test Protocols**, **Automated CI/CD Pipelines**, and **Modern Runtime Standards** for establishing enterprise LookML engineering governance.

---

## 🔍 1. The 3-Tier Maturity Framework

```
                           THE 3-TIER MATURITY FRAMEWORK
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ Tier 1: Git & Reviews     │ Tier 2: Automated Testing │ Tier 3: Multi-Stage QA    │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • Protected Main Branch   │ • Native LookML Data Tests│ • Multi-Instance Release: │
 │ • Mandatory Pull Requests │ • CI Content Validation   │   Dev -> QA -> Production │
 │ • Branch Naming Standards │ • Pre-Merge Gateways      │ • Automated Spectacles CI │
 │ • Peer Review Checklists  │ • LookML Compiler Check   │ • Zero Downtime Deploys   │
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## 🛠️ 2. Declaring Native LookML Unit Data Tests

Automated data tests in LookML prevent logic regressions in core revenue, KPI, or join calculations:

```lookml
# tests/orders.test.lkml

# 1. Primary Key Uniqueness & Non-Null Test
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

# 2. Financial Measure Invariant Test
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

## 🚀 3. Automated CI/CD Pre-Merge Pipeline

Automate compiler validation and Content Validator scans in GitHub Actions (`.github/workflows/looker_ci.yml`):

```yaml
name: LookML Quality Assurance CI

on:
  pull_request:
    branches: [ main, production ]

jobs:
  validate-lookml:
    name: LookML Compiler & Content Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Install Looker CLI (GitHub Release Binary)
        run: |
          curl -sSL "https://github.com/looker-open-source/looker-cli/releases/latest/download/looker-cli_1.2.1_linux_amd64.tar.gz" | tar -xz -C /usr/local/bin looker-cli
          chmod +x /usr/local/bin/looker-cli

      - name: Validate LookML Project
        env:
          LOOKERSDK_BASE_URL: ${{ secrets.LOOKER_BASE_URL }}
          LOOKERSDK_CLIENT_ID: ${{ secrets.LOOKER_CLIENT_ID }}
          LOOKERSDK_CLIENT_SECRET: ${{ secrets.LOOKER_CLIENT_SECRET }}
        run: |
          looker-cli project validate "${{ secrets.LOOKER_PROJECT_ID }}" --port 443

      - name: Run Content Validator
        env:
          LOOKERSDK_BASE_URL: ${{ secrets.LOOKER_BASE_URL }}
          LOOKERSDK_CLIENT_ID: ${{ secrets.LOOKER_CLIENT_ID }}
          LOOKERSDK_CLIENT_SECRET: ${{ secrets.LOOKER_CLIENT_SECRET }}
        run: |
          looker-cli api content content_validation --project_names "${{ secrets.LOOKER_PROJECT_ID }}" --port 443
```

### Pre-Merge Gateway Checks:
1. **LookML Syntax**: `looker-cli project validate <project_id>` guarantees 0 syntax errors or broken include paths.
2. **Content Validator**: `looker-cli api content content_validation` compares the active development branch against production dashboards and catches broken tiles before merging.

---

## 📋 4. Modern LookML Runtime Standards

Modern LookML runtime enforces strict data integrity and Symmetric Aggregates:

| Legacy Parameter | Modern Replacement | Rationale & Modern Standard |
| :--- | :--- | :--- |
| `sql_trigger_value: SELECT ...` | `datagroup_trigger: <name>` | Datagroups centralize caching and coordinate PDT rebuilds with upstream ETL. |
| Raw SQL `COUNT(DISTINCT ...)` | `type: count_distinct` with `sql: ${TABLE}.id` | Modern runtime uses Symmetric Aggregates requiring dimension primary keys. |
| Non-declared `many_to_one` joins | `primary_key: yes` on joined view | Looker requires a unique primary key on the `one` side to calculate symmetric sums without multiplication. |
| Ad-hoc subqueries in views | Native Derived Tables (NDTs) / PDTs | Replace raw SQL derived tables with LookML-native NDTs to inherit model logic and caching. |
