---
name: vis-cartesian
description: Authoring Cartesian and comparison charts (Column, Bar, Line, Area, Combo Charts, Waterfall), native 2026 Histograms with dynamic binning, Donut/Pie charts with inner cutout percentages, clean y-axes, and benchmark reference lines.
---

# Cartesian & Comparison Visualizations (`vis-cartesian`)

## 1. Column, Bar & Line Charts
* **Default Geometry**: Half-width `width: 36` and standard `height: 14` to allow 2 side-by-side elements per row.
* **Row Limits**: Cap queries to `limit: 50` (or fewer for categorical comparisons).
* **Interactive Zoom**: Always set `x_axis_zoom: true` and `y_axis_zoom: true` on categorical series.
* **Value Labels & Clean Y-Axes**:
  * Enable `show_value_labels: true` with `label_value_format: '$#,##0,"K"'`.
  * **Suppress Redundant Y-Axis Values**: When value labels are displayed on the bars, eliminate visual clutter by hiding y-axis numbers:
    ```yaml
    y_axes: [{showValues: false}]
    ```
* **Benchmark Lines**: Add native reference lines for averages:
  ```yaml
  reference_lines:
    - reference_type: line
      line_value: mean
      label_position: right
      color: "#000000"
  ```

## 2. Combo Charts: Bar + Line Combinations (`series_types`)
To compare volume metrics alongside variance or difference trends on a single visual:
* **Base Type**: Set `type: looker_line`.
* **Series Overrides**: Use `series_types` to render baseline measures as columns/bars while leaving variance or growth rate measures as lines:
  ```yaml
  series_types:
    orders.order_count_last_year: column
    orders.count: column
  ```
* **Suppressing 0 and Null Values**: Where a metric value is 0 or null, do not plot it. Enforce:
  ```yaml
  show_null_points: false
  show_null_labels: false
  ```
  Additionally, add a filter if necessary to exclude non-contributing zero periods (e.g. `filters: { orders.count: ">0" }`).
* **Distinct Accents**: Give the line metric a high-contrast accent color and circular data points:
  ```yaml
  series_colors:
    orders.count: "#1A73E8"
    orders.order_count_last_year: "#8AB4F8"
    orders.order_count_last_year_difference: "#E52592"
  point_style: circle_outline
  ```

## 3. Waterfall Stage & Variance Charts (`looker_waterfall`)
Used to illustrate how positive and negative steps contribute to a final cumulative total (e.g. tracking how revenue accumulates or drops across order stages like Processing → Shipped → Complete vs Cancelled/Returned):
* **Query Shape**: 1 categorical dimension (e.g. `order_items.status`) and 1 measure (e.g. `order_items.total_sale_price`).
* **Colors & Styling**:
  ```yaml
  type: looker_waterfall
  up_color: "#1e8e3e"
  down_color: "#d93025"
  total_color: "#1a73e8"
  show_value_labels: true
  label_value_format: "$#,##0,\"K\""
  ```
* **Row Limits**: Cap at `limit: 20` for clean step-by-step balance bridges.

## 4. Plotting Dimensions on the Y-Axis
Looker Cartesian charts expect measures or numeric fields on the y-axis. If a business question asks to plot a discrete dimension (such as an SLA tier, survey rating, or customer age) on the y-axis:
* **Table Calculation Bridge**: Create a table calculation casting the dimension as a numeric measure:
  ```yaml
  dynamic_fields:
    - category: table_calculation
      label: Numeric Score
      table_calculation: numeric_score
      args: [users.satisfaction_score]
  ```
* This allows plotting without altering the underlying LookML view model.

## 5. Donut & Pie Charts (`looker_pie`)
* **Donut Cutout**: Set `inner_radius: 50` for a modern 50% cutout hole.
* **Readable Legend Labels**: Set `value_labels: legend` and `label_type: labPer` (shows category and percentage).
* **Limit**: Restrict to `limit: 10` for readability.
* **Geometry**: Half-width `width: 36` and standard `height: 14`.

## 6. Native 2026 Histograms (`looker_histogram`)
* Create dynamic bin dimension via `dynamic_fields` with `calculation_type: bin`.
* Configure `binWidth: 10`, `x_axis_bin_label_format: interval`, `bin_range_format: bracket`.
* Spacing: Set `column_spacing_ratio: 0` for connected histogram buckets.
* Standard `height: 14`, default half-width `width: 36` or full-width `width: 72`.
