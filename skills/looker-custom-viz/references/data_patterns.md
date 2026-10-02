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

Always guard against empty results.

```javascript
// Step 1: Inject Looker host fonts inside create() dynamically
create: function(element, config) {
  let parentOrigin = window.location.origin;
  try {
    if (document.referrer) {
      parentOrigin = new URL(document.referrer).origin;
    }
  } catch (e) {}

  if (!document.getElementById('looker-native-fonts')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'looker-native-fonts';
    styleEl.innerHTML = `
      @font-face {
        font-family: 'Google Sans';
        font-weight: 400;
        font-style: normal;
        src: url('${parentOrigin}/fonts/vendor/google-sans/GoogleSans-Regular-cb71e97c92.woff') format('woff');
      }
      @font-face {
        font-family: 'Google Sans';
        font-weight: 500;
        font-style: normal;
        src: url('${parentOrigin}/fonts/vendor/google-sans/GoogleSans-Medium-36c5aa25bb.woff') format('woff');
      }
    `;
    document.head.appendChild(styleEl);
  }
  // ...
}

// Step 2: Handle empty dataset check
if (!data || data.length === 0) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-family: 'Google Sans', sans-serif;
        gap: 6px;
      ">
        <div style="width: 24px; height: 24px; color: rgb(140, 140, 140); display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 24px; height: 24px;">
            <path fill="none" d="M0 0h24v24H0V0z"></path>
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
          </svg>
        </div>
        <span style="
          box-sizing: border-box;
          margin: 0px;
          padding: 0px;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5rem;
          text-align: center;
          color: rgb(38, 45, 51);
        ">No results</span>
      </div>
    `;
    if (done) done();
    return;
}
```

For the exact native CSS specs and dynamically resolved fonts, refer to the [references/styling_guide.md](file://./styling_guide.md).

## 4. Coloring

Use Looker's passed color palette if available.

```javascript
const palette = config.custom_color_palette || 
                looker.charts.Utils.getScale("categorical", 10).range();
```

*   **Warning**: `getScale` is not always documented reliable. It's safer to just rely on a `collection` option if you want robust native color support, or expose standard color pickers.

## 5. Merged Results

Merged Results are a common source of bugs because they structure `queryResponse` differently.

*   **Field Aliasing**: Fields often get prefixed (e.g., `q1_order_items.count`, `q2_order_items.count`). **Never hardcode field names** if you want to support merged results. Always inspect `queryResponse.fields.measure_like`.
*   **Missing Dimensions**: Merged results often report empty `dimensions` arrays, moving everything into `measure_like`.
*   **Data Structure**: They typically return a flat array of rows similar to standard queries, but the keys in the row objects match the *aliased* names found in `measure_like`.

```javascript
// Example: Dynamically finding valid numeric fields in a Merged Result
const measures = queryResponse.fields.measure_like;
data.forEach(row => {
    measures.forEach(measure => {
        // measure.name might be "q1_order_items.count"
        // Always derive the key from the response, don't guess it.
        const cell = row[measure.name]; 
        console.log(cell.value); 
    });
});
```

---

## 6. Query Shape & Field Validation

Visualizations are designed for specific data structures (e.g., a pie chart needs exactly 1 dimension and 1 measure; a scatter plot needs at least 2 measures). You must validate the query shape at the start of `updateAsync` to prevent the visualization from crashing.

### The Validation Pattern
1.  **Extract Fields**: Grab the lists of active dimensions and measures.
2.  **Verify Constraints**: Count them and compare against your requirements.
3.  **Display Error**: If invalid, call `this.addError(...)` and halt execution.
4.  **Signal Completion**: **Always call `done()`** even if you display an error, so Looker's rendering supervisor knows the iframe is finished and won't hang scheduler processes.

```javascript
updateAsync: function(data, element, config, queryResponse, details, done) {
  // 1. Clear any previous errors
  this.clearErrors();

  const dimensions = queryResponse.fields.dimensions || [];
  const measures = queryResponse.fields.measures || [];

  // 2. Enforce shape validation rules (e.g., requires at least 1 dim and 1 measure)
  if (dimensions.length < 1 || measures.length < 1) {
    element.innerHTML = ''; // Clear container
    
    this.addError({
      group: "query_shape",
      title: "Incompatible Query Shape",
      message: "This visualization requires at least 1 dimension and 1 measure to render."
    });
    
    // 3. Always finalize execution
    done();
    return;
  }

  // ... Proceed with normal chart rendering ...
}
```

---

## 7. Handling Hierarchical / Grouped Data (e.g. Sunburst, Treemaps)

Many hierarchical visualizations (like ECharts Sunburst or Treemaps) require data structured as a nested tree rather than Looker's flat row array. You must write a helper to build this tree dynamically.

### The Pattern
1.  **Preserve Dimension Order**: Use the order of dimensions in `queryResponse.fields.dimensions` to define the levels of the hierarchy.
2.  **Leaf Nodes**: Only assign values (and measure-specific drill links) to the leaf nodes.
3.  **Parent Nodes**: Assign dimension-specific drill links to intermediate parent nodes so users can drill at any level of the hierarchy.

```javascript
function convertToHierarchy(data, dimensions, measureName) {
  const root = [];

  data.forEach(row => {
    let currentLevel = root;

    dimensions.forEach((dim, dimIdx) => {
      const cell = row[dim.name];
      const name = cell ? String(cell.value) : 'Null';
      const dimLinks = cell ? cell.links : [];
      
      // Find if this node already exists at the current level
      let node = currentLevel.find(n => n.name === name);

      if (!node) {
        node = { 
          name: name,
          links: dimLinks // Store dimension drills on parent nodes
        };
        currentLevel.push(node);
      }

      if (dimIdx === dimensions.length - 1) {
        // Leaf node: set value and measure drills
        const measCell = row[measureName];
        node.value = measCell ? (Number(measCell.value) || 0) : 0;
        // Fallback to dimension links if measure links are missing
        node.links = (measCell && measCell.links && measCell.links.length > 0) ? measCell.links : dimLinks;
        node.cell = measCell; // Store cell for custom tooltips
      } else {
        // Parent node: ensure children array exists and descend
        if (!node.children) {
          node.children = [];
        }
        currentLevel = node.children;
      }
    });
  });

  return root;
}
```

---

## 8. Value Formatting for Aggregated/Grouped Data

When creating custom visualizations that aggregate or roll up data (like Sunbursts or Treemaps), you must format the calculated values yourself. Looker only sends pre-formatted `rendered` values for individual cells, not for your custom groups.

### The Pattern
1.  **Use `ssf` Library**: Load the standard `ssf` (SpreadSheet Format) library to apply Looker's LookML `value_format` string.
2.  **Fallback to Rendered or Browser Default**: If `value_format` is missing, try to find an exact matching raw value in the dataset and use its pre-formatted `rendered` string. If that fails, fall back to the browser's native `toLocaleString()` (which adds standard thousands separators).

```javascript
// Helper to get a formatter based on measure metadata or fallback to default formatting
function getFormatterForMeasure(data, measure, measureName) {
  if (measure && measure.value_format && window.SSF) {
    return function(value) {
      try {
        return SSF.format(measure.value_format, value);
      } catch (e) {
        console.warn("SSF formatting failed, falling back to local formatting", e);
        return Number(value).toLocaleString();
      }
    };
  }

  // Fallback: If no format defined, try to find a matching rendered value,
  // or use default browser formatting (which adds commas).
  return function(value) {
    if (value === null || value === undefined) return '';
    const matchingRow = data.find(row => {
      const cell = row[measureName];
      return cell && cell.value === value;
    });
    if (matchingRow && matchingRow[measureName].rendered) {
      return matchingRow[measureName].rendered;
    }
    return Number(value).toLocaleString();
  };
}
```

---

## 9. Dynamic Option Registration (`registerOptions`)

When a visualization requires dynamic user options based on the active query schema (e.g. allowing users to select which measure from `queryResponse.fields.measures` sizes the slices in a Sunburst or Treemap), you can register updated options inside `updateAsync`.

### The Pattern
Always check if `typeof this.trigger === 'function'` before calling `this.trigger('registerOptions', options)` so the code runs safely across both live Looker instances and the local offline harness:

```javascript
// Build select options from available measures
const measureValues = (queryResponse.fields.measures || []).map(m => {
  const obj = {};
  obj[m.label_short || m.label || m.name] = m.name;
  return obj;
});

const dynamicOptions = Object.assign({}, this.options);
dynamicOptions.size_by_measure = {
  type: 'string',
  label: 'Size by Measure',
  display: 'select',
  values: measureValues,
  default: queryResponse.fields.measures[0] ? queryResponse.fields.measures[0].name : '',
  section: 'Data'
};

if (typeof this.trigger === 'function') {
  this.trigger('registerOptions', dynamicOptions);
} else {
  this.options = dynamicOptions;
  if (window.refreshSettingsPanel) window.refreshSettingsPanel(this);
}
```

