---
name: connecting-looker-to-bigquery
description: >-
  Looker Developer Onboarding: Step 4.
  Creates a database connection in Looker to Google BigQuery.
  Only execute this after Step 3 (CLI Authentication using `authenticating-looker-cli`).
---

# Connecting Looker to BigQuery

Creates a database connection in Looker to Google BigQuery. This instruction
uses **Application Default Credentials (ADC)**, which is the recommended and
most secure method for Looker Core instances running in Google Cloud, as it
avoids managing service account keys.

## Prerequisites

-   Looker CLI must be installed and authenticated (see `installing-looker-cli`
    and `authenticating-looker-cli` skills).
-   Looker Core instance service account must have the necessary IAM roles on
    the BigQuery project.

## Instructions

### 1. Identify the GCP Project and Datasets

Identify the following parameters from Step 1 (Discovery):

-   **GCP Project ID**: The GCP project containing the BigQuery datasets (allows
    hyphens).
-   **Dataset ID**: The BigQuery dataset you want to explore (must be
    alphanumeric/underscores only, no hyphens).

### 2. Create the Connection Payload File

To avoid CLI parsing errors with complex arguments, write the connection
specifications directly to `/tmp/connection_config.json`.

> [!IMPORTANT]
> For the BigQuery JDBC driver:
> - **`host`** must be set to your **GCP Project ID** (which supports hyphens).
> - **`database`** and **`schema`** must both be set to your **Dataset ID** (which is strictly alphanumeric/underscores only).
> 
> Setting `database` to a project ID with hyphens will cause immediate query execution failures.

```json
{
  "name": "{connection_name}",
  "dialect_name": "bigquery_standard_sql",
  "uses_application_default_credentials": true,
  "host": "{gcp_project_id}",
  "database": "{dataset_name}",
  "schema": "{dataset_name}"
}
```

### 3. Register the Connection in Looker

Execute the connection import CLI command, pointing to your payload file:

```bash
looker-cli connection import /tmp/connection_config.json
```

### 4. Verify the Connection

Retrieve the connection details to ensure it was created correctly:

```bash
looker-cli connection cat {connection_name}
```
