# Looker Visualisations Skill Suite

A specialized, modular suite of agent skills designed to guide AI agents and Looker developers in selecting, configuring, and authoring modern 2026 LookML dashboard visualizations (`.dashboard.lookml`).

## Architecture & Sub-Skills

This suite is structured around a central decision engine hub and 5 specialized domain modules:

```text
skills/looker-visualisations/
├── SKILL.md                          # Master Hub & Decision Engine
├── README.md                         # Suite overview & documentation
│
├── vis-dashboards-modern/            # 72-col granular layouts, native tabs, modern filters, banners
│   ├── SKILL.md
│   └── examples.dashboard.lookml
│
├── vis-kpi-tabular/                  # Next-gen sparkline KPIs, collapsible row-group grids
│   ├── SKILL.md
│   └── examples.dashboard.lookml
│
├── vis-cartesian/                    # Column, Bar, Line, Histograms, Donut/Pie (inner_radius: 50)
│   ├── SKILL.md
│   └── examples.dashboard.lookml
│
├── vis-spatial/                      # Bullet target charts, gradient Sankeys, layered Google Maps
│   ├── SKILL.md
│   └── examples.dashboard.lookml
│
└── vis-advanced-config/              # Highcharts advanced config & declarative formatters (value >= mean)
    ├── SKILL.md
    └── examples.dashboard.lookml
```

## Mandatory 2026 Design Standards

1. **Modern Layout & Half-Width Default**:
   - Always enforce `preferred_viewer: dashboards-next`, `style: modern`, `layout_granularity: granular` (72 columns), and `modern2026: true`.
   - Aim for half-width (`width: 36`) for standard tiles by default.
   - Use standard `height: 14` for all elements to maintain vertical alignment.
2. **Numeric Compaction**: Always apply compact conditional number formats:
   * KPI / Scorecards: `value_format: '[>=1000000]0.0,," M";[>=1000]$0," K";0'`
   * Axes & Labels: `label_value_format: '$#,##0,"K"'`
3. **Explicit Value Labels & Clean Y-Axes**:
   * Always evaluate `show_value_labels: true` for bar/column/bullet/histogram charts.
   * If value labels are displayed, hide redundant y-axis values via `y_axes: [{showValues: false}]`.
   * For Donut/Pie charts, set `value_labels: legend` with `label_type: labPer`.
