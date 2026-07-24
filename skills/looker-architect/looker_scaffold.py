#!/usr/bin/env python3
import os
import sys
import re

# ANSI Color Codes for beautiful CLI output
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_banner():
    print(f"""
{BLUE}{BOLD}==================================================================
              LOOKER ARCHITECT SCAFFOLDER CLI (Enterprise)
==================================================================
Enforcing Google best practices & enterprise LookML standards.
{RESET}""")

def clean_snake_case(text):
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s_]', '', text)
    text = re.sub(r'[\s]+', '_', text)
    return text

def get_pop_sql(dialect):
    if dialect == "bigquery":
        interval_sql = "DATE_DIFF(${pop_filter_end_date}, ${pop_filter_start_date}, DAY)"
        prev_start_sql = """DATE_SUB(${pop_filter_start_date}, INTERVAL 
          {% if pop_compare_to._parameter_value == "'Yesterday'" %} 1 DAY
          {% elsif pop_compare_to._parameter_value == "'Week'" %} 1 WEEK
          {% elsif pop_compare_to._parameter_value == "'Month'" %} 1 MONTH
          {% elsif pop_compare_to._parameter_value == "'Year'" %} 1 YEAR
          {% else %} ${pop_interval_days} DAY
          {% endif %}
        )"""
    elif dialect == "snowflake":
        interval_sql = "DATEDIFF('day', ${pop_filter_start_date}, ${pop_filter_end_date})"
        prev_start_sql = """DATEADD(
          {% if pop_compare_to._parameter_value == "'Yesterday'" %} 'day', -1
          {% elsif pop_compare_to._parameter_value == "'Week'" %} 'week', -1
          {% elsif pop_compare_to._parameter_value == "'Month'" %} 'month', -1
          {% elsif pop_compare_to._parameter_value == "'Year'" %} 'year', -1
          {% else %} 'day', -${pop_interval_days}
          {% endif %},
          ${pop_filter_start_date}
        )"""
    else: # Redshift & PostgreSQL
        interval_sql = "DATEDIFF(day, ${pop_filter_start_date}, ${pop_filter_end_date})"
        prev_start_sql = """DATEADD(
          {% if pop_compare_to._parameter_value == "'Yesterday'" %} day, -1
          {% elsif pop_compare_to._parameter_value == "'Week'" %} week, -1
          {% elsif pop_compare_to._parameter_value == "'Month'" %} month, -1
          {% elsif pop_compare_to._parameter_value == "'Year'" %} year, -1
          {% else %} day, -${pop_interval_days}
          {% endif %},
          ${pop_filter_start_date}
        )"""
    
    return interval_sql, prev_start_sql

def main():
    print_banner()
    
    try:
        # 1. Ask for Project Name
        project_input = input(f"{BOLD}1. Enter Looker Project Name (e.g., Stripe Analytics): {RESET}").strip()
        if not project_input:
            print(f"{RED}Error: Project name cannot be empty.{RESET}")
            sys.exit(1)
        project_name = clean_snake_case(project_input)
        
        # 2. Ask for Connection Name
        connection_name = input(f"{BOLD}2. Enter Target Connection Name (e.g., prod_conn): {RESET}").strip()
        if not connection_name:
            connection_name = f"{project_name}_connection"
            print(f"{YELLOW}No connection entered. Defaulting to: {connection_name}{RESET}")
        
        # 3. Ask for Dataset/Schema Name
        dataset_name = input(f"{BOLD}3. Enter Database Dataset/Schema Name (e.g., raw_stripe): {RESET}").strip()
        if not dataset_name:
            dataset_name = "raw_dataset"
            print(f"{YELLOW}No dataset entered. Defaulting to: {dataset_name}{RESET}")
            
        # 4. Ask for Dialect
        print(f"{BOLD}4. Select Database Dialect:{RESET}")
        print("   1) Google BigQuery")
        print("   2) Snowflake")
        print("   3) Amazon Redshift / PostgreSQL")
        dialect_choice = input(f"{BOLD}Select option (1-3) [default: 1]: {RESET}").strip()
        if dialect_choice == "2":
            dialect = "snowflake"
            dialect_label = "Snowflake"
        elif dialect_choice == "3":
            dialect = "redshift_postgres"
            dialect_label = "Redshift/PostgreSQL"
        else:
            dialect = "bigquery"
            dialect_label = "Google BigQuery"
        print(f"{GREEN}Selected Dialect: {dialect_label}{RESET}")
        
        # 5. Ask for Base Tables
        tables_input = input(f"{BOLD}5. Enter Base Tables (comma-separated, e.g., users, orders): {RESET}").strip()
        if not tables_input:
            print(f"{RED}Error: You must enter at least one base table.{RESET}")
            sys.exit(1)
        tables = [clean_snake_case(t) for t in tables_input.split(",") if t.strip()]
        
        print(f"\n{BLUE}Generating files for project: {BOLD}{project_name}{RESET}...\n")
        
        # Create Folder Structure
        folders = ["views/raw", "views/refined", "explores", "tests", "dashboards"]
        for folder in folders:
            os.makedirs(folder, exist_ok=True)
            print(f" ✓ Created directory: {folder}")
            
        # Write manifest.lkml
        manifest_content = f"""project_name: "{project_name}"

# --------------------------------------------------------------------------
# Constants (Marketplace parameterization)
# --------------------------------------------------------------------------

constant: CONNECTION_NAME {{
  value: "{connection_name}"
  export: override_optional
}}

constant: DATASET_NAME {{
  value: "{dataset_name}"
  export: override_optional
}}

# --------------------------------------------------------------------------
# Advanced Drilling & Visualization Configurations Library
# --------------------------------------------------------------------------

constant: DRILL_LINE_VIZ {{
  value: "{{% assign vis_config = '{{
    \\"type\\": \\"looker_line\\",
    \\"x_axis_gridlines\\": false,
    \\"y_axis_gridlines\\": true,
    \\"show_view_names\\": false,
    \\"show_y_axis_labels\\": true,
    \\"show_y_axis_ticks\\": true,
    \\"show_x_axis_label\\": true,
    \\"show_x_axis_ticks\\": true,
    \\"interpolation\\": \\"linear\\",
    \\"show_null_points\\": true
  }}' %}}"
}}

constant: DRILL_COLUMN_VIZ {{
  value: "{{% assign vis_config = '{{
    \\"type\\": \\"looker_column\\",
    \\"x_axis_gridlines\\": false,
    \\"y_axis_gridlines\\": true,
    \\"show_view_names\\": false,
    \\"show_y_axis_labels\\": true,
    \\"show_y_axis_ticks\\": true,
    \\"show_x_axis_label\\": true,
    \\"show_x_axis_ticks\\": true,
    \\"stacking\\": \\"\\",
    \\"show_value_labels\\": true
  }}' %}}"
}}

constant: DRILL_PIE_VIZ {{
  value: "{{% assign vis_config = '{{
    \\"type\\": \\"looker_pie\\",
    \\"value_labels\\": \\"legend\\",
    \\"label_type\\": \\"labPer\\",
    \\"inner_radius\\": 50,
    \\"show_view_names\\": false
  }}' %}}"
}}
"""
        with open("manifest.lkml", "w") as f:
            f.write(manifest_content)
        print(" ✓ Generated: manifest.lkml")
        
        # Write model file
        model_filename = f"{project_name}.model.lkml"
        model_content = f"""# Connection constant from manifest
connection: "@{{CONNECTION_NAME}}"

# Include all refined views (which automatically include their raw views)
include: "/views/refined/*.view.lkml"

# Include modular explores and tests
include: "/explores/*.explore.lkml"
include: "/tests/*.test.lkml"

# --------------------------------------------------------------------------
# Centralized Caching Caching (Datagroups)
# --------------------------------------------------------------------------
datagroup: default_datagroup {{
  sql_trigger: SELECT 1 ;; # Replace with ETL trigger (e.g., SELECT MAX(id) FROM table)
  max_cache_age: "24 hours"
}}

persist_with: default_datagroup
"""
        with open(model_filename, "w") as f:
            f.write(model_content)
        print(f" ✓ Generated: {model_filename}")
        
        # Get PoP SQL queries based on dialect
        interval_sql, prev_start_sql = get_pop_sql(dialect)
        
        # Generate Views, Explores, and Tests for each table
        for table in tables:
            # 1. Raw View
            raw_view_path = f"views/raw/{table}.view.lkml"
            raw_content = f"""view: {table} {{
  sql_table_name: @{{DATASET_NAME}}.{table} ;;

  # --------------------------------------------------------------------------
  # Raw Dimensions (1:1 Table Columns Mapping)
  # --------------------------------------------------------------------------

  dimension: id {{
    primary_key: yes
    type: string
    sql: ${{TABLE}}.id ;;
  }}
}}
"""
            with open(raw_view_path, "w") as f:
                f.write(raw_content)
            print(f" ✓ Generated raw view: {raw_view_path}")
            
            # 2. Refined View (with functional ordering and PoP template)
            refined_view_path = f"views/refined/{table}_rfn.view.lkml"
            refined_content = f"""include: "/views/raw/{table}.view.lkml"

view: +{table} {{

  # =========================================================================
  # 1. PERIOD OVER PERIOD LOGIC (Liquid-Templated)
  # =========================================================================

  filter: pop_date_filter {{
    view_label: "_PoP"
    label: "Comparison Date Filter"
    description: "Select the current date range to compare against the previous period."
    type: date
    default_value: "7 days"
  }}

  parameter: pop_compare_to {{
    view_label: "_PoP"
    label: "Compare To"
    description: "Select the offset interval for the previous period comparison."
    type: string
    allowed_value: {{ value: "Yesterday" }}
    allowed_value: {{ value: "Week" }}
    allowed_value: {{ value: "Month" }}
    allowed_value: {{ value: "Year" }}
    default_value: "Year"
  }}

  dimension: pop_data_date {{
    hidden: yes
    type: date
    sql: CAST(${{TABLE}}.created_at AS DATE) ;; # Update with your date/timestamp column
  }}

  dimension_group: pop_filter_start {{
    hidden: yes
    type: time
    timeframes: [raw, date]
    sql: CASE WHEN {{% date_start pop_date_filter %}} IS NULL THEN '1970-01-01' ELSE CAST({{% date_start pop_date_filter %}} AS DATE) END ;;
  }}

  dimension_group: pop_filter_end {{
    hidden: yes
    type: time
    timeframes: [raw, date]
    sql: CASE WHEN {{% date_end pop_date_filter %}} IS NULL THEN CURRENT_DATE ELSE CAST({{% date_end pop_date_filter %}} AS DATE) END ;;
  }}

  dimension: pop_interval_days {{
    hidden: yes
    type: number
    sql: {interval_sql} ;;
  }}

  dimension: pop_previous_start_date {{
    hidden: yes
    type: date
    sql: {prev_start_sql} ;;
  }}

  dimension: pop_is_current_period {{
    hidden: yes
    type: yesno
    sql: ${{pop_data_date}} > ${{pop_filter_start_date}} AND ${{pop_data_date}} <= ${{pop_filter_end_date}} ;;
  }}

  dimension: pop_is_previous_period {{
    hidden: yes
    type: yesno
    sql: ${{pop_data_date}} > ${{pop_previous_start_date}} AND ${{pop_data_date}} <= ${{pop_filter_start_date}} ;;
  }}

  dimension: pop_period_group {{
    view_label: "_PoP"
    label: "Comparison Period"
    description: "Pivots dates into Selected Period, Previous Period, or Excluded."
    type: string
    case: {{
      when: {{
        sql: ${{pop_is_current_period}} = true ;;
        label: "Selected Period"
      }}
      when: {{
        sql: ${{pop_is_previous_period}} = true ;;
        label: "Previous Period"
      }}
      else: "Not in time period"
    }}
  }}

  # =========================================================================
  # 2. KEYS (Primary & Foreign)
  # =========================================================================

  dimension: id {{
    primary_key: yes
    type: string
    label: "ID"
    description: "Unique internal identifier."
    group_label: "Identifiers"
    sql: ${{TABLE}}.id ;;
  }}

  # =========================================================================
  # 3. DIMENSIONS (Attributes)
  # =========================================================================

  # Add custom descriptive dimensions here...

  # =========================================================================
  # 4. MEASURES (Aggregations - Use _count/_total/_amount Suffixes)
  # =========================================================================

  measure: {table}_count {{
    type: count
    label: "{table.replace('_', ' ').title()} Count"
    description: "Total number of {table.replace('_', ' ')}."
    group_label: "Counts"
    drill_fields: [detail*]
  }}

  # PoP Measures (Safe Math and Substitution Operator Compliant)

  measure: {table}_count_selected {{
    view_label: "_PoP"
    label: "{table.replace('_', ' ').title()} Count (Selected Period)"
    description: "Total count during the selected period."
    type: count
    filters: [pop_period_group: "Selected Period"]
    sql: ${{{table}_count}} ;;
  }}

  measure: {table}_count_previous {{
    view_label: "_PoP"
    label: "{table.replace('_', ' ').title()} Count (Previous Period)"
    description: "Total count during the previous comparison period."
    type: count
    filters: [pop_period_group: "Previous Period"]
    sql: ${{{table}_count}} ;;
  }}

  measure: {table}_count_pop_change {{
    view_label: "_PoP"
    label: "{table.replace('_', ' ').title()} Count PoP % Change"
    description: "Percentage change in count between current and previous periods."
    type: number
    value_format_name: percent_1
    sql: 1.0 * (${{{table}_count_selected}} - ${{{table}_count_previous}}) / NULLIF(${{{table}_count_previous}}, 0) ;;
    html:
      {{% if value >= 0 %}}
        <span style="color: #0F9D58;">▲ {{{{ rendered_value }}}}</span>
      {{% else %}}
        <span style="color: #DB4437;">▼ {{{{ rendered_value }}}}</span>
      {{% endif %}} ;;
  }}

  # =========================================================================
  # 5. FILTERS & PARAMETERS (User Inputs)
  # =========================================================================

  # Add custom filter fields here...

  # =========================================================================
  # 6. SETS (Drill Paths)
  # =========================================================================

  set: detail {{
    fields: [
      id
    ]
  }}
}}
"""
            with open(refined_view_path, "w") as f:
                f.write(refined_content)
            print(f" ✓ Generated refined view: {refined_view_path}")
            
            # 3. Explore File
            explore_path = f"explores/{table}.explore.lkml"
            explore_content = f"""include: "/views/refined/{table}_rfn.view.lkml"

explore: {table} {{
  label: "{table.replace('_', ' ').title()}"
  description: "Use this Explore to analyze {table.replace('_', ' ')} details."
  view_name: {table}
}}
"""
            with open(explore_path, "w") as f:
                f.write(explore_content)
            print(f" ✓ Generated explore: {explore_path}")
            
            # 4. Test File
            test_path = f"tests/{table}.test.lkml"
            test_content = f"""include: "/explores/{table}.explore.lkml"

test: {table}_pk_is_unique {{
  explore_source: {table} {{
    column: id {{ field: {table}.id }}
    column: {table}_count {{ field: {table}.{table}_count }}
    
    # Optional: filter to optimize performance
    # filters: {{
    #   field: {table}.pop_data_date
    #   value: "last 7 days"
    # }}
  }}

  assert: pk_uniqueness_verified {{
    expression: ${{{table}.{table}_count}} = 1 ;;
    description: "Verifies that the primary key is unique."
  }}
}}
"""
            with open(test_path, "w") as f:
                f.write(test_content)
            print(f" ✓ Generated unit test: {test_path}")

        # Write README.md placeholder
        readme_content = f"""# {project_input} Looker Block

This premium, modular Looker Block is pre-scaffolded to support enterprise-grade analytics on the `{dataset_name}` schema.

## Features
*   **Separation of Concerns**: Raw schemas are mapped in `views/raw/` while refined calculations reside in `views/refined/`.
*   **Period-over-Period (PoP) Engine**: Dynamic timeframe comparisons integrated natively into each refined view.
*   **DevOps Ready**: Out-of-the-box support for modular explores, unit testing, and centralized constants.

## Dialect
*   Target Dialect: **{dialect_label}**
*   Target Connection: `{connection_name}`

## Structure
*   `views/raw/`: Raw database column mappings.
*   `views/refined/`: Business logic, custom labels, PoP measures.
*   `explores/`: Independent, modular explore definitions.
*   `tests/`: LookML unit tests validating primary keys.
*   `dashboards/`: Packaged LookML dashboards.

## Installation
1.  Import this repository into your Looker instance.
2.  Override the `CONNECTION_NAME` and `DATASET_NAME` constants in your `manifest.lkml` to match your local connection.
3.  Deploy the branch to production.
"""
        with open("README.md", "w") as f:
            f.write(readme_content)
        print(" ✓ Generated: README.md")
        
        print(f"\n{GREEN}{BOLD}==================================================================")
        print(f"              SCAFFOLDING COMPLETED SUCCESSFULLY!")
        print(f"=================================================================={RESET}")
        print(f"Your project is now fully initialized following enterprise LookML standards.")
        print(f"Next step: Open your editor and start developing in {BOLD}views/refined/{RESET}!\n")
        
    except KeyboardInterrupt:
        print(f"\n{RED}Process interrupted by user. Exiting.{RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
