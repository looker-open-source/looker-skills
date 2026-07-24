project_name: "ecommerce_block"

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

constant: CONNECTION_NAME {
  value: "ecommerce_connection"
  export: override_optional
}

constant: DATASET_NAME {
  value: "ecommerce_dataset"
  export: override_optional
}

# --------------------------------------------------------------------------
# Advanced Drilling & Visualization Configurations Library
# --------------------------------------------------------------------------

constant: DRILL_LINE_VIZ {
  value: "{% assign vis_config = '{
    \"type\": \"looker_line\",
    \"x_axis_gridlines\": false,
    \"y_axis_gridlines\": true,
    \"show_view_names\": false,
    \"show_y_axis_labels\": true,
    \"show_y_axis_ticks\": true,
    \"show_x_axis_label\": true,
    \"show_x_axis_ticks\": true,
    \"interpolation\": \"linear\"
  }' %}"
}

constant: DRILL_COLUMN_VIZ {
  value: "{% assign vis_config = '{
    \"type\": \"looker_column\",
    \"x_axis_gridlines\": false,
    \"y_axis_gridlines\": true,
    \"show_view_names\": false,
    \"show_y_axis_labels\": true,
    \"show_y_axis_ticks\": true,
    \"show_x_axis_label\": true,
    \"show_x_axis_ticks\": true,
    \"stacking\": \"\",
    \"show_value_labels\": true
  }' %}"
}

constant: DRILL_PIE_VIZ {
  value: "{% assign vis_config = '{
    \"type\": \"looker_pie\",
    \"value_labels\": \"legend\",
    \"label_type\": \"labPer\",
    \"inner_radius\": 50,
    \"show_view_names\": false
  }' %}"
}
