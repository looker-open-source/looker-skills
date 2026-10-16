- dashboard: spatial_targets_demo
  title: Spatial, Targets & Flows Demo 2026
  preferred_viewer: dashboards-next
  style: modern
  layout_granularity: granular
  layout: newspaper

  elements:
    - title: "[Bullet] Category Revenue vs Target"
      name: category_revenue_bullet
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_bullet
      fields: [order_items.total_sale_price, products.category]
      sorts: [order_items.total_sale_price desc 0]
      limit: 10
      modern2026: true
      bullet_range_limits_enabled: true
      bullet_range_1: 100000
      bullet_range_2: 200000
      bullet_range_3: 500000
      bullet_range_colors: "#e1e1e1,#c2c2c2"
      bullet_target_type: value
      bullet_target: 250000
      bullet_target_color: "#ED984D"
      bullet_target_width: 150%
      bullet_orientation: horizontal
      bullet_show_target_marker: true
      show_value_labels: true
      label_value_format: $#,##0,"K"
      row: 0
      col: 0
      width: 36
      height: 14

    - title: "[Sankey] Traffic Source to Status Pipeline"
      name: traffic_status_sankey
      model: thelook_ecommerce
      explore: customer_orders
      type: sankey
      fields: [users.traffic_source, order_items.status, order_items.total_sale_price]
      sorts: [order_items.total_sale_price desc]
      limit: 50
      modern2026: true
      crossfilter_by: both
      color_by: order
      link_color_mode: gradient
      rounded_corners: true
      node_width: 20
      node_padding: 10
      node_opacity: '0.66'
      link_opacity: '0.66'
      row: 0
      col: 36
      width: 36
      height: 14

    - title: "[Map] Global Sales Distribution with Transit"
      name: global_sales_map
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_google_map
      fields: [order_items.total_sale_price, users.country]
      sorts: [order_items.total_sale_price desc 0]
      limit: 500
      modern2026: true
      map_plot_mode: points
      map_marker_radius_mode: proportional_value
      map_marker_units: meters
      map_marker_color_mode: value
      map_transit_layer: true
      map_zoomable: true
      map_pannable: true
      heatmap_intensity: 1
      heatmap_opacity: 0.5
      row: 14
      col: 0
      width: 72
      height: 14
