# Computation

```sql
CREATE OR REPLACE TABLE `@target_table`
PARTITION BY DATE(@partition_column)
CLUSTER BY @cluster_columns AS
SELECT * FROM `@source_table`;
```

Eliminates full table scans on high-volume Looker fact tables.[^bq-partitioning-docs]

[^bq-partitioning-docs]: BigQuery Partitioned Tables Documentation
