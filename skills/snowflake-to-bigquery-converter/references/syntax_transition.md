---
type: reference
title: Snowflake to BigQuery Syntax Transition Guide
description: Comprehensive mapping of Snowflake-specific SQL functions, operators, and quoting conventions to BigQuery Standard SQL for LookML migrations.
tags:
  - snowflake
  - bigquery
  - lookml
  - sql-migration
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Snowflake to BigQuery Syntax Transition Guide

This document provides detailed documentation on how to transition from Snowflake-specific SQL syntax to BigQuery Standard SQL syntax when migrating LookML projects.

## Core Function Mappings

### Conditional & Numeric Functions
| Snowflake Function | BigQuery Equivalent | Example / Notes |
| :--- | :--- | :--- |
| `IFF(condition, t, f)` | `IF(condition, t, f)` | `IFF(x > 0, 'pos', 'neg')` -> `IF(x > 0, 'pos', 'neg')` |
| `NVL(expr1, expr2)` | `COALESCE(expr1, expr2)` | BigQuery uses standard `COALESCE` or `IFNULL`. |
| `ZEROIFNULL(expr)` | `IFNULL(expr, 0)` | `ZEROIFNULL(col)` -> `IFNULL(col, 0)` |
| `DIV0(num, denom)` | `COALESCE(SAFE_DIVIDE(num, denom), 0)` | Snowflake `DIV0` returns `0` on divide-by-zero; `SAFE_DIVIDE` returns `NULL`. |
| `DECODE(...)` | `CASE ... WHEN ...` | Convert `DECODE` to standard `CASE` statements. |

### Date and Time Functions
| Snowflake Function | BigQuery Equivalent | Example / Notes |
| :--- | :--- | :--- |
| `DATEADD(part, num, date)` | `DATE_ADD(date, INTERVAL num part)` | **Snowflake:** `DATEADD('day', 1, col)` <br>**BigQuery:** `DATE_ADD(col, INTERVAL 1 DAY)` <br>*Note: Use `TIMESTAMP_ADD` if input is timestamp.* |
| `DATEDIFF(part, start, end)`| `DATE_DIFF(end, start, part)` | **Snowflake:** `DATEDIFF('day', d1, d2)` <br>**BigQuery:** `DATE_DIFF(d2, d1, DAY)` <br>*Note: Order of dates is reversed!* |
| `DATE_TRUNC(part, date)` | `DATE_TRUNC(date, part)` | **Snowflake:** `DATE_TRUNC('month', col)` <br>**BigQuery:** `DATE_TRUNC(col, MONTH)` <br>*Note: Order of arguments is reversed.* |
| `CURRENT_TIMESTAMP()` | `CURRENT_TIMESTAMP()` | Compatible across both dialects. |
| `GETDATE()` | `CURRENT_TIMESTAMP()` | |

### String & Pattern Matching Functions
| Snowflake Function | BigQuery Equivalent | Example / Notes |
| :--- | :--- | :--- |
| `SPLIT_PART(str, delim, part)`| `SPLIT(str, delim)[SAFE_OFFSET(part-1)]` | **Snowflake:** `SPLIT_PART(col, '/', 2)` <br>**BigQuery:** `SPLIT(col, '/')[SAFE_OFFSET(1)]` <br>*Note: BigQuery arrays are 0-indexed.* |
| `LEN(str)` | `LENGTH(str)` | BigQuery uses `LENGTH(str)`. |
| `CHARINDEX(sub, str)` | `STRPOS(str, sub)` | **Snowflake:** `CHARINDEX('@', email)` <br>**BigQuery:** `STRPOS(email, '@')` <br>*Note: Order of arguments is reversed!* |
| `col ILIKE '%pat%'` | `LOWER(col) LIKE '%pat%'` | BigQuery does not support `ILIKE` or `NOT ILIKE`. |
| `col ILIKE ANY ('%a%', '%b%')` | `REGEXP_CONTAINS(col, r'(?i)(a|b)')` | BigQuery does not support `ILIKE ANY (...)` or `LIKE ANY (...)`. |
| `SUBSTR(str, start, len)` | `SUBSTR(str, start, len)` | Usually compatible. |
| `TO_VARCHAR(val)` | `CAST(val AS STRING)` | |

### JSON / Semi-Structured Data
| Snowflake Syntax | BigQuery Equivalent | Example / Notes |
| :--- | :--- | :--- |
| `src:variant_col` | `src.variant_col` | Snowflake uses `:` for JSON path; BigQuery uses `.` if parsed as JSON or struct. |
| `PARSE_JSON(str)` | `PARSE_JSON(str)` | Supported in both dialects. |
| `LATERAL FLATTEN(input => col)` | `UNNEST(col)` | **Snowflake:** `FROM table, LATERAL FLATTEN(input => table.arr_col) f` <br>**BigQuery:** `FROM table, UNNEST(table.arr_col) f` or `CROSS JOIN UNNEST(...)`<br>*Note: Use `WITH OFFSET` in BQ if array index is needed.* |

## General Syntax Differences

### Identifiers, Casting, and Quoting
- **Snowflake Double-Quoted Identifiers (`${TABLE}."COLUMN_NAME"`):** Snowflake uses double quotes for case-sensitive identifiers. In BigQuery Standard SQL, double quotes denote **string literals**, so `${TABLE}."COLUMN_NAME"` fails with a syntax error. Replace with unquoted `${TABLE}.column_name` or backtick-quoted `` ${TABLE}.`column_name` ``.
- **Snowflake Double-Colon Casting (`expr::TYPE`):** Replace `col::STRING` or `col::DATE` with standard `CAST(col AS STRING)` or `CAST(col AS DATE)`.

### Data Types
- Snowflake `NUMBER` or `DECIMAL` often maps to BigQuery `NUMERIC` or `BIGNUMERIC`.
- Snowflake `TIMESTAMP_NTZ` (no time zone) maps to BigQuery `DATETIME`.
- Snowflake `TIMESTAMP_TZ` maps to BigQuery `TIMESTAMP`.

## Advanced Syntax and Features

### Time Travel
- **Snowflake:** Uses `AT` or `BEFORE` clauses to query data as it existed at a specific point in the past (up to 90 days).
- **BigQuery:** Uses `FOR SYSTEM_TIME AS OF`.
- **Example:**
    - **Snowflake:** `SELECT * FROM table AT(TIMESTAMP => '...'::TIMESTAMP)`
    - **BigQuery:** `SELECT * FROM table FOR SYSTEM_TIME AS OF TIMESTAMP('...')`

## Strategy for LookML Migration
1.  **Scan `sql` parameters** in LookML files.
2.  Check against the mappings above.
3.  When in doubt, prefer explicit casting to ensure type safety in BigQuery.
