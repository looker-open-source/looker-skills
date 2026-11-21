---
name: vis-advanced-config
description: Highcharts advanced config and Looker's declarative formatters engine via advanced_vis_config in LookML dashboards. Supports dynamic point coloring (value >= mean, percent_rank, max, min, named categories), clean y-axes, and plotOptions tweaks.
---

# Looker Advanced Config & Formatters Engine (`vis-advanced-config`)

Looker embeds Highcharts for Cartesian and Flow charts. To support conditional formatting without allowing unsafe JavaScript in LookML, Looker provides a **declarative `formatters` engine** within `advanced_vis_config`.

## 1. Declarative `formatters` Engine
Syntax:
```json
{
  "series": [{
    "name": "<measure_label_or_name>",
    "formatters": [{
      "select": "<expression>",
      "style": {
        "color": "<hex_or_name>"
      }
    }]
  }]
}
```

### Supported `select` Expressions (Official Grammar):
* **Statistical Averages**:
  * `'select: value >= mean'` or `'value > mean'`: Data points above the series average.
  * `'select: value < median'`: Data points below the median.
* **Percentiles & Ranks**:
  * `'select: percent_rank >= 0.9'`: Top 10th percentile data points.
  * `'select: percent_rank <= 0.2'`: Bottom 20th percentile.
* **Extremes**:
  * `'select: max'`: Top outlier.
  * `'select: min'`: Bottom outlier.
* **Named Categories**:
  * `'select: name = "United States"'`: Format a specific named slice or category bar.
* **Absolute Thresholds**:
  * `'select: value > 50000'`, `'select: value <= 0'`

### Cascading Rule Order (Important):
Conditional formatting rules are evaluated sequentially in the order declared. To prevent a general rule from overwriting a specific rule, define general rules (e.g. `value >= mean`) first, followed by specific overrides (e.g. `max` or `name = "Special Category"`).

## 2. Pairing with Native `reference_lines` & Clean Y-Axes
* **Reference Line**: Always pair formatters with `reference_lines: [{reference_type: line, line_value: mean, color: "#000000"}]` so end users can visually see the threshold benchmark line.
* **Declutter Y-Axes**: When `show_value_labels: true` is on, suppress redundant y-axis numbers by setting:
  ```yaml
  y_axes: [{showValues: false}]
  ```
* **Default Geometry**: Half-width `width: 36` and standard `height: 14`.
* **Row Limits**: Cap queries to `limit: 50` (or fewer for top comparison bars).

## 3. Supported Chart Types
* Supported: `looker_column`, `looker_bar`, `looker_line`, `looker_area`, `looker_scatter`, `looker_pie`, `looker_histogram`, `looker_bullet`, `looker_waterfall`, `sankey`.
* Unsupported: `looker_grid` (DOM table), `single_value` (React card), `looker_google_map` (Google Maps API).
