---
type: Reference
title: BigQuery Search Indexes for Looker Explores Guide
description: Accelerating text-based filtering and string queries in Looker using BigQuery SEARCH indexes.
tags: [looker, bigquery, search-index, text-search, optimization]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-24T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-24T14:00:00Z" }
sources:
  - id: warehouse-optimization
    resource: skills/custom/healthcheck/references/warehouse_optimization.md
    title: BigQuery & Warehouse Compute Optimization Guide
---

# BigQuery Search Indexes for Looker Explores Guide

When business users perform ad-hoc text search in Looker Explores (e.g. searching for error codes, freeform transaction notes, URLs, or support logs), standard SQL `LIKE '%keyword%'` or `REGEXP_CONTAINS()` forces BigQuery to read and evaluate every single row across all warehouse partitions.

**BigQuery Search Indexes** (`SEARCH()`) provide sub-second keyword and token lookup on unstructured or semi-structured text columns without requiring expensive full-table scans.

---

## ⚡ 1. How Search Indexes Accelerate Looker Queries

```
                          SEARCH INDEX LOOKUP ARCHITECTURE
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
[STANDARD SQL 'LIKE %text%']                               [BIGQUERY SEARCH INDEX]
• Full byte scan across all shards                         • Inverted token index lookup
• Disables partition pushdown                              • Scans ONLY matching index pointers
• Query Latency: 15s–45s                                   • Query Latency: < 0.8s
```

---

## 🛠️ 2. Step-by-Step DDL Deployment

### Step 1: Create Search Index in BigQuery
Run the following DDL in BigQuery to index text columns:

```sql
-- Create Search Index on unstructured string columns
CREATE SEARCH INDEX IF NOT EXISTS events_search_idx
ON `<project_id>.<dataset_id>.events`(traffic_source, uri, user_agent);
```

### Step 2: Enable LookML Search Optimization
In the LookML view, utilize BigQuery's `SEARCH()` function in dimension definitions:

```lookml
view: events {
  sql_table_name: `<project_id>.<dataset_id>.events` ;;

  dimension: uri {
    type: string
    sql: ${TABLE}.uri ;;
  }

  # Optimized Search Dimension
  filter: uri_search {
    type: string
    description: "Sub-second token search powered by BigQuery Search Index"
    sql: SEARCH(${TABLE}.uri, {% parameter uri_search %}) ;;
  }
}
```

---

## 📊 3. Diagnostic Thresholds & Best Practices

1. **Table Volume Threshold**: BigQuery Search Indexes are most beneficial on tables larger than **10 GB** or with $>10,000,000$ rows.
2. **Text Granularity**: Ideal for URLs, system logs, error messages, and customer feedback.
3. **Explores Integration**: Use LookML `filter:` parameters with `SEARCH(${TABLE}.column, {% parameter search_filter %})` to push indexed evaluation directly into the warehouse WHERE clause.
