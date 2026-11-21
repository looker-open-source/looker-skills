---
name: vis-spatial
description: Authoring Spatial, target, and flow visualizations including native Bullet charts (actual vs target thresholds), gradient Sankey flow diagrams with bi-directional cross-filtering, and modern Google Maps with transit layers and proportional scaling.
---

# Spatial Visualizations (`vis-spatial`)

## 1. Native Bullet Charts (`looker_bullet`)
* **Default Geometry**: Half-width `width: 36` and standard `height: 14`.
* **Row Limits**: Cap queries to `limit: 50` (or `limit: 10` for top categories).
* **Threshold Ranges**: Set `bullet_range_limits_enabled: true`, configure `bullet_range_1`, `bullet_range_2`, `bullet_range_3`, and `bullet_range_colors: "#e1e1e1,#c2c2c2"`.
* **Target Marker**: Define `bullet_target`, `bullet_target_color: "#ED984D"`, `bullet_target_width: 150%`, `bullet_show_target_marker: true`.
* **Orientation**: Set `bullet_orientation: horizontal`.

## 2. Gradient Sankey Diagrams (`type: sankey`)
* **Default Geometry**: Half-width `width: 36` and standard `height: 14`.
* **Row Limits**: Cap queries to `limit: 50` for crisp readable flow nodes.
* **Query Shape**: Strictly 2 dimensions (Source, Target) and 1 weight measure.
* **Styling**: `link_color_mode: gradient`, `rounded_corners: true`, `node_opacity: '0.66'`, `link_opacity: '0.66'`.
* **Cross-Filtering**: Set `crossfilter_by: both` to allow clicking nodes to filter the dashboard.

## 3. Layered Google Maps (`looker_google_map`)
* **Default Geometry**: Half-width `width: 36` or full-width `width: 72`, standard `height: 14`.
* **Plot Mode**: `map_plot_mode: points` with `map_marker_radius_mode: proportional_value` and `map_marker_units: meters`.
* **GIS Layers**: Enable `map_transit_layer: true`, `map_traffic_layer`, or `map_bicycling_layer`.
* **Heatmaps**: Set `heatmap_intensity: 1`, `heatmap_opacity: 0.5`.
