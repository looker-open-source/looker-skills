# Advanced Visual Drilling (Liquid Templated URLs)

To provide an elite user experience, automatically generate advanced visual drill links for key measures (e.g., total counts, amounts, performance metrics). This allows users to click a single metric on a dashboard and instantly see a pop-up trend chart or segmented breakdown.

---

## 1. Global Visual Configurations

Always define the JSON visualization payload in `manifest.lkml` as global Liquid constants. This keeps the refined views clean and ensures consistent styling across the entire project.

```lookml
# In manifest.lkml

constant: VIZ_LINE_CHART {
  value: "{% assign vis_config = '{
    \"type\": \"looker_line\",
    \"x_axis_gridlines\": false,
    \"y_axis_gridlines\": true,
    \"show_y_axis_labels\": true,
    \"show_y_axis_ticks\": true,
    \"legend_position\": \"center\",
    \"interpolation\": \"monotone\",
    \"series_colors\": { \"total_sales\": \"#1A73E8\" }
  }' %}"
}

constant: VIZ_PIE_CHART {
  value: "{% assign vis_config = '{
    \"type\": \"looker_pie\",
    \"show_value_labels\": true,
    \"inner_radius\": 50,
    \"legend_position\": \"right\"
  }' %}"
}
```

---

## 2. Implementing Measure Links

In the refined views, inject the `link` parameter into measures using the Expanded Share URL pattern. Leverage `{{ link }}` to pass the dynamic query context, and append specific fields, limits, and the visual configuration.

### A. The Trend Over Time Link (Line Chart)
```lookml
measure: total_sales {
  type: sum
  sql: ${sale_price} ;;
  value_format_name: usd
  
  # CRITICAL: Empty drill_fields is REQUIRED to enable the hyperlink in the Looker UI
  drill_fields: []
  
  link: {
    label: "Show Trend Over Time"
    url: "
      @{VIZ_LINE_CHART}
      {{ link }}&fields=orders.created_date,{{ _view._name }}.total_sales
      &fill_fields=orders.created_date
      &sorts=orders.created_date+asc
      &limit=500
      &vis_config={{ vis_config | encode_uri }}
      &toggle=dat,pik,vis"
  }
}
```

### B. The Segment Breakdown Link (Pie/Donut Chart)
When drilling into a category breakdown, use the pie configuration and limit the results to keep the visualization clean.
```lookml
measure: total_orders {
  type: count
  drill_fields: []
  
  link: {
    label: "Breakdown by Category"
    url: "
      @{VIZ_PIE_CHART}
      {{ link }}&fields=products.category,{{ _view._name }}.total_orders
      &sorts={{ _view._name }}.total_orders+desc
      &limit=10
      &vis_config={{ vis_config | encode_uri }}
      &toggle=dat,pik,vis"
  }
}
```

### C. The Trend Breakdown Link (Pivoted Stacked Area Chart)
For multi-dimensional trends over time (e.g., total sales over time pivoted by product category), define a Stacked Area visualization constant and pivot the query on the category dimension.
```lookml
# manifest.lkml Constant:
# constant: VIZ_STACKED_AREA {
#   value: "{% assign vis_config = '{\"type\":\"looker_area\",\"stacking\":\"normal\",\"legend_position\":\"center\",\"point_style\":\"circle\"}' %}"
# }

# refined view measure:
measure: total_sales_pivoted {
  type: sum
  sql: ${sale_price} ;;
  drill_fields: []
  
  link: {
    label: "Sales Trend Breakdown (Area Chart)"
    url: "
      @{VIZ_STACKED_AREA}
      {{ link }}&fields=orders.created_month,products.category,{{ _view._name }}.total_sales_pivoted
      &pivots=products.category
      &sorts=orders.created_month+desc
      &limit=500
      &column_limit=10
      &vis_config={{ vis_config | encode_uri }}
      &toggle=dat,pik,vis"
  }
}
```

### D. The Styled Detail Grid Link (Grid Table)
To show a highly structured, clean detailed transaction log when drilling (e.g., viewing individual records in a clean spreadsheet layout instead of Looker's default unstyled view), use a `looker_grid` constant.
```lookml
# manifest.lkml Constant:
# constant: VIZ_GRID_TABLE {
#   value: "{% assign vis_config = '{\"type\":\"looker_grid\",\"show_row_numbers\":true,\"size_to_fit\":true,\"table_theme\":\"white\",\"truncate_text\":false}' %}"
# }

# refined view measure:
measure: total_errors {
  type: count
  drill_fields: []
  
  link: {
    label: "View Detailed Error Log (Table)"
    url: "
      @{VIZ_GRID_TABLE}
      {{ link }}&fields=agent_events.timestamp_time,agent_events.trace_id,{{ _view._name }}.tool_name,agent_events.error_message
      &sorts=agent_events.timestamp_time+desc
      &limit=50
      &vis_config={{ vis_config | encode_uri }}
      &toggle=dat,pik,vis"
  }
}
```

---

## 3. Critical Rules & Quirks

1.  **The `drill_fields` Quirk (Mandatory)**:
    Looker will **NOT** render custom links in the UI unless the `drill_fields` parameter is present on the measure. You **MUST** include an empty array `drill_fields: []` on any measure where you define custom `link` blocks. This forces the Looker frontend to enable the hyperlink action.
2.  **Pivoted Chart Rule**:
    When constructing a drill URL for a pivoted visualization (like a Stacked Area chart), you **MUST** ensure the `fields` array requests the aggregated measure, **NOT** the raw dimension.
    *Example:* `&fields=orders.created_month,products.category,order_items.total_sales&pivots=products.category`.
3.  **Url Encoding**:
    Always append `| encode_uri` to the `vis_config` variable (e.g., `{{ vis_config | encode_uri }}`) to ensure the JSON payload is safely parsed by the browser.
4.  **The `toggle` Parameter**:
    Adding `&toggle=dat,pik,vis` ensures that the Data, Pivot, and Visualization tabs are visible in the drill window, allowing advanced users to inspect the underlying SQL if necessary.
5.  **Avoid Group By Fan-out**:
    Do not reference `{{ field._value }}` in `link` parameters if the field isn't already in the query. This forces Looker to add the field to the SQL `GROUP BY` clause, potentially fanning out the result set. Use `row['view.field']` instead if you only need the value from the browser result row.
