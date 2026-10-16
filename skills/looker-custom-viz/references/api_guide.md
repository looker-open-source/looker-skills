# Looker Custom Viz API & Features Guide

This guide covers Looker's Custom Visualization API lifecycle, parameter schemas, and native feature integration (drills, HTML formatting).

---

## 1. Lifecycle Methods
The Visualization API is a state machine. You must handle transitions cleanly.

### `create(element, config)`
*   **Run Once**: Called only when the visualization is first initialized.
*   **Goal**: Create DOM containers, SVG roots, or Canvas elements. Store references on `this` (e.g. `this.chart = ...`).
*   **Do Not**: Render data here. Data is not guaranteed to be available yet.

### `updateAsync(data, element, config, queryResponse, details, done)`
*   **Run Many Times**: Called on every data change, container resize, or option change.
*   **Critical Params**:
    *   `data`: Array of row objects.
    *   `queryResponse`: Metadata (fields, pivots).
    *   `done`: **MUST BE CALLED** when rendering finishes, or PDF/scheduling jobs will hang and timeout.
*   **Error Clearing**: Always call `this.clearErrors()` at the very start.
*   **Settled Animations**: If using animations, only call `done()` *after* they finish.
*   **Responsive Resizing**: Do **NOT** hardcode layout dimensions in your visualization. Looker automatically triggers `updateAsync` when dashboard tiles or iframe windows are resized. You must read width and height dynamically from the parent DOM wrapper (e.g. `const width = element.clientWidth; const height = element.clientHeight;`) and pass them to your rendering layout or React components.
*   **Defensive Canvas/DOM Management (ECharts / Chart.js)**: If `create()` is ever re-called or if DOM containers are replaced during hot reloads (`element.innerHTML`), stored chart instances (`this.chart`) will point to a detached DOM element. Always verify that `this.chart.getDom() === activeContainer` inside `updateAsync` before rendering; if detached, dispose `this.chart` and re-initialize.
*   **`0x0` Canvas Guard**: If `container.clientWidth` or `container.clientHeight` are `0` when `echarts.init()` or `new Chart()` runs, the canvas initializes as `0x0` and remains blank. Always pass explicit fallback dimensions (e.g. `{ width: container.clientWidth || 600, height: container.clientHeight || 500 }`) to `echarts.init()` and `ResizeObserver`.

---

## 2. API Object Schemas

### Data (`data`)
An array of row objects. Each row is a dictionary of `field_name` -> `cell`.
```json
[
  {
    "users.count": {
      "value": 42,
      "rendered": "42",
      "html": "<a href='...'>42</a>",
      "links": [ ... ]
    }
  }
]
```
*   `value`: Raw data (Number, Date). Use for **logic/math/scales**.
*   `rendered`: Formatted string (e.g., "$42.00"). Use for **simple text labels**.
*   `html`: Looker-rendered HTML. **Prioritize this** to preserve links and styling.
*   `links`: Array of drill menu links.

### Config (`config`)
A key-value map of the current visualization options (user selections).
```json
{
  "font_size": "small",
  "show_legend": true
}
```

### Query Response (`queryResponse`)
Metadata about the query fields and pivots.
*   `queryResponse.fields.dimensions`: Array of dimension field definitions.
*   `queryResponse.fields.measures`: Array of measure field definitions.
*   `queryResponse.pivots`: Array of pivot keys (if query is pivoted).

---

## 3. Native Features: Formatting & Drills

### Formatting & HTML
Always use `LookerCharts.Utils.htmlForCell(cell)` to get the display value. It safely falls back: `html` -> `rendered` -> `value`.

*   **React**: Render using `dangerouslySetInnerHTML`:
    ```javascript
    const displayHtml = LookerCharts.Utils.htmlForCell(cell);
    return <div dangerouslySetInnerHTML={{ __html: displayHtml }} onClick={(e) => handleClick(e, cell)} />;
    ```
*   **Vanilla JS**:
    ```javascript
    const displayHtml = LookerCharts.Utils.htmlForCell(cell);
    element.innerHTML = `<div>${displayHtml}</div>`;
    ```

### Drill Menus
To trigger Looker's native drill menu popover, call `LookerCharts.Utils.openDrillMenu`.

*   **Native DOM Event Required**: Looker needs the raw DOM click event to position the popover.
*   **React Trap**: In React, you **must** pass `event.nativeEvent` instead of the React wrapper `SyntheticEvent`. If missed, the menu opens at `(0, 0)` or fails.

```javascript
const handleCellClick = (event, cell) => {
  if (cell.links && cell.links.length > 0) {
    event.preventDefault();
    if (window.LookerCharts && LookerCharts.Utils.openDrillMenu) {
      LookerCharts.Utils.openDrillMenu({
        links: cell.links,
        event: event.nativeEvent // MUST be native event
      });
    }
  }
};
```

### Content Security Policy (CSP) & Event Listeners
Looker runs custom visualizations inside sandboxed iframes with a strict **Content Security Policy (CSP)**. 
*   **Critical Restriction**: Inline JavaScript handlers (like `onclick="..."` or `onmouseover="..."` attributes in HTML/SVG strings) **are blocked by the browser** and will trigger a CSP violation warning.
*   **The Fix (React)**: React's standard JSX event handlers (e.g. `onClick={...}`) are compiled to programmatically bound events and work out of the box.
*   **The Fix (Vanilla JS)**: If you generate HTML or SVG as strings, you must render the elements *without* inline script attributes, mount them to the DOM, and then select the elements to attach listeners programmatically:
    ```javascript
    // 1. Build string with metadata attributes instead of inline handlers
    let svgHtml = `<rect class="drillable" data-group="0" ... />`;
    element.innerHTML = svgHtml;

    // 2. Select elements and attach event listeners programmatically
    element.querySelectorAll('.drillable').forEach(el => {
      el.addEventListener('click', (event) => {
        const groupIdx = el.getAttribute('data-group');
        // Trigger drill menu...
      });
    });
    ```

---

## 4. Defining Configuration Options (The Settings Pane)

To allow users to customize your visualization (e.g., toggle gridlines, change colors, adjust font sizes), declare configuration options inside the `options` property of your visualization object. Looker automatically translates this schema into interactive control widgets inside the visualization's **Edit** panel.

### Supported Option Schema Properties
Each option key maps to a configuration definition with the following properties:
*   `type`: The data type of the option. Must be one of: `'string'`, `'number'`, or `'boolean'`.
*   `label`: The user-facing label shown in the Looker settings panel.
*   `default`: The default value when the visualization is first loaded.
*   `section`: The tab name in Looker's Edit panel (e.g. `"Plot"`, `"Series"`, `"Formatting"`) to group controls together. If omitted, the option is placed in the default tab.
*   `order`: An integer determining the sorting order of the controls in the panel (lower values appear first).
*   `display`: Controls the UI input widget type. Supported displays depend on the `type`:
    *   **Dropdown Selection** (`type: 'string'` or `'number'`): Set `display: 'select'` and provide a `values` array.
    *   **Radio Buttons** (`type: 'string'` or `'number'`): Set `display: 'radio'` and provide a `values` array.
    *   **Text Field** (`type: 'string'` or `'number'`): Set `display: 'text'`.
    *   **Toggle Switch (Checkbox)** (`type: 'boolean'`): Looker renders a simple toggle switch automatically (no `display` setting required).
    *   **Color Picker / Palette** (`type: 'string'` or `'array'`): Set `display: 'color'` or `display: 'colors'`.

### Option Declaration Example
```javascript
looker.plugins.visualizations.add({
  id: 'my_chart',
  label: 'My Custom Chart',
  options: {
    // 1. Boolean Toggle (renders as a checkbox/toggle switch)
    show_labels: {
      type: 'boolean',
      label: 'Show Data Labels',
      default: true,
      section: 'Plot',
      order: 1
    },
    // 2. Select Dropdown (renders as a dropdown menu)
    legend_position: {
      type: 'string',
      label: 'Legend Position',
      default: 'bottom',
      display: 'select',
      values: [
        { 'Left': 'left' },
        { 'Right': 'right' },
        { 'Bottom': 'bottom' },
        { 'Hidden': 'none' }
      ],
      section: 'Plot',
      order: 2
    },
    // 3. Color Palette Selector (renders Looker's color palette picker)
    custom_color_palette: {
      type: 'array',
      label: 'Color Palette',
      display: 'colors',
      default: ['#1a73e8', '#34a853', '#fbbc05', '#ea4335'],
      section: 'Series',
      order: 1
    },
    // 4. Numeric Text Input (renders as a numeric text box)
    chart_max_value: {
      type: 'number',
      label: 'Y-Axis Maximum',
      default: 100,
      display: 'text',
      section: 'Axes',
      order: 1
    }
  },
  // ... create, updateAsync ...
});
```

### Accessing Options inside `updateAsync`
The selected configuration values are passed directly into the `config` parameter of `updateAsync`. You can read them by key:
```javascript
updateAsync: function(data, element, config, queryResponse, details, done) {
  const showLabels = config.show_labels; // true/false
  const legendPos = config.legend_position; // 'left', 'right', 'bottom', or 'none'
  const colors = config.custom_color_palette || ['#1a73e8']; 
  const yAxisMax = config.chart_max_value;
  // ... render chart ...
}
```


---

## 5. Loading Dependencies & Harness Compatibility

When your custom visualization requires external libraries (like D3, Rough.js, or React), you must handle loading them in a way that works in Looker's production environment (complying with CSP) and your local offline development harness.

### Step 1: Declare Dependencies in `manifest.lkml` (For Production)
Declare all external library URLs in the `dependencies` array of the `visualization` block. Looker will load these libraries natively in the sandbox before executing your visualization script.

```lkml
visualization: {
  id: "my_custom_viz"
  label: "My Custom Chart"
  file: "my_viz.js"
  dependencies: [
    "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js",
    "https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js"
  ]
}
```

### Step 2: Implement Hybrid Loader in JS (For Harness Compatibility)
Since the local harness does not parse `manifest.lkml`, you must write a script loader that falls back to dynamic loading when the libraries are not already globally defined. 

Use this pattern at the start of your visualization file to define a hybrid loader:

```javascript
// Helper to load external scripts dynamically, checking if already loaded globally (via manifest)
function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    // 1. If library is already loaded globally (by Looker manifest), resolve immediately
    if (globalName && window[globalName]) {
      resolve();
      return;
    }
    // 2. If script tag already exists in document, resolve
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    // 3. Otherwise (Local Harness mode), load the script dynamically
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

Then, call this loader inside `updateAsync` before rendering:

```javascript
updateAsync: function(data, element, config, queryResponse, details, done) {
  this.clearErrors();

  // Load dependencies before rendering
  Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', 'd3'),
    loadScript('https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js', 'rough')
  ]).then(() => {
    // Render chart once libraries are ready
    this.renderChart(element);
    if (done) done();
  }).catch(err => {
    this.addError({
      group: "load_dependency",
      title: "Dependency Error",
      message: "Failed to load required libraries."
    });
    if (done) done();
  });
}
```
