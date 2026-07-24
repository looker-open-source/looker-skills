- dashboard: ecommerce_overview
  title: "eCommerce Operations Overview"
  layout: newspaper
  preferred_viewer: dashboards-next
  tile_size: 100

  filters:
    - name: select_date
      title: "Select Date"
      type: field_filter
      model: ecommerce
      explore: orders
      field: orders.pop_date_filter
      ui_config:
        type: advanced
        display: inline

  elements:
    # --------------------------------------------------------------------------
    # 1. NAVIGATION BAR & HEADER
    # --------------------------------------------------------------------------
    - name: navigation_bar
      type: text
      body_text: |
        <nav style="font-size: 16px; text-align: center; border-bottom: 1px solid #E0E0E0; padding-bottom: 10px; margin-bottom: 10px;">
          <a style="padding: 10px 20px; font-weight: bold; color: #1A73E8; border-bottom: 2px solid #1A73E8;" href="#">Overview</a>
          <a style="padding: 10px 20px; color: #4A4A4A;" href="#">Customer Behavior</a>
          <a style="padding: 10px 20px; color: #4A4A4A;" href="#">Financial Health</a>
        </nav>
      row: 0
      col: 0
      width: 24
      height: 2

    # --------------------------------------------------------------------------
    # 2. KPI SCORECARDS (Row 1)
    # --------------------------------------------------------------------------
    - name: total_orders_scorecard
      title: "Total Orders"
      model: ecommerce
      explore: orders
      type: single_value
      fields: [orders.orders_count_selected, orders.orders_count_pop_change]
      custom_color: "#1A73E8"
      show_single_value_title: true
      show_comparison: true
      comparison_type: change
      comparison_reverse_colors: false
      show_comparison_label: true
      row: 2
      col: 0
      width: 6
      height: 4

    - name: total_revenue_scorecard
      title: "Total Revenue"
      model: ecommerce
      explore: orders
      type: single_value
      fields: [orders.revenue_total]
      custom_color: "#0F9D58"
      show_single_value_title: true
      row: 2
      col: 6
      width: 6
      height: 4

    - name: active_users_scorecard
      title: "Total Users"
      model: ecommerce
      explore: orders
      type: single_value
      fields: [users.users_count]
      custom_color: "#FF9900"
      show_single_value_title: true
      row: 2
      col: 12
      width: 6
      height: 4

    # --------------------------------------------------------------------------
    # 3. TREND VISUALIZATIONS (Row 2)
    # --------------------------------------------------------------------------
    - name: revenue_trend_chart
      title: "Daily Revenue Trend"
      model: ecommerce
      explore: orders
      type: looker_line
      fields: [orders.created_date, orders.revenue_total]
      x_axis_gridlines: false
      y_axis_gridlines: true
      show_view_names: false
      show_y_axis_labels: true
      show_y_axis_ticks: true
      show_x_axis_label: true
      show_x_axis_ticks: true
      interpolation: monotone
      row: 6
      col: 0
      width: 16
      height: 8

    - name: order_status_breakdown
      title: "Order Status Breakdown"
      model: ecommerce
      explore: orders
      type: looker_pie
      fields: [orders.status, orders.orders_count]
      filters:
        orders.status: "-NULL" # Excludes null status from taking over the chart
      value_labels: legend
      label_type: labPer
      inner_radius: 50
      row: 6
      col: 16
      width: 8
      height: 8

    # --------------------------------------------------------------------------
    # 4. DETAILED DATA GRID (Row 3)
    # --------------------------------------------------------------------------
    - name: detailed_orders_grid
      title: "Recent Orders Detail"
      model: ecommerce
      explore: orders
      type: looker_grid
      fields: [orders.id, users.full_name, orders.status, orders.sale_price]
      sorts: [orders.sale_price desc]
      limit: 50
      show_view_names: false
      show_row_numbers: true
      size_to_fit: true
      table_theme: white
      row: 14
      col: 0
      width: 24
      height: 8
