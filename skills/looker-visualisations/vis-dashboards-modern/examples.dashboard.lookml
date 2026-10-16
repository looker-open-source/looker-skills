- dashboard: modern_framework_demo
  title: Modern Framework Demo 2026
  preferred_viewer: dashboards-next
  style: modern
  layout_granularity: granular
  layout: newspaper
  tabs:
    - name: executive_summary
      label: Executive Overview
    - name: detailed_analytics
      label: Detailed Breakdown

  filters:
    - name: Created Year
      title: "📅 Sales Year"
      type: field_filter
      default_value: "2026"
      allow_multiple_values: false
      required: false
      model: thelook_ecommerce
      explore: customer_orders
      field: order_items.created_year

    - name: Country
      title: "🌍 Region / Country"
      type: field_filter
      default_value: ""
      allow_multiple_values: true
      required: false
      model: thelook_ecommerce
      explore: customer_orders
      field: users.country

    - name: Category
      title: "🏷️ Product Category"
      type: field_filter
      default_value: ""
      allow_multiple_values: true
      required: false
      model: thelook_ecommerce
      explore: customer_orders
      field: products.category

    - name: Status
      title: "📦 Fulfillment Status"
      type: field_filter
      default_value: ""
      allow_multiple_values: true
      required: false
      model: thelook_ecommerce
      explore: customer_orders
      field: order_items.status

  elements:
    # 1. Generic Professional Landing Page Banner (Clean, no status key)
    - name: executive_landing_banner
      type: text
      title_text: ''
      subtitle_text: ''
      body_text: |
        <div style="background: #f0f4f9; border-left: 4px solid #1a73e8; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.6; color: #1f2733; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
          <div style="margin-bottom: 6px;">
            <b style="color: #1a73e8; font-size: 15px;">Enterprise Operations Command Center</b>
          </div>
          <div style="color: #3c4043; font-size: 13px; margin-bottom: 6px;">
            Central operational reporting hub and verified metrics directory for executive leadership and category managers.
          </div>
          <div style="color: #5f6368; font-size: 12px;">
            <b>Navigation:</b> Switch between tabs above for high-level summaries or dimensional deep-dives. Global filters apply dynamically across all visual tiles.
          </div>
        </div>
      tab_name: executive_summary
      row: 0
      col: 0
      width: 54
      height: 6

    # 2. Navigation Button Element (Dashboard-to-Dashboard Link)
    - name: deep_dive_nav_button
      type: button
      title_text: ''
      rich_marker: true
      url: "/dashboards/operational_deep_dive"
      button_text: "Launch Operational Deep Dive ↗"
      color: "#1a73e8"
      tab_name: executive_summary
      row: 0
      col: 54
      width: 18
      height: 6

    # 3. Data Tile Demonstrating Active Filter Listening (listen block)
    - title: "Net Revenue by Category"
      name: revenue_by_category_filtered
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
      listen:
        Created Year: order_items.created_year
        Country: users.country
        Category: products.category
        Status: order_items.status
      tab_name: executive_summary
      row: 6
      col: 0
      width: 36
      height: 14

    # 4. Secondary Tile Demonstrating Selective Filter Listening
    - title: "Fulfillment Status Volume"
      name: status_volume_filtered
      model: thelook_ecommerce
      explore: customer_orders
      type: looker_column
      fields: [order_items.status, order_items.order_count]
      sorts: [order_items.order_count desc 0]
      limit: 10
      modern2026: true
      x_axis_zoom: true
      y_axis_zoom: true
      show_value_labels: true
      y_axes: [{showValues: false}]
      listen:
        Created Year: order_items.created_year
        Country: users.country
        Category: products.category
      tab_name: executive_summary
      row: 6
      col: 36
      width: 36
      height: 14
