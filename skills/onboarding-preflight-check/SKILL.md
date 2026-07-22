---
name: onboarding-preflight-check
description: >-
  Looker Developer Onboarding: Step 1.
  Verifies system prerequisites (gcloud, bq, write permissions) and resolves issues by installing components or prompting the user to authenticate.
---

# Looker Developer Onboarding: Pre-flight Check

This skill verifies that the local environment has the required tools and
authentication configured before beginning onboarding.

## Instructions

### 1. Run the System Pre-flight Check

Execute the pre-flight check script in `system` mode. Specify the path where you
plan to install the Looker CLI (typically `~/.local/bin` or a workspace path):

```bash
./skills/onboarding-preflight-check/scripts/preflight_check.sh --mode system --install-dir ~/.local/bin
```

### 2. Handle Check Failures

If the script returns a non-zero exit code, resolve the issues based on the
error output:

#### Case A: `gcloud CLI is not installed`

1.  Install the Google Cloud SDK. If you are unable to install it automatically
    (e.g. due to missing system package manager or permissions), instruct the
    user to install the Google Cloud SDK.

#### Case B: `gcloud is not authenticated`

1.  Prompt the user to run the interactive login in their terminal:

    ```bash
    gcloud auth login
    ```

2.  Wait for the user to complete the login flow, then re-run the check.

#### Case C: `bq CLI is not installed`

1.  Install the `bq` component:

    ```bash
    gcloud components install bq
    ```

#### Case D: `Installation directory ... is not writable`

1.  Create the target installation directory if it does not exist. If
    permissions are restricted, run the installation using a subdirectory in the
    workspace (e.g., `./bin`) and pass that path to `--install-dir`.

### 3. Run the IAM Pre-flight Check (During Connection Setup)

Execute the pre-flight check script in `iam` mode to verify that the Looker Core
service account possesses the required least-privilege roles on the target GCP
project (`roles/bigquery.dataViewer`, `roles/bigquery.jobUser`, and
`roles/serviceusage.serviceUsageConsumer`):

```bash
./skills/onboarding-preflight-check/scripts/preflight_check.sh --mode iam --looker-project {looker_gcp_project_id} --bq-project {bigquery_gcp_project_id}
```

> [!IMPORTANT] **Why `roles/serviceusage.serviceUsageConsumer` is required**:
> When running queries through the BigQuery connection from the Looker instance,
> Google Cloud requires the Looker service account to have permission to
> compute/use resources within the billed project. Without the
> `roles/serviceusage.serviceUsageConsumer` role (which contains
> `serviceusage.services.use`), Looker cannot authenticate or dispatch query
> jobs to BigQuery, resulting in a `400 Bad Request` permission error during
> execution.

If missing roles are reported, run the appropriate `gcloud projects
add-iam-policy-binding` commands to grant `roles/bigquery.dataViewer`,
`roles/bigquery.jobUser`, and `roles/serviceusage.serviceUsageConsumer` to the
Looker service account
(`service-{project_number}@gcp-sa-looker.iam.gserviceaccount.com`).
