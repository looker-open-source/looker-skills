# Looker Custom Viz: Data Visualization Best Practices

This guide details best practices for designing clear, honest, and high-performance custom visualizations. It incorporates standards from the *Wall Street Journal (WSJ) Guide to Information Graphics* and [Looker's native visualization guidelines](https://docs.cloud.google.com/looker/docs/visualization-guide).

---

## 1. Chart Selection: The Dos and Don'ts

Choosing the correct chart type prevents misinterpretation. Avoid selecting a chart type simply because it "looks unique."

| Chart Type | Best Used For | The DOs | The DON'Ts |
| :--- | :--- | :--- | :--- |
| **Horizontal Bar** | Comparing distinct categories, rankings, or items with long labels. | **Do** order bars from largest to smallest. **Do** keep text horizontal and readable. | **Don't** use vertical text labels. **Don't** omit the zero-baseline. |
| **Vertical Column** | Comparing data over discrete, chronological intervals (e.g. months, years). | **Do** keep columns vertical if representing time. **Do** keep spacing between columns smaller than column width. | **Don't** use columns if category names are long (convert to horizontal bar instead). |
| **Line Chart** | Displaying continuous trends over time. | **Do** limit the chart to 4–5 lines. **Do** use color-coded labels directly on the lines instead of a separate legend where possible. | **Don't** plot too many overlapping lines (create "small multiples" or highlight one key line instead). |
| **Pie / Donut** | Showing simple proportions of a whole (composition). | **Do** limit slices to 3–4 max. **Do** order slices largest to smallest starting at 12 o'clock. | **Don't** use if slices do not equal exactly 100%. **Don't** use 3D effects or exploded slices. |
| **Scatter Plot** | Visualizing relationships, correlations, and distributions between two numeric values. | **Do** add trendlines. **Do** provide rich hover tooltips to explain points. | **Don't** use if density is too high without allowing zooming/filtering. |

---

## 2. Axis Rules & Visual Integrity

Visual integrity ensures your chart tells the truth. Small adjustments to axes can distort data and mislead users.

### The Zero-Baseline Rule (Bar/Column Charts)
Bar and column lengths correspond directly to quantities. Truncating the Y-axis (starting at a non-zero value) distorts the length ratio, making a 5% difference look like a 500% difference.
*   **Mandatory**: Bar and Column charts **must always start their value axis at zero**.
*   *Exception*: Line and scatter charts do not require a zero-baseline if the goal is to emphasize minor fluctuations or rates of change, but the non-zero axis boundaries must be clearly visible and labeled.

### Dual Axes (Secondary Y-Axis)
*   **The Risk**: Dual axes with different scales can imply correlation where none exists, and confuse users trying to map lines to axes.
*   **Best Practice**: Avoid dual axes unless the units are naturally different (e.g., Temperature in °F vs. Precipitation in inches). When using dual axes:
    *   Color-code the axis lines, ticks, and labels to match the corresponding data series.
    *   Expose a configuration option to toggle the secondary axis on or off.

### Label Spacing and Rotation
*   Avoid vertical text labels; they force the reader to tilt their head and reduce legibility.
*   If labels overlap on a column chart, rotate them by `30` or `45` degrees. If they still overlap, convert the chart to a **horizontal bar chart** where long labels have plenty of horizontal space.

---

## 3. Color Design Principles

Color should be used to encode information, not as decoration.

*   **Qualitative (Categorical)**: Use distinct, highly contrasting colors to represent unrelated categories. Use Looker's default qualitative palettes (e.g. Classic Blue, Sunset Orange) rather than random color assignments.
*   **Sequential (Numeric)**: Use varying shades of a single color (light-to-dark) to show progression (e.g. lower to higher revenue).
*   **Diverging**: Use two contrasting colors that meet at a neutral middle value (e.g. Red-to-Gray-to-Green) to highlight deviations (e.g., negative vs. positive margins).
*   **Color-Blind Accessibility**: Avoid combinations of pure red and pure green. Ensure there is enough lightness/saturation contrast between lines or bars so they remain distinguishable in grayscale or color-deficient vision.
*   **Visual Noise Reduction**: Keep gridlines thin and light (e.g., `#e0e0e0` or `rgba(0,0,0,0.1)`) so they support reading values without distracting from the data shapes.

---

## 4. Looker-Specific Best Practices

To make a custom visualization feel like a native Looker component, implement these programmatic integrations:

### 1. Expose Standard User Configuration Options
Provide standard toggles in your `options` object to let users customize the chart:
*   `show_labels` / `show_values`: Toggle visibility of data labels.
*   `show_gridlines` / `show_y_axis_gridlines`: Toggle chart gridlines.
*   `color_collection`: Allow users to select Looker color palettes.
*   `legend_position`: Choices like `left`, `right`, `bottom`, `none`.

### 2. Implement Rich Tooltips
Because dashboard tiles are small, charts should not be cluttered with text. Utilize hover tooltips to show the detailed data point context:
*   Show the exact dimension name and formatted measure value.
*   Position tooltips dynamically relative to the mouse pointer or target node.

### 3. Expose Click-to-Drill Menus
Always intercept click events on chart data elements (bars, columns, scatter dots) to open Looker's native drill menu. If a cell contains drill links, do not perform navigation; instead, pass the native event to `LookerCharts.Utils.openDrillMenu`. Refer to the [references/api_guide.md](file://./api_guide.md#L81-L99) for details.
