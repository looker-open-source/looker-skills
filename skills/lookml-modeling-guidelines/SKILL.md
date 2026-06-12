---
name: lookml-modeling-guidelines
description: Guidelines for LookML modeling and command execution.
---

# LookML Modeling Guidelines

This guide provides instructions on how to effectively use the Looker CLI to
assist with LookML modeling tasks. It synthesizes best practices for LookML
development with effective CLI usage.

## LookML File Types

Understand the purpose of different file types in a LookML project:

*   **Project Manifest (`manifest.lkml`)**: Global configuration for the
    project, including imports and constants.
*   **Model Files (`.model.lkml`)**: Defines database connections and Explores
    (how views are joined).
*   **View Files (`.view.lkml`)**: Blueprints for data, defining dimensions,
    measures, and derived tables.
*   **Dashboard Files (`.dashboard.lookml`)**: LookML-defined dashboards
    (layout, visualizations, filters).
*   **Specialized Files**: Refinement files (for overriding/patching), Data Test
    files (automated logic checks), and Document files (`.md`).

## 1. Analyzing Requirements

Before writing any LookML code or making modifications, analyze the user's
request to determine the necessary LookML elements.

*   **Understand the Request**: Identify the core business question or technical
    requirement.
*   **Identify Existing Resources**:
    *   Use the Discovery tools (see section 2) to search the existing LookML
        project.
    *   Identify which existing columns (dimensions) and measures are best
        suited to answer the user prompt.
    *   *Do not recreate existing logic.* Reuse existing elements whenever
        possible.
*   **Determine Necessary Additions**:
    *   Identify if any *new* LookML elements are required to fulfill the
        prompt:
        *   **New Views**: Are we introducing new tables or derived tables?
            (Note: If creating a derived table or PDT, you MUST consult the
            `lookml-pdt-guidelines` skill).
        *   **New Dimensions**: Do we need to expose new columns or define new
            logic from existing columns?
        *   **New Measures**: Are we adding new aggregations (e.g., `count`,
            `sum`, `average`) or calculated metrics?
        *   **Other Elements**: Do we need new joins in an Explore, or other
            LookML elements?

## 2. Discovery & Exploration (CLI)

*   **Project Mapping**: Use the following CLI commands to understand project
    structure:
    *   List projects: `looker-cli api project all_projects`
    *   List models: `looker-cli api lookmlmodel all_lookml_models`
    *   Inspect a model: `looker-cli api lookmlmodel lookml_model {model_name}`
*   **Field Discovery**: To see what dimensions and measures are exposed in an
    explore, call: `looker-cli api lookmlmodel lookml_model_explore {model_name}
    {explore_name}` (This is cleaner than reading raw view files).
*   **Schema Discovery**: To retrieve database columns and schemas, use:
    *   List connections: `looker-cli connection ls`
    *   List schemas: `looker-cli api metadata connection_schemas
        {connection_name}`
    *   List tables: `looker-cli api metadata connection_tables
        {connection_name}`
    *   List table columns: `looker-cli api metadata connection_columns
        {connection_name} --schema_name {schema_name} --table_names
        {table_name}`
*   **Data Discovery**: Execute a query to check data results: `looker-cli query
    runquery {query_id}` or run inline query using `looker-cli api query
    run_inline_query`. Fully qualified fields (e.g. `view.field`) must be used.

## 3. Verification & Testing (CLI)

Always verify that your LookML is valid and generates the expected SQL or
results.

*   **Syntactic Correctness:** All code must be syntactically perfect, with
    balanced braces and correct parameters. `sql` parameters must match the
    specific database dialect (e.g., BigQuery, Snowflake).
*   **Running Queries**: Use `looker-cli query runquery` to verify results.
*   **Type Safety**: Ensure LookML types match database column types.
*   **SQL Verification**: Run `looker-cli api query run_inline_query` requesting
    the query's SQL field to inspect the generated SQL.
*   **Validation**: Use `looker-cli api project validate_project {project_id}`
    frequently during development.
*   **Testing**: Retrieve and run tests using:
    *   Get tests: `looker-cli api project all_lookml_tests {project_id}`
    *   Run tests: `looker-cli api project run_lookml_test {project_id}`

## 4. Creating New Views (CLI)

Since we do not have an automated CLI view generation subcommand, you **MUST**
create views manually. Construct the LookML view definition structure from
scratch based on the column schemas retrieved in Step 2, save the content to a
local file (e.g. `/tmp/my_view.view.lkml`), and upload it:

```bash
looker-cli project file create {project_id} views/{view_name}.view.lkml /tmp/my_view.view.lkml
```

### Naming & Uniqueness Requirements

*   **Model:** Instance-wide uniqueness required (prevents URL collisions and
    instance errors).
*   **View:** Project-wide uniqueness required (acts as namespace for fields).
*   **Explore:** Model-wide uniqueness required (query starting point).
*   **Field:** View-wide uniqueness required (dimension/measure names must be
    unique within the view).

## 5. Feedback Loop (Validation)

After making any changes to LookML files:

1.  Run `looker-cli api project validate_project {project_id}` to check for
    syntax and reference errors.
2.  If errors are found, fix them and repeat step 1.
3.  If data tests are defined, run `looker-cli api project run_lookml_test
    {project_id}` to ensure they still pass.
4.  **DO NOT** consider the task complete until the validator returns no errors.

--------------------------------------------------------------------------------

## 6. Best Practices

### A. Models

*   **Includes**: Use specific, granular `include` paths instead of broad
    wildcards to prevent performance bloat, avoid namespace collisions, and
    improve compilation speed.
    *   **Do**: `include: "/views/users.view.lkml"`
    *   **Don't**: `include: "/views/*.view.lkml"`

### B. Explores

*   **Joins**: Always specify the `relationship` parameter explicitly (e.g.,
    `many_to_one`). This is critical for Looker to generate correct SQL and
    avoid fanouts.
*   **Granular Explores**: Prefer small, focused Explores over monolithic ones
    to simplify the user interface and ease troubleshooting.

### C. Views

*   **Primary Key**: Every view representing a table should have a primary key
    defined. It must be the first dimension and have `primary_key: yes`. This is
    essential for symmetric aggregates.
*   **Field References**: Measures should reference dimensions (e.g.,
    `${dimension_name}`), not table columns directly (e.g.,
    `${TABLE}.column_name`). This ensures a single source of truth.
*   **Field Descriptions**: Always add a human-readable `description` parameter
    to any new dimension or measure. This helps end-users understand the field
    in the field picker.

### D. General

*   **DRY Principles & Modularity:** Utilize `extends`, `refinements` (for
    modular, scalable code), and `sets` to eliminate code duplication.
*   **Refinements vs. Extensions**: Use **Refinements** (`+` syntax) to layer
    changes onto existing objects without renaming (e.g., customizing Blocks).
    Use **Extensions** (`extends`) to create new, specialized variants while
    keeping the original object intact.

### Constraints & Guardrails

*   **Mandatory Primary Keys:** You must always define a dimension with
    `primary_key: yes` when creating any view, derived table, or PDT. Every
    table must have an explicit primary key.
*   **Application Scope:** All guidelines and best practices in this file apply
    ONLY to new code added to fulfill the user prompt. Do not refactor or modify
    existing code to comply with these guidelines unless explicitly requested or
    necessary for the new code to function. Keep existing code as is.
*   **Zero-Error Policy:** Strictly forbidden from submitting code that fails
    the LookML Validator.
*   **Data Minimization:** Access only the data and schema necessary for the
    current task.
*   **Validation**: Keep the scope of validation to your changes only. Do not
    fix existing validation errors.
