- dashboard: kpi_tabular_demo
  title: KPI & Tabular Demo 2026
  preferred_viewer: dashboards-next
  style: modern
  layout_granularity: granular
  layout: newspaper

  elements:
    - title: "[KPI] Revenue with Sparkline"
      name: kpi_revenue_sparkline
      model: thelook_ecommerce
      explore: customer_orders
      type: single_value
      fields: [orders.created_year, order_items.total_sale_price]
      fill_fields: [orders.created_year]
      sorts: [orders.created_year desc]
      limit: 50
      dynamic_fields:
        - category: table_calculation
          label: vs last year
          value_format_name: percent_0
          calculation_type: percent_difference_from_previous
          table_calculation: vs_last_year
          args: [order_items.total_sale_price]
      modern2026: true
      show_chart_component: true
      show_x_axis: true
      smart_single_value_size: true
      show_comparison: true
      comparison_type: change
      comparison_row: first
      custom_color: "#4285F4"
      value_format: '[>=1000000]0.0,," M";[>=1000]$0," K";0'
      global_tooltip_options:
        style:
          font_size: 12
          font_color: "#FFFFFF"
          background_color: "#262D33"
          border_radius: 4
        template: |
          <div style="padding: 4px;">
            <div style="color: #9AA0A6;">Period: {{ orders.created_year }}</div>
            <div style="font-weight: bold; font-size: 14px;">{{ order_items.total_sale_price }}</div>
          </div>
      row: 0
      col: 0
      width: 36
      height: 14

    - title: "[Table] Hierarchical Sales Grid"
      name: hierarchical_sales_grid
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_grid
      fields: [users.country, users.state, users.city, order_items.total_sale_price, order_items.count]
      sorts: [users.country, users.state, users.city]
      limit: 5000
      modern2026: true
      table_theme: modern
      size_to_fit: true
      table_column_hover_highlight_enable: true
      table_column_hover_highlight_color: "#EAC43B"
      table_custom_border_enable: true
      table_custom_border_style: dotted
      table_custom_border_color: "#4285F4"
      row_groups:
        enabled: true
        default_display_level: collapsed
        row_grouping_fields:
          - users.country
          - users.state
          - users.city
        configurable_subtotals: true
      row: 0
      col: 36
      width: 36
      height: 14
