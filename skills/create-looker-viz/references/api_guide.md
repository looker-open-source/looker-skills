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

Declare configuration options inside the `options` property of your visualization object. Looker translates this schema into interactive controls inside the **Edit** panel.

### Supported Option Schema Properties
*   `type`: `'string'`, `'number'`, or `'boolean'`.
*   `label`: User-facing label in the Looker settings panel.
*   `default`: Default value when first loaded.
*   `section`: Tab name in Looker's Edit panel (e.g. `"Plot"`, `"Series"`, `"Formatting"`).
*   `order`: Integer sorting order in the panel (lower values appear first).
*   `display`: Controls the UI input widget type:
    *   **Dropdown / Radio** (`type: 'string'` or `'number'`): `display: 'select'` or `'radio'` with a `values` array.
    *   **Text Field** (`type: 'string'` or `'number'`): `display: 'text'`.
    *   **Toggle Switch** (`type: 'boolean'`): Rendered automatically.
    *   **Color Picker / Palette** (`type: 'string'` or `'array'`): `display: 'color'` or `'colors'`.

### Option Declaration Example
```javascript
looker.plugins.visualizations.add({
  id: 'my_chart',
  label: 'My Custom Chart',
  options: {
    show_labels: { type: 'boolean', label: 'Show Data Labels', default: true, section: 'Plot', order: 1 },
    legend_position: {
      type: 'string', label: 'Legend Position', default: 'bottom', display: 'select',
      values: [{ 'Left': 'left' }, { 'Right': 'right' }, { 'Bottom': 'bottom' }, { 'Hidden': 'none' }],
      section: 'Plot', order: 2
    },
    custom_color_palette: {
      type: 'array', label: 'Color Palette', display: 'colors',
      default: ['#1a73e8', '#34a853', '#fbbc05', '#ea4335'], section: 'Series', order: 1
    },
    chart_max_value: { type: 'number', label: 'Y-Axis Maximum', default: 100, display: 'text', section: 'Axes', order: 1 }
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const showLabels = config.show_labels;
    const legendPos = config.legend_position;
    const colors = config.custom_color_palette || ['#1a73e8'];
    const yAxisMax = config.chart_max_value;
    // ... render chart ...
  }
});
```

---

## 5. Loading Dependencies & Harness Compatibility

Handle external libraries (like D3, Rough.js, or React) so they work in Looker's production sandbox (CSP-compliant) and the local offline harness.

### Step 1: Declare Dependencies in `manifest.lkml` (For Production)
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
Since the local harness does not parse `manifest.lkml`, fall back to dynamic script loading when libraries are not already defined on `window`:

```javascript
function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if ((globalName && window[globalName]) || document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Inside updateAsync:
this.clearErrors();
Promise.all([
  loadScript('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', 'd3'),
  loadScript('https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js', 'rough')
]).then(() => {
  this.renderChart(element);
  if (done) done();
}).catch(() => {
  this.addError({ group: "load_dependency", title: "Dependency Error", message: "Failed to load required libraries." });
  if (done) done();
});
```
