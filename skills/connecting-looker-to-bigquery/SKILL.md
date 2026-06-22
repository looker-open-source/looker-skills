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

### 2. Pre-flight Check: Looker Service Account IAM Roles

Verify that the Looker Core service account has the necessary IAM roles on the target GCP project (`BigQuery Data Viewer`, `BigQuery Job User`, and `Service Usage Consumer`):

> [!IMPORTANT]
> When running queries through the BigQuery connection from the Looker instance, Google Cloud requires the Looker service account to have permission to compute/use resources within the project where BigQuery is billed. Without the `roles/serviceusage.serviceUsageConsumer` role (which contains `serviceusage.services.use`), Looker cannot authenticate or dispatch query jobs to BigQuery, resulting in a `400 Bad Request` error.

1. Run the IAM pre-flight check script, passing the Looker GCP project ID (where the Looker Core instance resides) and the BigQuery GCP project ID:
   ```bash
   ./skills/onboarding-preflight-check/scripts/preflight_check.sh \
     --mode iam \
     --looker-project {looker_gcp_project_id} \
     --bq-project {bigquery_gcp_project_id}
   ```
2. If the check fails because roles are missing, first obtain the Looker GCP project number (or copy the exact service account email from the preflight check error output):
   ```bash
   project_number=$(gcloud projects describe {looker_gcp_project_id} --format="value(projectNumber)")
   ```
   Then run the following commands to grant the required roles to the Looker service account:
   ```bash
   gcloud projects add-iam-policy-binding {bigquery_gcp_project_id} \
     --member="serviceAccount:service-${project_number}@gcp-sa-looker.iam.gserviceaccount.com" \
     --role="roles/bigquery.dataViewer"
   
   gcloud projects add-iam-policy-binding {bigquery_gcp_project_id} \
     --member="serviceAccount:service-${project_number}@gcp-sa-looker.iam.gserviceaccount.com" \
     --role="roles/bigquery.jobUser"

   gcloud projects add-iam-policy-binding {bigquery_gcp_project_id} \
     --member="serviceAccount:service-${project_number}@gcp-sa-looker.iam.gserviceaccount.com" \
     --role="roles/serviceusage.serviceUsageConsumer"
   ```

### 3. Create the Connection Payload File

To avoid CLI parsing errors with complex arguments, write the connection
specifications directly to `./connection_config.json` in your workspace.

> [!IMPORTANT] For the BigQuery JDBC driver: - **`host`** must be set to your
> **GCP Project ID** (which supports hyphens). - **`database`** and **`schema`**
> must both be set to your **Dataset ID** (which is strictly
> alphanumeric/underscores only). Setting `database` to a project ID with
> hyphens will cause immediate query execution failures.

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

### 4. Register the Connection in Looker

Execute the connection import CLI command, pointing to your payload file:

```bash
looker-cli connection import ./connection_config.json
```

### 5. Verify the Connection

Retrieve the connection details to ensure it was created correctly:

```bash
looker-cli connection cat {connection_name}
```
