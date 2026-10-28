---
type: Attested Computation
title: BigQuery Table Partitioning & Clustering DDL Generator
description: Sanctioned BigQuery DDL pattern for recreating unpartitioned warehouse fact tables with date partitioning and high-cardinality clustering.
status: stable
runtime: bigquery
parameters:
  - name: source_table
    type: string
    required: true
  - name: target_table
    type: string
    required: true
  - name: partition_column
    type: string
    required: true
  - name: cluster_columns
    type: string
    required: true
executor: { resource: agent/tools/bq_client.py, receipt: "['job_id', 'executed_ddl', 'status']" }
attester: { resource: evals/test_tools.py }
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: bq-partitioning-docs
    resource: "https://cloud.google.com/bigquery/docs/partitioned-tables"
    title: BigQuery Partitioned Tables Documentation
    author: "team:google-cloud"
---

# Computation

```sql
CREATE OR REPLACE TABLE `@target_table`
PARTITION BY DATE(@partition_column)
CLUSTER BY @cluster_columns AS
SELECT * FROM `@source_table`;
```

Eliminates full table scans on high-volume Looker fact tables.[^bq-partitioning-docs]

[^bq-partitioning-docs]: BigQuery Partitioned Tables Documentation
