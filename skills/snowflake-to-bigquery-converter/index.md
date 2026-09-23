---
type: index
title: Snowflake to BigQuery LookML Migration Knowledge Bundle
description: >-
  Complete procedural and reference knowledge bundle for auditing and migrating
  LookML codebases from Snowflake SQL to BigQuery Standard SQL using looker-cli.
tags:
  - looker
  - lookml
  - snowflake
  - bigquery
  - sql-migration
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Snowflake to BigQuery LookML Migration Knowledge Bundle

This bundle contains procedural workflows and dialect reference documentation for auditing LookML projects for Snowflake-specific SQL syntax and proposing BigQuery Standard SQL equivalents using `looker-cli`.

## Procedures (`howto`)
- [Snowflake to BigQuery LookML Migration Workflow](./SKILL.md) — Step-by-step procedure for verifying CLI prerequisites, checking out project branches, scanning LookML files for Snowflake syntax, and compiling migration reports.

## Dialect & Syntax References (`reference`)
- [Snowflake to BigQuery Syntax Transition Guide](./references/syntax_transition.md) — Reference mapping of Snowflake functions, operators, identifier quoting, semi-structured data paths, and date/string expressions to BigQuery Standard SQL.
