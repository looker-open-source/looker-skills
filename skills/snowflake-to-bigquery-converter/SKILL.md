---
type: howto
name: snowflake-to-bigquery-converter
title: Snowflake to BigQuery LookML Migration Procedure
description: >-
  Helps migrate LookML projects or files from Snowflake to BigQuery Standard SQL
  using the Looker CLI (looker-cli). Triggers when the user wants to convert
  Snowflake-specific SQL syntax in LookML files to BigQuery syntax, audit a
  Looker project for Snowflake dialect usage, or apply Snowflake-to-BigQuery
  conversions directly in a Looker project.
tags:
  - looker
  - lookml
  - snowflake
  - bigquery
  - sql-migration
  - looker-cli
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Snowflake to BigQuery Converter Skill

This skill audits LookML files for Snowflake-specific SQL syntax and proposes BigQuery Standard SQL equivalents, checking them against a bundled syntax transition reference guide using the Looker CLI (`looker-cli`).

## Workflow Instructions

When invoked, execute the following steps precisely:

1. **Pre-flight Guardrails & Verification**:
   Before requesting details or fetching code, verify that `looker-cli` is installed and authenticated:
   - **Verify CLI Installation**:
     Run: `looker-cli --help`
     **If the command fails or is not found**: Halt immediately and instruct the user:
     > "`looker-cli` is not installed or not in your PATH. Please refer to the installation instructions in the Looker CLI documentation: https://github.com/looker-open-source/looker-cli"
   - **Verify Authentication & Looker Configuration**:
     Run: `looker-cli user me`
     **If unauthenticated or connection fails**: Halt immediately and instruct the user:
     > "You are not authenticated to a Looker instance. Please configure and authenticate `looker-cli` using one of the following methods:
     >
     > **Method 1: Interactive OAuth (Recommended)**
     > 1. In Looker, ensure the Looker CLI connector is enabled:
     >    Navigate to **Admin** > **Platform** > **BI Connectors** > under **Developer Tools**, toggle **Looker CLI** to **ON**.
     > 2. Configure your profile and log in:
     >    ```bash
     >    looker-cli profile add default --host <your-looker-host> --port 443
     >    looker-cli profile use default
     >    looker-cli session login --oauth
     >    ```
     >
     > **Method 2: API Keys (Client ID & Client Secret)**
     > If OAuth is not enabled or for headless/service accounts:
     > ```bash
     > looker-cli profile add default --host <your-looker-host> --port 443 --client-id <CLIENT_ID> --client-secret <CLIENT_SECRET>
     > looker-cli profile use default
     > ```
     >
     > Once configured, please rerun your migration request."

2. **Understand Scope & Validate Branch**:
   - Identify the Looker Instance URL (e.g., `https://<instance>.looker.com` or `https://<instance-id>.<region>.looker.app`), the Looker Project Name (e.g., `my_empty_project`), the target branch, and whether the user wants to check the entire project or a **single specific LookML file** (e.g., `views/snowflake_test.view.lkml`).
   - **CRITICAL - Looker Instance URL**: If the Looker instance URL is not mentioned, you MUST ask the user to provide it before proceeding.
   - **CRITICAL**: You MUST always ask the user for the project name and branch name before proceeding, unless they explicitly provided them in their request.
   - **CRITICAL Guardrail - Branch Verification (DO NOT CREATE BRANCHES)**:
     - Ensure the session workspace is in dev mode:
       ```bash
       looker-cli session update dev
       ```
     - Check all existing branches:
       ```bash
       looker-cli project branch <project_id> --all
       ```
     - **DO NOT create a branch if it does not exist.** Never use commands or API calls that create branches.
     - **`master` / `main` Equivalence**: If the user requested `master` but only `main` exists (or vice versa), automatically map to the existing one (`main` or `master`) and inform the user.
     - **Branch Not Found**: If the specified branch (or its `master`/`main` equivalent) does not exist in the branch list, halt immediately, list the available branches to the user, and ask for clarification.

3. **Retrieve LookML Files via `looker-cli`**:
   - **Checkout Target Branch**:
     ```bash
     looker-cli project checkout <project_id> <branch_name>
     ```
     - **Conflict Guardrail**: If checkout fails due to uncommitted local changes or checkout conflicts in the current dev workspace, halt immediately. Report the conflicting files to the user and ask them to commit or discard their changes in Looker before retrying.
   - **List Project Files**: Retrieve the file listing for the project:
     ```bash
     looker-cli project file ls <project_id>
     ```
   - **Fetch File Content**:
     - **Single File Mode**: If the user explicitly mentioned a single LookML file, verify that it exists in the project file listing and retrieve only that file:
       ```bash
       looker-cli project file cat <project_id> <file_path>
       ```
       *(If the file is not found, halt, list matching project files, and ask for clarification).*
     - **Full Project Mode**: If no single file was specified, read the content of each LookML file (`*.model.lkml`, `*.explore.lkml`, `*.view.lkml`, `manifest.lkml`, and config files):
       ```bash
       looker-cli project file cat <project_id> <file_path>
       ```

4. **Identify Snowflake Syntax**:
   - Perform a comprehensive scan of the retrieved LookML file(s) (`sql`, `sql_table_name`, `derived_table`, `sql_on`, `sql_always_where`, `sql_where`, `sql_trigger_value`, etc.) against the Snowflake-to-BigQuery mappings in `references/syntax_transition.md`.
   - Identify all Snowflake-specific SQL constructs that would fail or behave differently on BigQuery (such as `IFF`, `NVL`, `ZEROIFNULL`, `DIV0`, `DECODE`, `DATEADD`, `DATEDIFF`, `DATE_TRUNC` argument ordering, `SPLIT_PART`, `LEN`, `CHARINDEX`, `ILIKE` / `NOT ILIKE`, `ILIKE ANY`, `::` casting, `:` semi-structured path access, `LATERAL FLATTEN`, and double-quoted column identifiers like `${TABLE}."COLUMN_NAME"`).
   - Avoid unnecessary conversions for SQL syntax that is already natively valid in BigQuery Standard SQL (e.g., `QUALIFY`, `COALESCE`).

5. **Compile Report**: Draft a comprehensive migration report based on your analysis. The report must contain the following sections:
   - **Summary**: A high-level summary naming the Looker instance, project, branch, and target file(s) analyzed, along with a file-by-file status table summarizing which files are already BigQuery-compatible and which require migration.
   - **Proposed Conversions**: A detailed breakdown of required Snowflake-to-BigQuery conversions organized by file. For each conversion point:
     - Describe the incompatible Snowflake syntax clearly and explain the proposed BigQuery Standard SQL equivalent.
     - Provide concrete **Before (Snowflake)** and **After (BigQuery)** LookML/SQL code snippets.
     - **CRITICAL**: Include the exact file path and line number(s) of the syntax (e.g., `views/snowflake_test.view.lkml:L27-L44`). Use the Looker instance URL to construct a direct link to the file in the Looker IDE: `<instance_url>/projects/<project_id>/files/<file_path>`.
6. **Print Report**: Formulate the report and print it directly in the chat or console as your primary response. Do not save it to a file or an artifact.


