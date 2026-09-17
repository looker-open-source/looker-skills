- dashboard: advanced_vis_config_demo
  title: Advanced Vis Config Demo 2026
  preferred_viewer: dashboards-next
  style: modern
  layout_granularity: granular
  layout: newspaper

  elements:
    - title: "Revenue by Country with Above-Average Highlighting"
      name: revenue_mean_highlight_column
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_column
      fields: [order_items.gross_revenue, users.country]
      sorts: [order_items.gross_revenue desc 0]
      limit: 10
      modern2026: true
      x_axis_zoom: true
      y_axis_zoom: true
      show_value_labels: true
      label_value_format: $#,##0,"K"
      y_axes: [{showValues: false}]

      # Base color for all standard bars
      series_colors:
        order_items.gross_revenue: "#4285F4"

      # 1. Visual reference line indicating the average
      reference_lines:
        - reference_type: line
          line_value: mean
          label: "Mean"
          label_position: right
          color: "#000000"

      # 2. Declarative formatters to recolor bars exceeding the mean
      advanced_vis_config: |-
        {
          chart: {},
          series: [{
            name: 'Gross Revenue',
            formatters: [{
              select: 'value >= mean',
              style: {
                color: '#34A853'
              }
            }]
          }]
        }
      row: 0
      col: 0
      width: 36
      height: 14
