- dashboard: cartesian_demo
  title: Cartesian & Donut Demo 2026
  preferred_viewer: dashboards-next
  style: modern
  layout_granularity: granular
  layout: newspaper

  elements:
    # 1. Combo Chart: Current vs Prior Year (Bars) with YoY Difference (Line)
    # Suppressing 0 and null values from being plotted
    - title: "YoY Order Count Comparison & Difference"
      name: yoy_order_count_combo
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_line
      fields: [orders.order_count_last_year_difference, orders.order_count_last_year, orders.count, orders.created_month]
      fill_fields: [orders.created_month]
      filters:
        orders.created_year: '2026'
        orders.count: '>0'
      sorts: [orders.created_month desc]
      limit: 50
      modern2026: true
      x_axis_gridlines: false
      y_axis_gridlines: true
      show_view_names: false
      show_y_axis_labels: true
      show_y_axis_ticks: true
      show_x_axis_label: true
      show_x_axis_ticks: true
      show_null_points: false
      show_null_labels: false
      point_style: circle_outline
      show_value_labels: true
      x_axis_zoom: true
      y_axis_zoom: true
      interpolation: linear
      series_types:
        orders.order_count_last_year: column
        orders.count: column
      series_colors:
        orders.count: "#1A73E8"
        orders.order_count_last_year: "#8AB4F8"
        orders.order_count_last_year_difference: "#E52592"
      listen:
        Created Year: orders.created_year
      row: 0
      col: 0
      width: 36
      height: 14

    # 2. Donut Chart with Label & Percentage in Legend
    - title: "Revenue by Department"
      name: revenue_by_dept_donut
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_pie
      fields: [products.department, order_items.total_sale_price]
      sorts: [order_items.total_sale_price desc 0]
      limit: 10
      modern2026: true
      inner_radius: 50
      start_angle: 0
      value_labels: legend
      label_type: labPer
      show_view_names: false
      listen:
        Country: users.country
      row: 0
      col: 36
      width: 36
      height: 14

    # 3. Waterfall Chart: Cumulative Revenue Contribution by Order Status
    - title: "Revenue Contribution by Fulfillment Status"
      name: revenue_by_status_waterfall
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_waterfall
      fields: [order_items.status, order_items.total_sale_price]
      sorts: [order_items.total_sale_price desc 0]
      limit: 10
      modern2026: true
      up_color: "#1e8e3e"
      down_color: "#d93025"
      total_color: "#1a73e8"
      show_value_labels: true
      label_value_format: $#,##0,"K"
      listen:
        Created Year: orders.created_year
      row: 14
      col: 0
      width: 36
      height: 14

    # 4. Zoomable Column Chart with Reference Line and Clean Y-Axis
    - title: "Zoomable Revenue by Category"
      name: zoomable_revenue_column
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_column
      fields: [products.category, order_items.total_sale_price]
      sorts: [order_items.total_sale_price desc 0]
      limit: 15
      modern2026: true
      x_axis_zoom: true
      y_axis_zoom: true
      show_value_labels: true
      label_value_format: $#,##0,"K"
      y_axes: [{showValues: false}]
      reference_lines:
        - reference_type: line
          line_value: mean
          label_position: right
          color: "#000000"
      listen:
        Category: products.category
      row: 14
      col: 36
      width: 36
      height: 14

    # 5. Native Histogram with Dynamic Age Binning
    - title: "Customer Age Distribution"
      name: customer_age_histogram
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_histogram
      fields: [users.email, users.age]
      sorts: [users.email desc]
      limit: 5000
      dynamic_fields:
        - category: dimension
          label: Age Bin
          calculation_type: bin
          dimension: age_bin
          args: [users.age, '10', '0', '100', '', classic]
      modern2026: true
      binning_field: users.age
      binWidth: 10
      x_axis_bin_label_format: interval
      bin_range_format: bracket
      column_spacing_ratio: 0
      column_group_spacing_ratio: 0.02
      show_value_labels: true
      x_axis_zoom: true
      y_axis_zoom: true
      row: 28
      col: 0
      width: 72
      height: 14
