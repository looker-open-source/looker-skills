---
name: creating-lookml-model
description: >-
  Looker Developer Onboarding: Step 6.
  Creates LookML views and models based on the user's goals, maps model connections, validates LookML, and runs verification queries.
  Only execute this after Step 5 (Project Setup using `setting-up-looker-project`).
---

# Creating LookML Model, Views & Writing LookML

This skill guides you through the *process* of writing all the LookML (view
files and model files) needed to prepare for the dashboard requested by the user
during their onboarding interview, configuring the connection mapping in Looker,
validating the LookML code, and running inline queries to verify it functions
correctly.

## Prerequisites & References

-   Looker CLI must be installed and authenticated (Step 2 & 3).
-   Looker project and BigQuery connection must be created (Step 4 & 5).
-   **Critical Reference**: You **MUST** read and strictly follow the best
    practices, naming requirements, and constraints in the
    **`lookml-modeling-guidelines`** skill for writing and verifying all LookML
    elements.

## Instructions

### 1. Retrieve Onboarding Goal and Schema Specifications

Refer back to the onboarding goal and BigQuery exploration results established
with the user during the **Step 1 (Discovery)** interview in the conversation
history. You must recall: 1. The target **Dashboard Goal** (e.g., Sales
Overview, Support Metrics, etc.). 2. The specific **GCP Project**, **Dataset**,
and **Tables** (fact and dimension) agreed upon. 3. The target **Metrics**
(measures) and **Dimensions** to be used.

*Note: Do not invent or guess these details. The names of your views, fields,
explores, and models must directly map to the schema and tables you discovered
in Step 1.*

### 2. Create and Edit View Files (CLI)

For each BigQuery table required to build the target dashboard, you must write
the LookML view definition and upload it to the project:

1.  **Create the `views` directory**: If the `views/` directory does not yet
    exist in the project, create it using the Looker CLI:

    ```bash
    looker-cli project directory create {project_id} views
    ```

2.  **Generate View Content**: Retrieve the table columns (from Discovery) and
    write the LookML view file content locally (e.g. to
    `/tmp/{table_name}.view.lkml`). Follow the primary key and field definitions
    guidelines.

3.  **Upload the View File**: Upload the file to your Looker project views
    folder:

    ```bash
    looker-cli project file create {project_id} views/{table_name}.view.lkml /tmp/{table_name}.view.lkml
    ```

4.  **Guideline Reference**: You **MUST** consult and strictly follow the view
    creation best practices in the **`lookml-modeling-guidelines`** skill
    (Section 4 & 6.C) for all view definitions, primary key rules, and field
    reference specifications.

### 3. Create/Update the Model File (CLI)

Write the LookML model definition and upload it to the project root:

1.  Write the model LookML structure (defining explores, joins, and includes) to
    a local file (e.g., `/tmp/{model_name}.model.lkml`).
    -   Specify your database connection: `connection: "{connection_name}"`.
    -   Include the specific view files required (e.g., `include:
        "/views/orders.view.lkml"`, `include: "/views/users.view.lkml"`). Avoid
        using broad wildcards like `"/views/**/*.view.lkml"` to prevent
        performance bloat and compile errors.
    -   **Critical for Dashboards**: If planning to create LookML dashboards,
        you **MUST** include them in the model file by adding `include:
        "/dashboards/**/*.dashboard.lookml"`.
    -   Define explores and joins.
2.  Upload the model file to your Looker project root:

    ```bash
    looker-cli project file create {project_id} {model_name}.model.lkml /tmp/{model_name}.model.lkml
    ```

3.  **Guideline Reference**: You **MUST** consult and strictly follow the model
    and explore best practices in the **`lookml-modeling-guidelines`** skill
    (Section 6.A & 6.B) for all include declarations, explore structures, and
    explicit join relationship definitions.

### 4. Configure Model Connection in Looker (CLI)

Map your LookML model to the allowed database connection in Looker using the
Looker CLI.

1.  Write the model configuration payload directly to `/tmp/model_config.json`:

    ```json
    {
      "name": "{model_name}",
      "project_name": "{project_id}",
      "allowed_db_connection_names": ["{connection_name}"]
    }
    ```

2.  Register the model configuration mapping:

    ```bash
    looker-cli model import /tmp/model_config.json
    ```

3.  Verify the mapping:

    ```bash
    looker-cli model cat {model_name}
    ```

    Ensure the returned JSON correctly lists your connection in
    `allowed_db_connection_names`.

### 5. Validate the Project's LookML (CLI)

Validate the LookML code to ensure there are no syntax or logic errors:

1.  Trigger project validation using the Looker CLI:

    ```bash
    looker-cli api project validate_project {project_id}
    ```

2.  If errors are found, fix them in your local files, upload the updated
    versions using `looker-cli project file update`, and re-run validation until
    clean.
3.  **Guideline Reference**: Under our **Zero-Error Policy**, you are strictly
    forbidden from submitting code that fails validation. Refer to
    **`lookml-modeling-guidelines`** (Section 3 & 5) for detailed validation
    rules and the feedback loop process.

### 6. Verify by Running Queries (CLI)

Test your connection and LookML model by running a verification query:

1.  Use Discovery tools in **`lookml-modeling-guidelines`** (Section 2) to find
    the fully qualified names of the dimensions and measures you defined.
2.  Write the JSON query payload directly to `/tmp/verify_query.json`
    (requesting your fully qualified dimension and measure, limited to 5 rows):

    ```json
    {
      "model": "{model_name}",
      "view": "{explore_name}",
      "fields": ["{explore_name}.{dimension_name}", "{explore_name}.{measure_name}"],
      "limit": 5
    }
    ```

3.  Execute the query using the Looker CLI:

    ```bash
    looker-cli query runquery --file /tmp/verify_query.json --format json
    ```

4.  Confirm that the query executes successfully and returns data without
    database or SQL errors. Refer to **`lookml-modeling-guidelines`** (Section
    3) for verification guidelines.
