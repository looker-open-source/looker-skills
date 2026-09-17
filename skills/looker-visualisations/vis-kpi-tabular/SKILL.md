---
name: vis-kpi-tabular
description: Authoring next-gen single-value KPI cards with embedded sparklines, table calculation comparisons, custom Liquid tooltips, and modern Looker Grids with collapsible row-groups and subtotals.
---

# Tabular & KPI Visualizations (`vis-kpi-tabular`)

## 1. Single Value KPI Cards with Sparklines (`single_value`)
In 2026, Looker KPI cards support sparklines without requiring custom HTML blocks.

### Essential Rules:
* `modern2026: true` and `smart_single_value_size: true`: Enforces balanced typography.
* `show_chart_component: true` & `show_x_axis: true`: Enables the embedded mini sparkline.
* Query fields: Must include a time dimension (e.g. `orders.created_year`) + KPI measure with `fill_fields: [time_dimension]` and `sorts: [time_dimension desc]`.
* Row Limit: Limit sparkline queries to `limit: 50` for optimal trendline rendering.
* Sizing: Standard card `height: 14`, and quarter-width (`width: 18`) or half-width (`width: 36`).
* Comparison calculation: Add a `table_calculation` for `percent_difference_from_previous`, set `show_comparison: true`, and `comparison_row: first`.
* Value formatting: Use compact format: `value_format: '[>=1000000]0.0,," M";[>=1000]$0," K";0'`.
* Tooltips: Provide rich tooltips via `global_tooltip_options` with Liquid tags.

## 2. Modern Looker Grid (`looker_grid`) with Row Groups
Enables pivotless multi-level grouping with native subtotals.

### Configuration Parameters:
* Sizing: Standard `height: 14` (or `height: 18` for deeply nested hierarchies), default half-width `width: 36` or full-width `width: 72`.
```yaml
row_groups:
  enabled: true
  default_display_level: collapsed
  row_grouping_fields:
    - users.country
    - users.state
    - users.city
  configurable_subtotals: true
table_column_hover_highlight_enable: true
table_column_hover_highlight_color: "#EAC43B"
table_custom_border_enable: true
table_custom_border_color: "#4285F4"
table_custom_border_style: dotted
```
