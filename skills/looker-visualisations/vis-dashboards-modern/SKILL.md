---
name: vis-dashboards-modern
description: Authoring modern LookML dashboards with 72-column granular newspaper layouts, native multi-tab navigation (max 5 tabs), navigation buttons, custom filters, filter binding (listen blocks), and executive landing page banners.
---

# Modern Dashboard Framework & Layouts (`vis-dashboards-modern`)

## 1. 72-Column Granular Grid Geometry
When `layout_granularity: granular` is specified with `layout: newspaper`, the grid expands from 24 to 72 columns:

* **Default to Half Width (`width: 36`)**: Aim for half-width tiles by default (allowing 2 side-by-side elements per row), unless a full-width header banner (`width: 72`) or wide table is specifically required.
* **Quarter Width (`width: 18`)**: Use for 4 side-by-side KPI cards.
* **Standard Tile Height (`height: 14`)**: Use `height: 14` as the uniform standard height across tiles (KPIs, charts, maps, and tables) for visual consistency and vertical rhythm. (Header banners typically use `height: 6` to `8`).

## 2. Native Multi-Tab Structure & Best Practices
Looker supports native tabs in LookML dashboards using the `tabs:` parameter:
```yaml
tabs:
  - name: executive_summary
    label: Executive Overview
  - name: detailed_analytics
    label: Detailed Breakdown
```

### Official Tab Rules & Limits:
* **Max 5 Tabs Recommended**: Limit dashboards to a **maximum of 5 tabs**. Exceeding 5 tabs causes cognitive overload, heavy initial DOM loads, and poor navigation on tablet and mobile viewports.
* **Layout Requirement**: Tabbed dashboards are **only supported** when using `layout: newspaper`.
* **Tile Concurrency Limit**: Aim for no more than **20–25 visual tiles per tab** to ensure sub-second database query execution.
* **Placing elements on a tab**: To assign a dashboard element to a specific tab, set the element's `tab_name` parameter to match the tab's `name:` identifier (e.g. `tab_name: executive_summary`).

## 3. Native Button Elements (`type: button`)
Looker supports native clickable button elements for dashboard-to-dashboard navigation, parameterized deep-links, or external documentation:
```yaml
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
```

## 4. Filter Design & Mandatory `listen:` Binding
Defining filters at the dashboard root does **not** automatically filter tiles. Each element must explicitly bind to dashboard filters using a `listen:` block:

```yaml
filters:
  - name: Created Year
    title: "📅 Sales Year"
    type: field_filter
    default_value: "2026"
    model: thelook_ecommerce
    explore: customer_orders
    field: order_items.created_year

elements:
  - title: "Filtered Revenue Tile"
    name: filtered_revenue_tile
    type: looker_column
    # ...
    listen:
      Created Year: order_items.created_year
      Country: users.country
      Category: products.category
```
* **Key rule**: The key on the left must exactly match the `name:` of the filter; the value on the right must be the fully qualified `view.field` in the tile's explore.

## 5. Executive Landing Page Banners (`type: text`)
Use clean text cards with light accent backgrounds (`#f0f4f9`), a colored border-left (`#1a73e8`), and concise introductory text to establish the purpose of the dashboard without visual clutter. See `examples.dashboard.lookml` for reference.
