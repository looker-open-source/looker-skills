# Looker Developer Skills Repository

This repository contains a collection of "skills" designed to assist AI agents and developers in writing high-quality, standardized LookML code and guiding them through Looker onboarding. Each skill encapsulates specific instructions, best practices, and examples for different aspects of Looker development.

## Installation & Usage

To use these skills in your own projects—especially to enhance AI assistants like **Gemini**, **Cursor**, **Antigravity**, or **Claude Code**—we recommend adding this repository to your project.

### Installation via npx skills add (Recommended)

The `skills` CLI is a tool used to install and manage specialized instructions (skills) for AI agents in your workspace. To install these LookML skills in your project, use `npx skills add`.

```bash
npx skills add looker-open-source/looker-skills
```

### Installing as an Agent Plugin

You can install this repository as a plugin in your favorite AI coding agent to expose these LookML and onboarding skills:

#### Antigravity CLI
Install the plugin directly from the Git repository:
```bash
agy plugin install https://github.com/looker-open-source/looker-skills
```

#### Claude Code
First, clone the repository locally:
```bash
git clone https://github.com/looker-open-source/looker-skills.git
```

To run Claude Code with the plugin loaded temporarily:
```bash
claude --plugin-dir ./looker-skills
```

To install the plugin persistently:
```bash
claude plugin install ./looker-skills
```

#### Codex
Run the installer script to clone the repository locally and register it in your personal marketplace:
```bash
curl -sSL -o codex-install.sh https://raw.githubusercontent.com/looker-open-source/looker-skills/main/codex-install.sh && bash codex-install.sh
```
Once complete, restart Codex and open the plugin manager (`/plugins`) to verify that the **Looker Developer Skills** plugin is active.

## Core LookML Skills

These skills provide specific instructions for creating and modifying LookML objects.

### Models
*   **[lookml-model](skills/lookml-model/SKILL.md)**: Instructions for creating and configuring Model files, including connections and includes.

### Explores
*   **[lookml-explore](skills/lookml-explore/SKILL.md)**: Basic Explore definition, including descriptions, labels, and basic joins.
*   **[lookml-explore-joins](skills/lookml-explore/references/joins.md)**: Detailed guidance on defining joins, relationships, and SQL conditions.
*   **[lookml-explore-advanced](skills/lookml-explore/references/advanced.md)**: Advanced configurations like `access_filter`, `sql_always_where`, and UNNESTing arrays.

### Views
*   **[lookml-view](skills/lookml-view/SKILL.md)**: Standard View definitions, `sql_table_name`, and file organization (Standard, Extended, Refined).
*   **[lookml-view-derived-table](skills/lookml-view/references/derived_table.md)**: Creating Native Derived Tables (NDT) and SQL Derived Tables (SDT).
*   **[lookml-refinements](skills/lookml-refinements/SKILL.md)**: Deep dive into LookML includes, refinements (layering), and project structure best practices.
*   **[lookml-sets](skills/lookml-sets/SKILL.md)**: Guide to using LookML sets for grouping fields, controlling visibility, and managing drill paths.

### Fields
*   **[lookml-fields](skills/lookml-fields/SKILL.md)**: Overview of LookML field types (Dimension, Measure, Filter, Parameter) and the role of the `sql` parameter in each.
*   **[lookml-fields-dimension](skills/lookml-fields/references/dimension.md)**: Creating Dimensions, including HTML, links, and tier types.
*   **[lookml-fields-measure](skills/lookml-fields/references/measure.md)**: Creating Measures, including aggregation types and drill fields.
*   **[lookml-fields-dimension-group](skills/lookml-fields/references/dimension_group.md)**: Defining Dimension Groups for time and duration, including timeframe best practices.
*   **[lookml-fields-filter-parameter](skills/lookml-fields/references/filter_parameter.md)**: Creating Filter-only fields and Parameters for dynamic interactivity.
*   **[lookml-fields-value-format](skills/lookml-fields/references/value_format.md)**: Standard and custom formatting for numeric and currency fields.

## Advanced Functionality

### Logic & Security
*   **[lookml-liquid](skills/lookml-liquid/SKILL.md)**: Using Liquid variables for dynamic SQL, HTML, and links.
*   **[lookml-access-grants](skills/lookml-access-grants/SKILL.md)**: Implementing `access_grant` and `required_access_grants` for row-level security.
*   **[lookml-tests](skills/lookml-tests/SKILL.md)**: Writing LookML tests for Views and Explores.

### Performance & Optimization
*   **[looker-performance-optimizer](skills/looker-performance-optimizer/SKILL.md)**: Master developer skill for auditing, diagnosing, and optimizing query performance in Looker projects, including caching, PDT strategies, and SQL profiling.
*   **[lookml-caching-datagroups](skills/looker-performance-optimizer/references/caching_datagroups.md)**: Caching alignment strategies, ETL-triggered datagroups, and persistency tuning.
*   **[lookml-query-diagnostics](skills/looker-performance-optimizer/references/query_diagnostic.md)**: Guidelines for running diagnostic queries, analyzing SQL explain plans, and identifying bottlenecks.
*   **[lookml-pdt-optimization](skills/looker-performance-optimizer/references/pdt_optimization.md)**: PDT optimization standards, index/partition configurations, and incremental materializations.
*   **[lookml-refactoring](skills/looker-performance-optimizer/references/lookml_refactoring.md)**: Field-level optimization, join pruning, and eliminating redundant calculations.

## Developer Onboarding Skills

These skills guide new Looker developers and agents through database exploration, CLI setup, project configuration, LookML modeling, and dashboard creation.

*   **[looker-developer-onboarding](skills/looker-developer-onboarding/SKILL.md)**: Orchestrator skill coordinating the e2e onboarding journey.
*   **[onboarding-preflight-check](skills/onboarding-preflight-check/SKILL.md)**: Verifying local system prerequisites (`gcloud`, `bq`, permissions) and cloud IAM roles.
*   **[exploring-data-for-looker](skills/exploring-data-for-looker/SKILL.md)**: Exploring BigQuery data schemas to define onboarding goals.
*   **[installing-looker-cli](skills/installing-looker-cli/SKILL.md)**: Verifying the CLI installation.
*   **[authenticating-looker-cli](skills/authenticating-looker-cli/SKILL.md)**: Authenticating the CLI via OAuth.
*   **[connecting-looker-to-bigquery](skills/connecting-looker-to-bigquery/SKILL.md)**: Creating a database connection to BigQuery.
*   **[setting-up-looker-project](skills/setting-up-looker-project/SKILL.md)**: Creating Looker project and Git repo.
*   **[creating-lookml-model](skills/creating-lookml-model/SKILL.md)**: Defining views, explores, models, and running verification queries.
*   **[creating-looker-dashboard](skills/creating-looker-dashboard/SKILL.md)**: Creating LookML dashboard, importing UDD, and iterating on feedback.
*   **[lookml-modeling-guidelines](skills/lookml-modeling-guidelines/SKILL.md)**: Consolidated LookML modeling best practices and CLI commands syntax.


