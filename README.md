# Looker Developer Skills Repository

This repository contains a collection of "skills" designed to assist AI agents and developers in writing high-quality, standardized LookML code. Each skill encapsulates specific instructions, best practices, and examples for different aspects of Looker development.

## Installation & Usage

To use these skills in your own projects—especially to enhance AI assistants like **Gemini**, **Cursor**, **Antigravity**, or **Claude Code**—we recommend adding this repository to your project.

### Installation via npx skills add (Recommended)

The `skills` CLI is a tool used to install and manage specialized instructions (skills) for AI agents in your workspace. To install these LookML skills in your project, use `npx skills add`.

```bash
npx skills add looker-open-source/looker-skills
```

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
