---
name: looker-architect
description: Master developer skill for scaffolding, building, refactoring, validating, and auditing enterprise LookML projects. Enforces raw/refined separation, functional sequencing, and advanced drilling configurations.
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Looker Architect

This master developer skill governs the lifecycle of building, refactoring, validating, and auditing enterprise-grade LookML projects. Built upon the architectural standards, design principles, and best practices used internally at Google to engineer official Looker Blocks, it empowers developers to build block-quality analytical applications. It enforces a strict separation of concerns, performance-first design, automated testing, and comprehensive documentation.

All LookML projects developed under this skill must be dialect-agnostic, schema-agnostic, and compatible with any database connection. They strictly adhere to the highest standards of LookML, Google Cloud best practices, and enterprise data governance guidelines.

---

## 1. Standard Project Structure

Every LookML project **MUST** follow this clean, modular directory structure to ensure maintainability, enable robust version control, and prevent compilation bloat:

```
├── views/
│   ├── raw/                 # Raw views mapping 1:1 to physical database tables
│   │   ├── [view_name].view.lkml
│   └── refined/             # Refined views (extends/refines raw views with business logic)
│       └── [view_name]_rfn.view.lkml
├── explores/                # Modular Explore files (one explore per file: *.explore.lkml)
│   └── [explore_name].explore.lkml
├── tests/                   # LookML test suites (one suite per explore: *.test.lkml)
│   └── [explore_name].test.lkml
├── dashboards/              # LookML dashboard files (*.dashboard.lookml)
│   └── [dashboard_name].dashboard.lookml
├── [project_name].model.lkml # Clean model file (connection constant, caching, and includes only)
├── manifest.lkml            # Defines constants (connection, dataset, and visualization configs)
├── README.md                # End-user documentation (installation, PDT config, KPIs)
├── LICENSE                  # Apache 2.0 or standard open-source license
└── CONTRIBUTING.md          # Guidelines for contributing to the project
```

---

## 2. Operating Modes (Greenfield vs. Brownfield)

The Looker Architect skill operates in two distinct modes depending on the state of the codebase. In both modes, the agent **MUST** adhere to the **Mandatory PRD Audit Checklist & Full-Coverage Rule**:

> [!IMPORTANT]
> **Mandatory PRD Audit Checklist & Full-Coverage Rule**: Before writing a single line of code, the agent **MUST** read and analyze all provided external document URLs (including Google Docs PRDs, database schema specifications, and database dialect manuals). The agent **MUST** compile and write a concrete **Completeness Checklist** listing every required dashboard, tab, tile, metric, and view. 
> 
> Furthermore, the agent **MUST** implement the advanced modeling standards (custom visual drills, value formatting, and Period-over-Period comparisons) across **100% of the views, measures, and dashboard tiles created for the project**. Applying these standards selectively (e.g., only to the primary view while leaving secondary views as unformatted boilerplate) or introducing shortcuts is strictly prohibited.

### Mode A: Greenfield (New Project from Scratch)
Use this mode when starting a brand new project. Follow the full 8-step development workflow:
1. Initialize the directory structure using the non-interactive `./looker_scaffold.py` script (ensuring the project name matches the target project name in the Looker instance).
2. Ingest schema details, map the raw tables to `views/raw/`, and layer business logic in `views/refined/`.
3. Set up modular explores, write unit tests for primary key uniqueness, and build native tabbed dashboards.
4. Ensure all Key KPI scorecards implement the two-measure PoP comparison pattern, and all core measures have advanced visual drill links utilizing manifest constants.

### Mode B: Brownfield (Audit, Refactor & Upgrade Existing Projects)
Use this mode when reviewing or improving an existing LookML project. The agent **MUST** execute the following audit and refactoring pipeline:
1. **Analyze Existing Structure**: Use `looker-cli` or Looker MCP (`get_project_files`, `get_project_file`) to inspect the active LookML files.
2. **Detect Deviations**: Identify violations of the standards:
   * Presence of database columns or sql calculations directly in the model file (explores must be modular and inside `explores/`).
   * Absence of raw/refined folder separation (e.g., raw columns and measures mixed in a single view file).
   * Lack of functional sequencing (e.g., measures defined above dimensions).
   * Use of SQL aggregate functions in measures instead of native Looker `type` parameters.
   * Outdated HTML navigation menus in dashboards instead of native `tabs`.
   * Lack of unit tests validating primary keys.
   * Absence of advanced visual drill links on core count and metric measures.
   * Absence of Period-over-Period (PoP) comparison patterns on Key KPI single_value dashboard tiles.
3. **Surgical Refactoring**: Spawn specialized subagents to refactor the files in place:
   * Separate the mixed views into `views/raw/` (direct 1:1 columns) and `views/refined/` (refinements with measures, inheriting metadata via `${field_name}`).
   * Reorder fields according to the sequencing rule (Keys ➔ Dimensions ➔ Measures ➔ Filters ➔ Sets).
   * Replace SQL aggregates with native Looker types and add `NULLIF` safe-math divisions.
   * Inject advanced visual drill links (e.g., trend charts, donut charts, grid detail tables) on all core measures, using manifest constants and empty drill fields.
   * Convert HTML dashboard navigation menus into native Looker tabbed layouts (`tabs:` and `tab_name:`), resetting grid coordinates to `row: 0, col: 0` for each tab.
   * Convert single_value dashboard tiles to the two-measure PoP comparison pattern, querying both `pop_*_current` and `pop_*_change` measures and mapping filters to the explore's `pop_date_filter`.
4. **Validation**: Run server-side validation (`looker-cli project validate` or MCP `health_analyze`) to ensure the refactored project compiles perfectly and has zero syntax errors.
5. **Runtime SQL Execution Auditing & Schema Reconciliation**: Server-side compilation only checks LookML syntax, not database compatibility. The agent **MUST** initiate the **Self-Healing SQL Loop** to audit and repair execution-time query crashes. Refer to the complete debugging procedures, loop protocols, and dialect-specific fixes defined in the specialized manual [references/sql_runtime_debugging.md](references/sql_runtime_debugging.md).
   * **Extract & Run Queries**: For every tile in your LookML dashboards, use Looker MCP's `run_dashboard` or `query` tool to generate and execute the underlying SQL query against the target database.
   * **Intercept Execution Crashes**: Capture any runtime database errors (such as gRPC `Name query_text not found` or SQL syntax/type-coercion errors).
   * **Reconcile & Repair**: Reconcile with the database schema (via MCP `get_connection_table_columns`), surgically edit the LookML views to map to correct columns, adjust the SQL casts to match the target dialect, and re-verify until the queries return `HTTP 200` (successful data retrieval).

---

## 3. Core Development Workflow

Building an enterprise LookML project follows a strict 8-step lifecycle:

1.  **Context Ingestion**: Analyze the source database schema, table relationships, and ingestion levels (snapshots, real-time, transaction logs) from the user's data warehouse.
2.  **Interview**: Ask targeted questions regarding the user's business goals, core KPIs, filtering requirements, and primary audience (executive scorecards vs. ad-hoc analysts).
3.  **Instance Check (Looker MCP & CLI)**:
    *   Connect to the Looker instance and switch your session to Developer Mode:
        ```bash
        looker-cli session login --oauth --host <your-looker-domain.com>
        looker-cli session update dev
        ```
    *   Inspect existing views, explores, or connections to align the new project with the active instance architecture.
4.  **Scaffolding & Boilerplate Generation**:
    *   Use the local Python utility `looker_scaffold.py` to automatically generate the standard directory structure, parameterized `manifest.lkml`, clean `.model.lkml`, raw views with primary keys, and refined views pre-populated with functional sequencing headers.
5.  **Implementation & Dashboard Translation**:
    *   Write the LookML code in the refined views and explores.
    *   For advanced features, delegate implementations to the specialized references:
        *   **Period-over-Period Engine**: Refer to [pop_engine.md](references/pop_engine.md) (dialect-agnostic single-explore pattern).
        *   **Visual Drilling**: Refer to [visual_drilling.md](references/visual_drilling.md) (drill paths and visualization links).
        *   **Aggregate Awareness**: Refer to [aggregate_awareness.md](references/aggregate_awareness.md) (caching and database rollups).
    *   If the user designed visual dashboards (UDDs) in the Looker browser, export and translate them into version-controlled LookML dashboards in the `dashboards/` directory:
        ```bash
        looker-cli api dashboard dashboard_lookml <dashboard_id> > dashboards/<dashboard_name>.dashboard.lookml
        ```
6.  **Testing & Server Validation**:
    *   Write automated explore tests in `tests/` to validate primary keys and business calculations. Refer to [testing_suite.md](references/testing_suite.md).
    *   **ALWAYS** validate your LookML against the Looker server compiler to guarantee zero errors before committing code:
        ```bash
        looker-cli project validate <project_name>
        ```
7.  **Documentation**: Generate the public `README.md` file detailing the installation steps, PDT rebuild frequencies, and KPI definitions.
8.  **Deployment**: Push the code to GitHub (fully authenticated via the `gh` credential helper), merge to `main`, and trigger a production deploy:
    ```bash
    looker-cli project deploy <project_name>
    ```

---

## 4. LookML Modeling Standards (The Golden Rules)

### Rule 1: Centralized Connection & Dataset Constants
Never hardcode connection or dataset names in your model or view files. Always parameterize them in `manifest.lkml` with `override_optional` export settings so users can override them during block installation or deployment.

**manifest.lkml**:
```lookml
project_name: "my_lookml_project"

constant: CONNECTION_NAME {
  value: "my_connection"
  export: override_optional
}

constant: DATASET_NAME {
  value: "my_dataset"
  export: override_optional
}
```

**views/raw/users.view.lkml**:
```lookml
view: users {
  # References the dataset constant
  sql_table_name: @{DATASET_NAME}.users ;;
  # ...
}
```

**my_model.model.lkml**:
```lookml
# References the connection constant
connection: "@{CONNECTION_NAME}"
```

---

### Rule 2: Advanced Drilling & Visualization Constant Library (Mandatory for Core Metrics)
To provide a premium, highly interactive user experience without cluttering view files with massive, duplicated JSON blocks, define centralized **Visualization Drill Constants** in `manifest.lkml`.
*   **Mandatory Metric Drilling**: Every core measure and count metric (e.g., total sales, transaction counts, error rates) in your refined views **MUST** implement at least 2-3 custom visual drill links (e.g., trend line chart, distribution donut chart, styled detail grid table) utilizing the manifest constants.
*   **The `drill_fields` Quirk**: The agent **MUST** define an empty array `drill_fields: []` on the measure to force the Looker frontend to activate the hyperlink in the UI. Without this parameter, custom links will not render.
*   **Dynamic Visual Drilling**: Refer to the complete implementation examples and URL parameters in the specialized manual [references/visual_drilling.md](references/visual_drilling.md).

**manifest.lkml**:
```lookml
constant: DRILL_COLUMN_VIZ {
  value: "{% assign vis_config = '{
    \"type\": \"looker_column\",
    \"x_axis_gridlines\": false,
    \"y_axis_gridlines\": true,
    \"show_view_names\": false,
    \"show_y_axis_labels\": true,
    \"show_y_axis_ticks\": true,
    \"show_x_axis_label\": true,
    \"show_x_axis_ticks\": true,
    \"stacking\": \"\",
    \"show_value_labels\": true
  }' %}"
}
```

**views/refined/users_rfn.view.lkml**:
```lookml
view: +users {
  dimension: country {
    type: string
    sql: ${TABLE}.country ;;
    
    # References the visualization constant, passing dynamic filter values
    link: {
      label: "📊 Country Connection States (Bar)"
      url: "@{DRILL_COLUMN_VIZ}{{ link }}&fields=users.state,users.total_connections&f[users.country]={{ value | url_encode }}&sorts=users.total_connections+desc&limit=10&toggle=vis"
    }
  }
}
```

---

### Rule 3: Strict Separation of Concerns (Raw vs. Refined Views)
*   **Raw Views (`views/raw/`)**: Map 1:1 to the physical database tables. They contain *only* raw dimensions mapping directly to columns. They **MUST NOT** define measures, labels, or complex business logic. The **Primary Key** must be the first dimension defined in the file.
*   **Refined Views (`views/refined/`)**: Use the refinement syntax (`view: +view_name`) to layer business logic. This is where you write measures, labels, descriptions, group labels, Period-over-Period engines, and custom calculations.
*   *Why*: If the database schema changes, you only regenerate the raw views without breaking or rewriting your business calculations, which remain untouched in the refined views.

---

### Rule 4: View Field Sequencing (The Ordering Rule)
To maximize readability, fields within any refined view file **MUST** be organized from top to bottom in the following functional order:

1.  **Keys**: Primary Keys (`primary_key: yes`) and Foreign Keys.
2.  **Dimensions**: Standard attributes (e.g., name, status, category).
3.  **Measures**: Aggregated metrics (e.g., totals, averages, counts).
4.  **Filters & Parameters**: User-input fields capturing dynamic parameters.
5.  **Sets**: Reusable field lists for drilling.

*Internal Ordering*: Within each category, fields should be ordered either **Alphabetically (A-Z)** or grouped logically by **Group Label** (`group_label`).

---

### Rule 5: Substitution Operator Inheritance (`${field_name}`)
When defining measures or compound dimensions, **ALWAYS** use the LookML substitution operator `${field_name}` rather than the raw SQL column `${TABLE}.field_name`.

*   **CORRECT**:
    ```lookml
    dimension: sale_price {
      type: number
      sql: ${TABLE}.sale_price ;;
      description: "Unit price of the item sold."
      value_format_name: usd
    }
    
    measure: total_revenue {
      type: sum
      sql: ${sale_price} ;; # INHERITS metadata (description, formatting, type)
    }
    ```
*   **INCORRECT**:
    ```lookml
    measure: total_revenue {
      type: sum
      sql: ${TABLE}.sale_price ;; # BYPASSES LookML layer, loses metadata
    }
    ```
*   *Why*: Referencing the LookML field `${sale_price}` ensures that the measure inherits all its formatting, descriptions, and metadata. If the column name changes in the database, you only need to update it once in the base dimension.

---

### Rule 6: Native Looker Aggregations (Preventing Fan-Outs)
Always utilize Looker's native `type` parameter for aggregations (e.g., `type: sum`, `type: average`, `type: count`) instead of writing aggregation functions directly in the `sql:` parameter (e.g., using `type: number` with `sql: SUM(col)`).

*   **CORRECT**:
    ```lookml
    measure: average_benchmark {
      type: average
      sql: ${benchmark_dynamic} ;; # Looker knows this is an average natively
    }
    ```
*   **INCORRECT**:
    ```lookml
    measure: average_benchmark {
      type: number
      sql: AVERAGE(${TABLE}.benchmark_dynamic) ;; # Bypasses aggregation engine
    }
    ```
*   *Why*: Writing aggregations in SQL prevents Looker's compiler from running **Symmetric Aggregations** when joining tables with one-to-many relationships, resulting in incorrect calculations and data fan-outs.

---

### Rule 7: Naming Conventions & Measure Suffixes
*   Write all LookML objects (views, explores, dimensions, measures, sets) in `snake_case` (lowercase with underscores).
*   **Measures Suffixes**: To ensure clarity, use specific suffixes for aggregations:
    *   Use `_count` or `_total` for Count and Distinct Count measures (e.g., `user_count`, `active_users_total`).
    *   Use `_total` or `_amount` for Sum measures (e.g., `revenue_total`, `discount_amount`).

---

### Rule 8: Safe Math, Ratio Calculations & Mandatory Value Formatting
*   **Safe Division**: Always protect division calculations from division-by-zero errors. Use dialect-appropriate safe math (e.g., `SAFE_DIVIDE(num, den)` for BigQuery, or `num / NULLIF(den, 0)` for Snowflake/Redshift).
*   **Aggregate Ratios**: Apply ratios only to final aggregated metrics. **Never aggregate a ratio directly**.
    *   **CORRECT**:
        ```lookml
        measure: conversion_rate {
          type: number
          sql: 1.0 * ${orders_count} / NULLIF(${sessions_count}, 0) ;; # Aggregates first, then divides
          value_format_name: percent_1
        }
        ```
    *   **INCORRECT**:
        ```lookml
        measure: conversion_rate {
          type: average
          sql: ${TABLE}.conversion_rate ;; # Aggregates a ratio, mathematically invalid
        }
        ```
*   **Mandatory Value Formatting**: Unformatted raw numbers (e.g., displaying `0.072826486327` in a dashboard visualization) look highly unprofessional and clutter the UI. **Every count, sum, average, ratio, or size measure in refined views MUST have a clean, reader-friendly formatting parameter defined:**
    *   **Percentages & Ratios**: Use `value_format_name: percent_1` (e.g., `7.3%`) or `percent_2` (e.g., `7.28%`).
    *   **Standard Averages & Decimals**: Use `value_format_name: decimal_2` (e.g., `12.34`) or `decimal_1` (e.g., `12.3`).
    *   **Large Integers**: Use `value_format_name: decimal_0` or `integer` to force comma separators (e.g., `1,234`).
    *   **Currencies**: Use `value_format_name: usd` (e.g., `$1,234.56`) or `usd_0` (e.g., `$1,234`).
    *   **Custom Units (Latency, Sizes, Bandwidth)**: Use `value_format` with a custom format string to append clean units in quotation marks:
        *   *Latency (Seconds)*: `value_format: "#,##0.00 \"s\""` (formats `0.0728` to `0.07 s`).
        *   *Latency (Milliseconds)*: `value_format: "#,##0.0 \"ms\""` (formats `72.82` to `72.8 ms`).
        *   *Data Sizes (GB)*: `value_format: "#,##0.00 \"GB\""` (formats `12.345` to `12.35 GB`).
        *   *Row Counts*: `value_format: "[>=1000000]#,##0.0,,\"M\";[>=1000]#,##0.0,\"K\";#,##0"` (formats `1500000` to `1.5M`, and `2500` to `2.5K`).

---

### Rule 9: Join Pruning & Explore Governance
*   **Centralize Joins in Explores**: Avoid creating SQL derived tables that join physical tables using SQL. Define each table in its own view, and join them in an Explore using LookML join parameters.
    *   *Why*: This enables **Join Pruning** (Looker queries only the tables needed for the selected fields, improving database performance), simplifies maintenance, and ensures Symmetric Aggregations prevent fan-outs.
*   **One Explore Per File**: Define each explore in its own file under `explores/` (e.g., `explores/orders.explore.lkml`).
*   **Clean Model File**: The `.model.lkml` file must contain only the connection constant, caching policy (datagroups), and includes for explores and dashboards. No explore definitions are allowed in the model file itself.

---

### Rule 10: Native Tabbed Dashboards & PoP KPI Comparisons (Prohibiting HTML Navigation)
*   **The Standard**: For complex, multi-topic dashboard suites, package all elements into a single `.dashboard.lookml` file using native Looker **Tabbed Dashboards** (the `tabs` metadata parameter).
*   **Prohibition**: Writing custom HTML text tiles to serve as navigation menus is strictly **prohibited**. Always use Looker's native `tabs` parameter.
*   **Independent Grid Coordinates**: Each tab in a Looker tabbed dashboard operates on an **independent 24-column grid coordinate system starting at `row: 0, col: 0`**. When designing layouts, elements on a new tab must reset their `row` and `col` values to `0`.
*   **Mandatory PoP KPI Tiles**: All Key KPI tiles (type: `single_value` scorecards) **MUST** implement the Period-over-Period (PoP) comparison pattern. They must query exactly two fields (the current period measure and the percentage change measure), enable comparison settings (`show_comparison: true` and `comparison_type: change`), and map their filters to the explore's PoP date filter (`pop_date_filter`). Refer to [references/dashboard_standards.md](references/dashboard_standards.md) for LookML examples.

---

### Rule 11: Prohibition of Hardcoded/Dummy Calculations (Strict Compliance)
The compilation of LookML only validates syntax; it does not check if calculations are mathematically or logically sound. To prevent creating non-functional, "fake" projects, the agent **MUST** adhere to this strict rule:
*   **Strict Prohibition**: Writing hardcoded numerical constants, dummy percentages, or static mock values (e.g., `sql: 0.05 ;;`, `sql: 0.15 ;;`, `sql: 1 ;;`) inside measures, especially in Period-over-Period percentage change metrics, is strictly **prohibited**.
*   **Dynamic Calculations**: Every measure and dimension **must** represent a real database aggregation or a mathematically valid, dynamic calculation based on underlying fields.
*   **True Period-over-Period Logic**: For all Period-over-Period change measures, the agent **must** implement the actual database-level time-frame comparison SQL logic. It must either:
    1.  Leverage the single-explore PoP engine as defined in `references/pop_engine.md` (which dynamically compares current vs. previous periods using Looker filters).
    2.  Write valid, database-level SQL `CASE WHEN` expressions that dynamically compare the current period's aggregated value against the previous period's aggregated value.
    *   Under no circumstances should the agent write mock or static dummy numbers to bypass compiler validations.

---

## 5. Looker CLI & MCP Tooling Manual

To manage the lifecycle of a LookML project, the AI agent **MUST** leverage either the Looker CLI (`looker-cli`) or the Looker MCP server. The Looker MCP server is preferred when interacting with the active Looker instance programmatically. Below is the mapping of core actions to their equivalent CLI commands and MCP tools:

### 1. Session & Workspace Management
Ensure your development session is active and targeting Developer Mode before making any edits.
*   **Looker CLI**:
    ```bash
    looker-cli session update dev
    ```
*   **Looker MCP**: Call the `dev_mode` tool:
    ```json
    { "state": true }
    ```

### 2. Database Introspection & Metadata Retrieval
Before mapping columns or planning joins, fetch table details and schemas directly from the database.
*   **Looker MCP**: 
    *   List connection tables: `get_connection_tables`
    *   List table columns: `get_connection_table_columns` (e.g., `{"connection_name": "my_conn", "table_name": "users"}`)

### 3. Project Lifecycle & File Management
Create and modify the LookML files in the active Looker project.
*   **Looker CLI**:
    ```bash
    looker-cli project create <project_id>
    looker-cli project checkout <project_id> <branch_name>
    ```
*   **Looker MCP**:
    *   List files in project: `get_project_files` (e.g., `{"project_id": "my_project"}`)
    *   Read specific file: `get_project_file` (e.g., `{"project_id": "my_project", "file_id": "views/raw/users.view.lkml"}`)
    *   Create new file: `create_project_file` (e.g., `{"project_id": "my_project", "file_id": "views/refined/users_rfn.view.lkml"}`)
    *   Update file contents: `update_project_file` (e.g., `{"project_id": "my_project", "file_id": "views/refined/users_rfn.view.lkml", "content": "..."}`)

### 4. LookML Quality & Server Validation
Validate that the LookML compiles perfectly on the Looker server before deployment.
*   **Looker CLI**:
    ```bash
    looker-cli project validate <project_id>
    ```
*   **Looker MCP**: Call the health and validation tools:
    *   Analyze project health: `health_analyze` (e.g., `{"project_id": "my_project"}`)
    *   Pulse check: `health_pulse`

### 5. Visual Dashboard to LookML Translation
Import visual dashboards designed by users in the Looker UI into code.
*   **Looker CLI**:
    ```bash
    looker-cli api dashboard dashboard_lookml <dashboard_id>
    ```
*   **Looker MCP**:
    *   Get list of dashboards: `get_dashboards`
    *   Get dashboard details: `run_dashboard`

### 6. Production Deployment
Deploy all validated changes to the production environment.
*   **Looker CLI**:
    ```bash
    looker-cli project deploy <project_id>
    ```

---

## 6. AI Agent Execution & Subagent Delegation Guidelines

To optimize execution speed, prevent token bloat, and avoid hitting turn or context limits in your agentic environment, follow these execution strategies:

### 1. Non-Interactive Scaffolding
When initializing a project, the main agent **MUST** execute the `looker_scaffold.py` script non-interactively in the terminal using Unix input piping (e.g., `echo -e "..." | python3 looker_scaffold.py`). Extract the project parameters (name, connection, dialect, tables) directly from the user's natural language prompt. Do not halt the terminal to ask the user for inputs.
*   **Naming Alignment**: The agent **must** pass the *exact* target project name of the Looker instance (e.g., `operational-intelligence-cloud-sql`) to the scaffolding script to ensure that the local directory structure and LookML model/project names match the Looker instance perfectly, preventing local/remote naming mismatches.

### 2. Parallel Dashboard Chunking by Subagents
Writing massive, multi-tab dashboards can be slow and token-heavy. The main agent **MUST** partition the dashboard creation process:
1.  **Define Layout & Tabs**: The main agent designs the overall dashboard structure and determines the tabs (e.g., Tab 1: Overview, Tab 2: Details).
2.  **Spawn Specialized Subagents**: For each tab defined, spawn a specialized generalist subagent.
3.  **Instruct Subagents**: Direct each subagent to write *only* the LookML elements belonging to their assigned tab. Emphasize that they must use the correct `tab_name` parameter and independent grid coordinates starting at `row: 0, col: 0`.
4.  **Merge & Compile**: Once all subagents return their respective LookML element arrays, the main agent compiles them into the `elements` array, defines the global `tabs` metadata array, and writes the final `.dashboard.lookml` file in one clean step.

### 3. Autonomous Surgical Refactoring
If a server-side validation check (`looker-cli project validate`) returns compilation, join, or syntax errors, the main agent **SHOULD** delegate the debugging loop to a specialized subagent. The subagent will surgically edit the specific files, rerun the validator locally, and only report back once the build is 100% green, keeping the main conversation focused and highly efficient.

### 4. Runtime SQL Debugging Loop (MCP-Assisted)
If dashboard queries return execution-time errors on the database (e.g., column not found, type coercion mismatch, invalid dialect functions):
1.  **Delegate to Subagent**: The main agent **MUST** delegate the SQL debugging loop to a specialized subagent.
2.  **Follow the Self-Healing Protocol**: The subagent must open and strictly follow the self-healing SQL debugging loop, telemetry checklists, and database dialect fixes defined in [references/sql_runtime_debugging.md](references/sql_runtime_debugging.md) using the Looker MCP tools.
3.  **Validate & Close**: Verify that all queries execute successfully on the live database (returning HTTP 200 and data) and the LookML compiles without syntax errors before reporting back to the main agent.

### 5. The Rule of Surgical Modification (No Full Rewrites)
To protect developer comments, preserve custom dimensions, and optimize API token efficiency, the agent **MUST** adhere to the following surgical editing protocol:
*   **Prohibition of Full Rewrites**: During any refactoring, self-healing, or debugging iteration on an *existing* LookML or dashboard file, the agent **MUST NOT** rewrite, regenerate, or reconstruct the entire file from scratch, nor generate global python scripts that rewrite files from scratch.
*   **Targeted Block Replacements**: The agent **MUST** perform surgical, localized block replacements (such as search-and-replace, line-targeted edits, or targeted tool calls) to modify *only* the specific broken or misaligned lines of code.
*   **Preservation**: Unrelated dimensions, measures, explore joins, and developer-written comments **MUST** remain completely untouched.

