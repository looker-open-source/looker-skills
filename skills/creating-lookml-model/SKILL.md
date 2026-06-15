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
-   **Critical References**: You **MUST** read and strictly follow the best practices in the other `lookml-*` skills (e.g. `lookml-view`, `lookml-explore`, `lookml-model`) for writing LookML elements.

## Constraints & Guardrails

*   **Application Scope:** All guidelines and best practices apply
    ONLY to new code added to fulfill the user prompt. Do not refactor or modify
    existing code to comply with these guidelines unless explicitly requested or
    necessary for the new code to function. Keep existing code as is.
*   **Zero-Error Policy:** Strictly forbidden from submitting code that fails
    the LookML Validator. Keep the scope of validation to your changes only. Do not
    fix existing validation errors.

## CLI Reference & Discovery Tools

*   **Project Mapping**:
    *   List projects: `looker-cli api project all_projects`
    *   List models: `looker-cli api lookmlmodel all_lookml_models`
    *   Inspect a model: `looker-cli api lookmlmodel lookml_model {model_name}`
*   **Field Discovery**:
    *   `looker-cli api lookmlmodel lookml_model_explore {model_name} {explore_name}`
*   **Schema Discovery**:
    *   List connections: `looker-cli connection ls`
    *   List schemas: `looker-cli api metadata connection_schemas {connection_name}`
    *   List tables: `looker-cli api metadata connection_tables {connection_name}`
    *   List table columns: `looker-cli api metadata connection_columns {connection_name} --schema_name {schema_name} --table_names {table_name}`
*   **SQL Verification**: Run `looker-cli api query run_inline_query` requesting
    the query's SQL field to inspect the generated SQL.
*   **Validation**: Use `looker-cli api project validate_project {project_id}` frequently during development.
*   **Testing**:
    *   Get tests: `looker-cli api project all_lookml_tests {project_id}`
    *   Run tests: `looker-cli api project run_lookml_test {project_id}`

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
    looker-cli project directory create {project_id} views/{datasource_name}
    ```

2.  **Generate View Content**: Retrieve the table columns (from Discovery) and
    write the LookML view file content locally (e.g. to
    `/tmp/{table_name}.view.lkml`). Follow the primary key and field definitions
    guidelines.

3.  **Upload the View File**: Upload the file to your Looker project views
    folder:

    ```bash
    looker-cli project file create {project_id} views/{datasource_name}/{table_name}.view.lkml /tmp/{table_name}.view.lkml
    ```

4.  **Guideline Reference**: You **MUST** consult and strictly follow the view
    creation best practices in the **`lookml-view`** and **`lookml-fields`** skills
    for all view definitions, primary key rules, and field
    reference specifications.

### 3. Create Explores and Model File (CLI)

Write the LookML explore and model definitions and upload them to the project:

1.  **Create Explore Files**: Following the "One Explore Per File" pattern, write
    your explore LookML structure (defining explores and joins) to a local file
    (e.g., `/tmp/{explore_name}.explore.lkml`).
    -   Upload the explore file to an `explores/` directory in your Looker project:
    ```bash
    looker-cli project directory create {project_id} explores
    looker-cli project file create {project_id} explores/{explore_name}.explore.lkml /tmp/{explore_name}.explore.lkml
    ```

2.  **Create the Model File**: Write the model LookML structure to a local file
    (e.g., `/tmp/{model_name}.model.lkml`).
    -   Specify your database connection: `connection: "{connection_name}"`.
    -   Include the specific view files required (e.g., `include:
        "/views/{datasource_name}/orders.view.lkml"`).
    -   Include the explore files you just created (e.g., `include:
        "/explores/{explore_name}.explore.lkml"`).
    -   **Critical for Dashboards**: If planning to create LookML dashboards,
        you **MUST** include them in the model file by adding `include:
        "/dashboards/**/*.dashboard.lookml"`.
    -   **DO NOT** define explores directly in the model file.

3.  Upload the model file to your Looker project root:

    ```bash
    looker-cli project file create {project_id} {model_name}.model.lkml /tmp/{model_name}.model.lkml
    ```

4.  **Guideline Reference**: You **MUST** consult and strictly follow the model
    and explore best practices in the **`lookml-model`** and **`lookml-explore`** skills
    for all include declarations, explore structures, and
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
    forbidden from submitting code that fails validation.

### 6. Verify by Running Queries (CLI)

Test your connection and LookML model by running a verification query:

1.  Use the **Field Discovery** CLI tools listed above to find
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
    database or SQL errors.
