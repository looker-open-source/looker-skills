# Data Patterns & Recipes

## 1. Handling Pivots

When data is pivoted, the `data` array structure changes. You cannot just look at `fields.measures`.

### The Pattern
1.  **Check for Pivots**: `queryResponse.pivots` (Array).
2.  **Iterate Columns**: You typically want to generate columns for each Pivot + Measure combination.

```javascript
const pivots = queryResponse.pivots || [];
const measures = queryResponse.fields.measures;

// If Pivoted
if (pivots.length > 0) {
    pivots.forEach(pivot => {
        measures.forEach(measure => {
            const fieldKey = measure.name;
            const pivotKey = pivot.key;
            // Access data using the pivot key
            // Note: Pivot keys often look like "Value|FIELD|Value" (e.g., "2026|FIELD|Shipped")
            const cell = row[fieldKey][pivotKey]; 
        });
    });
}
```

**Key Difference**:
*   **Flat**: `row['users.count'].value`
*   **Pivoted**: `row['users.count']['PivotValue_1'].value`

## 2. Handling Drills

Drills are essentially a list of links attached to a cell.

```javascript
/* inside your click handler */
function onCellClick(event, cell) {
  // 1. Check if links exist
  if (!cell.links || cell.links.length === 0) return;

  // 2. Prevent default navigation if using <a> tag
  event.preventDefault();

  // 3. Open Looker Menu
  LookerCharts.Utils.openDrillMenu({
    links: cell.links,
    event: event
  });
}
```

## 3. Handling "No Data"

Always guard against empty results at the start of `updateAsync` and render Looker's native empty state before calling `done()`:

```javascript
if (!data || data.length === 0) {
  container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:'Google Sans',sans-serif;gap:6px;color:rgb(38,45,51);font-weight:500;">No results</div>`;
  if (done) done();
  return;
}
```

For the complete native SVG icon, CSS specs, and dynamically resolved `Google Sans` font injection, refer to [references/styling_guide.md](styling_guide.md).

## 4. Coloring

Use Looker's passed color palette if available:

```javascript
const palette = config.custom_color_palette ||
                looker.charts.Utils.getScale("categorical", 10).range();
```

*   **Warning**: `getScale` is not always reliably documented. Prefer relying on a `collection` option or exposing standard color pickers.

## 5. Merged Results

Merged Results structure `queryResponse` differently:
*   **Field Aliasing**: Fields often get prefixed (e.g., `q1_order_items.count`). Never hardcode field names; inspect `queryResponse.fields.measure_like`.
*   **Missing Dimensions**: Merged results often report empty `dimensions` arrays, moving everything into `measure_like`.

```javascript
// Dynamically finding valid numeric fields in a Merged Result
const measures = queryResponse.fields.measure_like;
data.forEach(row => {
  measures.forEach(measure => {
    const cell = row[measure.name];
    console.log(cell.value);
  });
});
```

---

## 6. Query Shape & Field Validation

Validate the query shape at the start of `updateAsync` (e.g., 1 dimension and 1 measure for a pie chart) and always call `done()` even when displaying an error:

```javascript
updateAsync: function(data, element, config, queryResponse, details, done) {
  this.clearErrors();
  const dimensions = queryResponse.fields.dimensions || [];
  const measures = queryResponse.fields.measures || [];

  if (dimensions.length < 1 || measures.length < 1) {
    element.innerHTML = '';
    this.addError({
      group: "query_shape",
      title: "Incompatible Query Shape",
      message: "This visualization requires at least 1 dimension and 1 measure to render."
    });
    done();
    return;
  }
  // ... Proceed with normal chart rendering ...
}
```

---

## 7. Handling Hierarchical / Grouped Data (e.g. Sunburst, Treemaps)

Hierarchical visualizations require a nested tree rather than Looker's flat row array. Preserve dimension order from `queryResponse.fields.dimensions`, assign values/measure drills to leaf nodes, and assign dimension drills to parent nodes:

```javascript
function convertToHierarchy(data, dimensions, measureName) {
  const root = [];
  data.forEach(row => {
    let currentLevel = root;
    dimensions.forEach((dim, dimIdx) => {
      const cell = row[dim.name];
      const name = cell ? String(cell.value) : 'Null';
      const dimLinks = cell ? cell.links : [];
      let node = currentLevel.find(n => n.name === name);
      if (!node) {
        node = { name, links: dimLinks };
        currentLevel.push(node);
      }
      if (dimIdx === dimensions.length - 1) {
        const measCell = row[measureName];
        node.value = measCell ? (Number(measCell.value) || 0) : 0;
        node.links = (measCell?.links?.length > 0) ? measCell.links : dimLinks;
        node.cell = measCell;
      } else {
        node.children = node.children || [];
        currentLevel = node.children;
      }
    });
  });
  return root;
}
```

---

## 8. Value Formatting for Aggregated/Grouped Data

When rolling up data into custom groups, format calculated values using `ssf` (SpreadSheet Format) with the measure's `value_format`, falling back to matching `rendered` strings or `toLocaleString()`:

```javascript
function getFormatterForMeasure(data, measure, measureName) {
  if (measure?.value_format && window.SSF) {
    return (value) => {
      try { return SSF.format(measure.value_format, value); }
      catch { return Number(value).toLocaleString(); }
    };
  }
  return (value) => {
    if (value === null || value === undefined) return '';
    const match = data.find(r => r[measureName]?.value === value);
    return match?.[measureName]?.rendered || Number(value).toLocaleString();
  };
}
```

---

## 9. Dynamic Option Registration (`registerOptions`)

When registering dynamic options inside `updateAsync` based on `queryResponse.fields.measures`, always verify `typeof this.trigger === 'function'` first:

```javascript
const measureValues = (queryResponse.fields.measures || []).map(m => ({
  [m.label_short || m.label || m.name]: m.name
}));
const dynamicOptions = {
  ...this.options,
  size_by_measure: {
    type: 'string', label: 'Size by Measure', display: 'select',
    values: measureValues, default: queryResponse.fields.measures[0]?.name || '', section: 'Data'
  }
};
if (typeof this.trigger === 'function') {
  this.trigger('registerOptions', dynamicOptions);
} else {
  this.options = dynamicOptions;
  if (window.refreshSettingsPanel) window.refreshSettingsPanel(this);
}
```

---

## 10. Numeric Data Mapping & NaN Prevention

Looker query responses can contain non-numeric or `null` data. Always verify the value type before mapping row fields to charts to prevent `NaN` errors:

```javascript
const measures = Object.keys(row).filter(key =>
  row[key].value !== null && typeof row[key].value === 'number'
);
```


