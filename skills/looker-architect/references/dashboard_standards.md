# Enterprise Dashboard Standards (LookML Dashboards)

This reference handbook details the standards for developing highly polished, performant, and professional Looker dashboards using LookML (`.dashboard.lookml` files). These standards ensure consistent visual hierarchy, robust layout design, and smooth user interactions.

---

## 1. Grid & Layout Architecture

*   **Layout Method**: Always use `layout: newspaper`. This provides a flexible 24-column grid.
*   **Visual Hierarchy**: Organize the dashboard elements from top to bottom:
    1.  **Row 1 (Top)**: High-level KPI Scorecards (Single Value tiles showing critical metrics).
    2.  **Row 2**: Trend Visualizations (Area or Line charts displaying metrics over time).
    3.  **Row 3**: Segment Breakdowns (Donut charts, Bar charts, or Scatter plots).
    4.  **Row 4 (Bottom)**: Detailed Data Tables (Grid tables for deep-dive inspection).
*   **Sizing Matrix**:
    *   **KPI Scorecards**: Width `4` to `6`, Height `3` to `4`.
    *   **Trend/Breakdown Charts**: Width `12` to `24`, Height `6` to `8`.
    *   **Detailed Tables**: Width `24`, Height `8` to `10`.
*   **Sectioning**: Use full-width text elements (`type: text` with `width: 24`, `height: 2` to `3`) to act as header banners separating different topics.
*   **Native Tabbed Organization**: For complex, multi-topic dashboards, organize elements into native Looker tabs.
    *   **Prohibition of HTML Navigation Bars**: The use of custom HTML text tiles as navigation menus is strictly **prohibited**. It is an outdated, high-maintenance pattern. Always use Looker's native `tabs` parameter.
    *   **Independent Grid Coordinate Rule**: Each tab operates on an **independent 24-column grid coordinate system starting at `row: 0, col: 0`**. This simplifies layout design, as you do not need to calculate cumulative heights across tabs.

---

## 2. Native Tabbed Dashboard Implementation

To implement tabbed dashboards:
1.  Declare the `tabs` array at the dashboard metadata level, defining a `name` (unique ID) and `label` (user-facing text) for each tab.
2.  Assign each dashboard element to a specific tab using the `tab_name` parameter inside the element configuration.
3.  Ensure elements on each tab start their layout positioning at `row: 0, col: 0`.

### Example Tabbed Dashboard Layout:
```yaml
- dashboard: operational_intelligence
  title: "Operational Intelligence Overview"
  layout: newspaper
  preferred_viewer: dashboards-next
  
  # 1. Define Tabs at the top level (Max 5 tabs recommended)
  tabs:
    - name: overview_tab
      label: "System Overview"
    - name: queries_tab
      label: "Heavy Queries"

  elements:
    # --- Tab 1: System Overview ---
    - name: system_kpi_cpu
      title: "Average CPU Utilization"
      model: database_observability
      explore: system_metrics
      type: single_value
      fields: [system_metrics.cpu_utilization_avg]
      tab_name: overview_tab # Assign to Tab 1
      row: 0 # Independent grid coordinates start at 0
      col: 0
      width: 8
      height: 4

    # --- Tab 2: Heavy Queries ---
    - name: top_heavy_queries_grid
      title: "Top 10 Heavy Queries"
      model: database_observability
      explore: query_stats
      type: looker_grid
      fields: [query_stats.query_text, query_stats.execution_time_total]
      tab_name: queries_tab # Assign to Tab 2
      row: 0 # Independent grid coordinates start at 0
      col: 0
      width: 24
      height: 10
```

---

## 3. KPI Scorecards (Single Value Tiles & PoP Comparisons)

Never display a raw KPI in isolation. Always provide a comparison context. For any Key KPI card, you **MUST** implement the **Period-over-Period (PoP) Comparison Pattern**. This pattern renders a large primary value (current period) and a smaller secondary percentage change (comparison vs. last period) using a two-measure, filter-driven query.

### The Two-Measure Dashboard PoP Pattern:
1.  **Select Exactly Two Fields**:
    *   The first field **MUST** be the current period measure (e.g., `pop_total_revenue_current`).
    *   The second field **MUST** be the percentage change measure (e.g., `pop_total_revenue_change`).
2.  **Enable Comparison Visualization**:
    *   Set `show_comparison: true`.
    *   Set `comparison_type: change` (this displays the delta as a percentage).
    *   Set `comparison_label: "vs Last Period"` or similar descriptive label.
    *   Set `comparison_reverse_colors: true` only if a decrease represents an improvement (e.g., Page Load Latency, Error Count, Lock Wait Time).
3.  **Map Dashboard Filters to PoP Filters**:
    *   The dashboard date filter **MUST** map to the explore's PoP date filter (e.g., `explore_name.pop_date_filter`).

### LookML Implementation Example:
```yaml
- name: pop_total_errors_card
  title: "Total Errors"
  model: system_observability
  explore: agent_events
  type: single_value
  # 1. Query exactly two fields: Current value, and percentage Change
  fields: [v_tool_error.pop_tool_errors_current, v_tool_error.pop_tool_errors_change]
  # 2. Map the dashboard filter to the PoP date filter of the explore
  filters:
    agent_events.pop_date_filter: 7 days
  custom_color_enabled: true
  show_single_value_title: true
  # 3. Configure comparison settings
  show_comparison: true
  comparison_type: change
  comparison_reverse_colors: true # Red color for increase, Green for decrease
  show_comparison_label: true
  comparison_label: "vs Last Period"
  tab_name: overview_tab
  row: 0
  col: 0
  width: 8
  height: 4
```

---

## 4. Visual Branding & HTML Customization

Use custom HTML inside text elements and tiles to inject branded typography, custom dashboard banners, and color-coded statuses.

### A. Dashboard Header Banners
Inject custom HTML inside a text tile to create a professional, branded header:
```yaml
- name: header_overview
  type: text
  title_text: "<font color='#0A0909' size='5' weight='bold'>Operational Intelligence :</font> <font color='#1A73E8' size='5'>Database Overview</font>"
  body_text: "Monitor live connections, transaction states, and queries currently running in your instances."
  tab_name: overview_tab # Must be assigned to the appropriate tab
  row: 0
  col: 0
  width: 24
  height: 2
```

---

## 4. The Dual-Axis Configuration Quirk

To correlate different metric types (e.g., Total Connections and CPU Saturation %) on a single line/column chart, configure dual axes.

> [!WARNING]
> **Looker Frontend Quirk**: When configuring `y_axes`, the nested `series` parameter **MUST** contain a list of objects specifying the `id` and `name`. **Passing plain strings will crash the Looker frontend** with the error `Cannot create property 'id' on string '...'`.

### CORRECT Implementation:
```yaml
- name: traffic_vs_saturation
  title: "Traffic vs. CPU Saturation"
  model: my_model
  explore: my_explore
  type: looker_line
  fields: [my_view.created_hour, my_view.total_connections, my_view.cpu_saturation_pct]
  series_types:
    my_view.total_connections: column
    my_view.cpu_saturation_pct: line
  y_axes:
    - label: "Total Connections"
      orientation: left
      series:
        - id: my_view.total_connections # MUST be an object with 'id'
          name: "Active Connections"
    - label: "CPU Saturation (%)"
      orientation: right
      series:
        - id: my_view.cpu_saturation_pct # MUST be an object with 'id'
          name: "CPU %"
```

---

## 5. Dashboard Filters & UI Controls

*   **Filter Type**: Prefer `type: field_filter` to inherit automated suggestions, search indexing, and validation from the model.
*   **UI Placement (`ui_config.display`)**:
    *   `inline`: Use for **primary, high-impact filters** (e.g., Date Range, Region).
    *   `popover`: Use for **secondary filters** (e.g., User Tier, Database Name) to prevent UI clutter.
    *   `overflow`: Use for **tertiary/infrequent filters**.
*   **UI Control Type (`ui_config.type`)**:
    *   `dropdown_menu`: Best for long, single-select lists.
    *   `button_toggles`: Best for binary choices (Yes/No).
    *   `tag_list`: Best for dynamic multi-select of long lists.
    *   `button_group`: Best for multi-select of very short lists (2-4 items).

```yaml
filters:
  - name: select_date
    title: "Select Date"
    type: field_filter
    model: my_model
    explore: my_explore
    field: my_view.created_date
    ui_config:
      type: advanced
      display: inline
```

---

## 6. Data Quality & Visual Outlier Controls

### A. Null Grouping Exclusion
When joining nullable dimension tables, unmapped records group under a `null` label and can take over the top slots in charts. **Always** add static element-level `filters` to exclude `null` values in ranking charts (e.g., Top Users, Top Queries):
```yaml
- name: top_queries
  title: "Top 10 Heavy Queries"
  model: my_model
  explore: my_explore
  type: looker_grid
  fields: [my_view.query_text, my_view.execution_time_total]
  filters:
    my_view.query_text: "-NULL" # Excludes null groups from taking over top slots
  sorts: [my_view.execution_time_total desc]
  limit: 10
```

### B. Geographic Marker Radius Bounds
Geographic maps (`looker_map`) can become unreadable due to huge outlier bubbles. Always apply marker radius bounds to keep the visualization clean and legible:
```yaml
map_plot_mode: points
map_marker_radius_max: 8
map_marker_radius_min: 2
```

---

## 7. Quality Assurance Checklist
- [ ] Dashboard uses `newspaper` layout on a 24-column grid.
- [ ] Visual hierarchy is established (KPIs ➔ Trends ➔ Segments ➔ Details).
- [ ] Branded section headers (`type: text`) are used to separate topics.
- [ ] Every KPI scorecard has a comparison context (PoP or Target).
- [ ] All `y_axes` configurations use nested objects with `id` (no raw strings).
- [ ] Long dashboards are organized into tabs.
- [ ] Custom `ui_config` is set for all filters (inline vs. popover).
- [ ] `crossfilter_enabled: true` is set to allow interactive filtering.
- [ ] Redundant view names are hidden (`show_view_names: false`).
- [ ] Elements joining nullable dimensions have explicit `-NULL` filters.
- [ ] Map tiles have configured marker radius bounds to handle overlapping density.
- [ ] All configurations are written in English.
