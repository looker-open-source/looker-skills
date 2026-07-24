# Looker Architect (Master Developer Skill & Automation Toolkit)

The **Looker Architect** is a premium, enterprise-grade developer skill, automation scaffolder, and self-healing QA auditing toolkit designed for Google's Gemini CLI and AI agent environments. Built upon the architectural standards and design principles used internally at Google to engineer official Looker Blocks, it enforces the highest quality standards of LookML development, aligning your repositories with Google Cloud best practices and enterprise data governance guidelines.

Whether you are bootstrapping a new project from scratch, refactoring legacy code, or auditing live dashboards, this skill transforms your Gemini CLI agent into a world-class senior Looker consultant.

---

## 1. Core Capabilities & Operating Modes

This skill operates in two distinct modes depending on the lifecycle phase of your Looker repository:

### Mode A: Greenfield (New Projects from Scratch)
Accelerate your development cycle by bootstrapping a 100% compliant, modular project structure in **1 second**. The agent leverages the local Python utility `looker_scaffold.py` non-interactively to generate:
*   Parameterized `manifest.lkml` (with connection, dataset, and advanced visualization drill constants).
*   Clean, boilerplate `.model.lkml` with structured caching policies (datagroups).
*   Strict raw column mappings in `views/raw/` with primary keys at the top.
*   Refined views in `views/refined/` pre-populated with standard functional sequencing headers, advanced visual drill links, and dynamic Period-over-Period (PoP) templates.

### Mode B: Brownfield (Audit, Refactor & Upgrade Legacy Projects)
Bring any existing, messy, or legacy Looker project up to enterprise standards. The agent audits your active repository, detects architectural deviations, and spawns specialized subagents to refactor the code in place:
*   **Separation of Concerns**: Splits monolithic views into clean 1:1 raw views and refined views utilizing LookML refinements (`view: +view_name`).
*   **Functional Sequencing**: Reorders all view fields into the strict sequence: **Keys ➔ Dimensions ➔ Measures ➔ Filters ➔ Sets**.
*   **KPI Single-Value PoP Comparison Tiles**: Converts raw, single-value dashboard tiles to the two-measure PoP comparison pattern, displaying the current value and the percentage change compared to the previous period.
*   **Advanced Visual Drilling**: Equips all major count and metric measures with interactive, custom drill links (e.g., trend lines, distribution donut charts, styled detail grid tables) using Liquid templated URLs and manifest constants.
*   **Native Tabbed Dashboards**: Replaces obsolete, high-maintenance HTML/Liquid navigation tiles with native Looker tabbed layouts (`tabs:`), resetting grid coordinates to `row: 0, col: 0` for each tab to enable clean rendering.
*   **Self-Healing SQL Loop**: Audits and repairs execution-time database crashes.

---

## 2. Advanced Feature Standards Enforced

This skill guarantees the implementation of two signature, high-value Looker features:

### A. Period-over-Period (PoP) Dashboard KPI Tiles
KPIs should never be displayed in isolation. This skill enforces the **Two-Measure Dashboard PoP Pattern** for all `single_value` scorecards:
1.  **Dual Measure Querying**: The tile queries exactly two measures: the current period value (e.g., `pop_total_errors_current`) and the percentage change (e.g., `pop_total_errors_change`).
2.  **Comparison Activation**: The tile is configured with `show_comparison: true`, `comparison_type: change`, and a descriptive `comparison_label: "vs Last Period"`.
3.  **Filter Mapping**: The dashboard date filter is mapped directly to the explore's `pop_date_filter` to drive the underlying Period-over-Period SQL engine dynamically.

### B. Advanced Visual Drilling (Liquid Templated URLs)
Clicking a metric on a dashboard should never open a boring, unstyled raw text table. This skill enforces **Custom Visual Drilling** across all core measures:
1.  **Visualization Constant Library**: Centralizes JSON visualization configurations in the `manifest.lkml` (e.g., `VIZ_STACKED_AREA`, `VIZ_DONUT_CHART`, `VIZ_GRID_TABLE`).
2.  **The `drill_fields` Quirk**: Enforces defining an empty array `drill_fields: []` on the measure to force the Looker frontend to activate the hyperlink action.
3.  **Liquid URL Injection**: Injects custom `link` blocks using Liquid assigns and encoded URI parameters to render beautiful, pre-configured pop-up charts instantly:
    `url: "@{VIZ_CONSTANT_NAME}{{ link }}&fields=...&limit=50&vis_config={{ vis_config | encode_uri }}&toggle=dat,pik,vis"`

---

## 3. The Self-Healing SQL Loop Protocol (MCP-Assisted)

Server-side LookML compilation only checks syntax, not database execution compatibility. To prevent broken charts in production, this skill implements an automated **Self-Healing SQL Loop** powered by the **Looker MCP Server**:

```
[LookML Compiles] ➔ [MCP: Run Dashboard Queries] ➔ [Crashes?] ➔ [Yes] ➔ [MCP: Inspect Table Schema] ➔ [Repair LookML] ➔ [Re-run Query] ➔ [Succeeds (200 OK)] ➔ [🚀 Verified Done]
```

1.  **Query Execution**: The agent uses the MCP tools `run_dashboard` or `query` to execute all dashboard tile queries on the live database (e.g., Spanner, BigQuery).
2.  **Error Interception**: If a query crashes (e.g., Spanner gRPC `Name query_text not found` or `No matching signature for function DATE`), the agent captures the exception.
3.  **Schema Reconciliation & Dialect Correction**: 
    *   The agent calls MCP `get_connection_table_columns` to check the *actual, real database schema* (e.g., finding that Spanner's physical column is named `text`, not `query_text`).
    *   The agent applies the **Looker Dialect Auto-Wrapping Rule** to prevent double-casting signature crashes (e.g., removing manual `CAST(... AS DATE)` on timestamp fields and letting Looker wrap them natively in `DATE()`).
4.  **Surgical Repair**: The agent performs surgical, localized block replacements (no full rewrites) to correct the LookML view `sql:` mappings, and re-verifies until the queries return `HTTP 200` with data.

---

## 4. Standard Directory Layout

Every project managed by this skill conforms to this clean, modular structure:

```
├── views/
│   ├── raw/                 # 1:1 database column mappings (No business logic or measures)
│   │   └── [view_name].view.lkml
│   └── refined/             # Business logic, measures, PoP, and group labels (Refinements)
│       └── [view_name]_rfn.view.lkml
├── explores/                # Modular Explore files (one explore per file: *.explore.lkml)
│   └── [explore_name].explore.lkml
├── tests/                   # Data integrity unit tests (one suite per explore: *.test.lkml)
│   └── [explore_name].test.lkml
├── dashboards/              # Version-controlled LookML dashboards (Native Tabs Only)
│   └── [dashboard_name].dashboard.lookml
├── [project_name].model.lkml # Connection, caching datagroups, and modular includes only
└── manifest.lkml            # Centralized constants & advanced visualization drill library
```

---

## 5. Looker CLI & MCP Tooling Reference

The agent seamlessly integrates with both the **Looker CLI** and the **Looker MCP Server** to manage the project lifecycle:

| Action | Looker CLI Command | Looker MCP Tool |
| :--- | :--- | :--- |
| **Developer Mode** | `looker-cli session update dev` | `dev_mode(state: true)` |
| **Database Schema** | *N/A* | `get_connection_table_columns` |
| **List Files** | *N/A* | `get_project_files` |
| **Read File** | *N/A* | `get_project_file` |
| **Write/Update File**| *N/A* | `create_project_file`, `update_project_file` |
| **Validate LookML** | `looker-cli project validate <id>`| `health_analyze`, `health_pulse` |
| **Import Dashboard**| `looker-cli api dashboard ...` | `get_dashboards`, `run_dashboard` |
| **Production Deploy**| `looker-cli project deploy <id>` | *N/A* |

---

## 6. Enterprise Business Use Cases & Enriched Prompts

You can invoke this skill in your **Gemini CLI** terminal using these copy-pasteable prompts tailored for each core use case, pre-configured to enforce PoP tiles and advanced drilling:

### Use Case 1: Greenfield Project Bootstrapping (with Drilling & PoP)
*   **Description**: Initialize a brand new, fully compliant Looker project structure with pre-configured drilling constants and PoP templates.
*   **Gemini CLI Prompt**:
    ```text
    Act as a Looker Architect. Using the skill from looker-architect, bootstrap a new Greenfield project called 'stripe_analytics'. Connection name is 'stripe_production', dataset is 'stripe_raw', dialect is BigQuery, and base tables are 'charges' and 'refunds'. Initialize the structure using the local scaffolder tool. In manifest.lkml, pre-populate our standard visual drilling constants (VIZ_LINE_CHART, VIZ_DONUT_CHART, VIZ_GRID_TABLE). In the refined views, ensure core count and amount measures are pre-configured with the empty drill_fields quirk and at least 2 custom visual drill links.
    ```

### Use Case 2: Automated Senior Code Reviewer (PR Quality Gate)
*   **Description**: Run a comprehensive, read-only audit on a developer's branch before merging to production to ensure style and feature compliance.
*   **Gemini CLI Prompt**:
    ```text
    Act as a Looker Code Auditor. Read my active project files and perform a comprehensive, read-only style and standards audit. Check for raw/refined separation, functional field sequencing, presence of primary key unit tests, and verify if any measures contain prohibited SQL aggregates. Verify that all core measures implement custom visual drill links using manifest constants, and that all Key KPI scorecards in our dashboards implement the two-measure PoP comparison pattern. Do not modify any files. Generate an Audit Finding Report.
    ```

### Use Case 3: Legacy Code Modernization (Brownfield Refactoring & Feature Upgrades)
*   **Description**: Automatically refactor an unstructured Looker project and upgrade it with PoP KPI tiles and visual drilling.
*   **Gemini CLI Prompt**:
    ```text
    Act as a Looker Architect. We are in Brownfield Mode. Audit and refactor my active Looker project to meet the enterprise LookML standards. Reorganize the directory structure into views/raw/ and views/refined/, re-sequence all view fields, and replace any HTML navigation dashboards with native tabbed dashboards. Additionally:
    1. Convert all single_value dashboard KPI cards to the two-measure PoP comparison pattern, querying current and change metrics, and mapping filters to the explore's pop_date_filter.
    2. Enrich all major measures in our refined views with at least 2 custom visual drill links using manifest constants and empty drill_fields arrays.
    Apply all refactorings surgically in-place.
    ```

### Use Case 4: Self-Healing QA Testing (Zero-Downtime Dashboards & Auto-Wrapping Fixes)
*   **Description**: Execute all dashboard queries against the live database, auto-healing SQL crashes and dialect double-wrapping errors.
*   **Gemini CLI Prompt**:
    ```text
    Act as a Looker Architect. The database connection is active. I want you to run the Self-Healing SQL Loop on our dashboard. Execute all queries via Looker MCP. If any query fails due to database-specific schema changes, casting errors, or dialect double-wrapping (such as Spanner wrapping DATE(CAST(col AS DATE))), spawn a subagent, inspect the database schema via MCP, apply the Dialect Auto-Wrapping Rule to surgically fix the LookML in-place, and re-verify until all queries return HTTP 200 successfully.
    ```

### Use Case 5: Standard LookML Code Auditor (ReadOnly)
*   **Description**: Run a compliance check on a folder to evaluate the quality score of the codebase.
*   **Gemini CLI Prompt**:
    ```text
    Act as a Looker Code Auditor. I want you to run a read-only compliance audit on my active Looker repository. Check for Raw vs Refined view separation, field sequencing, and proper use of constants. Evaluate if our dashboards use native tabs and if our KPI tiles leverage PoP comparisons. Do not edit any files. Provide a LookML Quality Compliance Score from 0 to 100 with a list of required remediations.
    ```

---

## 7. Installation & Developer Setup

To integrate this master skill into your local environment:

1.  **Clone the repository** to your local workstation:
    ```bash
    git clone https://github.com/looker-open-source/looker-skills.git
    ```
2.  **Link the skill locally** in your Gemini CLI (highly recommended for developers, as updates to the source files are reflected instantly without re-installation):
    ```bash
    gemini skills link /absolute/path/to/looker-skills/skills/looker-architect
    ```
3.  **Verify the installation**:
    ```bash
    gemini skills list
    ```
    Ensure `looker-architect` appears in the list of discovered and enabled skills. You are now ready to build elite enterprise LookML projects!
