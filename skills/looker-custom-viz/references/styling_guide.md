# Looker Custom Viz: Styling & Layout Guide

This guide covers styling guidelines, layout requirements, dynamic typography resolution, and native Looker component fidelity for custom visualizations.

---

## 1. Dynamic Sizing & Layout Reflowing

Looker dashboards and explore tiles are fluid grids. Visualizations must resize dynamically and cleanly to prevent vertical or horizontal letterboxing.

### The Initial Zero-Height Trap
When Looker first initializes a visualization, the container element's client dimensions (`element.clientWidth` / `element.clientHeight`) are often reported as `0` or small default placeholder values (e.g. `618x301`) before the parent dashboard grid finishes mounting and settling.

### The ResizeObserver Solution
Do not rely solely on Looker's `updateAsync` trigger to handle container resizing. Always wrap your chart's container element in a native browser **`ResizeObserver`** inside your visualization's `create` method.
*   **Benefits**: Intercepts any dimensions shifts, reads the exact settled pixel dimensions, and redraws the canvas/SVG dynamically.
*   **Fluid Containers**: Always keep the root container fluid (`width: 100%; height: 100%`) and avoid hardcoded wrapper dimensions.

**Example Pattern**:
```javascript
create: function(element, config) {
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";
  element.appendChild(container);
  
  this.chartContainer = container;

  // Set up ResizeObserver to handle fluid layout updates
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        this.renderChart(width, height); // Triggers canvas/SVG redraw
      }
    }
  });
  resizeObserver.observe(container);
}
```

---

## 2. Margin Spacing Conventions

Visualizations must maximize the chart canvas because dashboard tiles are relatively small. To align with Looker's native charts, utilize the following margin conventions:
*   **Outer Padding**: Keep the wrapper padding to a tight `2px`.
*   **Left Margin**: Keep around `55px` (sufficient to display abbreviated Y-axis labels like "120.3M").
*   **Bottom Margin**: Keep around `40px` (sufficient to render slightly rotated X-axis labels).
*   **Top Margin**: Keep to `15px` for a single-series visualization, or `35px` for multi-series to accommodate the chart legend.

---

## 3. Dynamic Typography Resolution

Looker uses its proprietary `Google Sans` font family for UI styling. However, because the visualization iframe runs on a separate origin (sandboxed), direct access to the parent document's font assets is blocked.

To render `Google Sans` without hardcoding specific Looker host URLs (which breaks portability across development, staging, and production environments), extract the parent host origin dynamically at runtime:

```javascript
create: function(element, config) {
  // Resolve parent origin dynamically via referrer to support private/different domains
  let parentOrigin = window.location.origin;
  try {
    if (document.referrer) {
      parentOrigin = new URL(document.referrer).origin;
    }
  } catch (e) {
    // Fallback to local origin
  }

  // Inject font-face rules using absolute URLs derived from the parent host
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
}
```

---

## 4. Native Looker Empty States

If a query returns no rows, or configuration options are missing, the visualization **must** match the styling of Looker's native "No results" empty states rather than rendering a blank container.

### Native CSS Specification

**Icon Details**:
*   Container: `24x24` pixels.
*   Color: `rgb(140, 140, 140)`.
*   Layout: Centered, with a tight `6px` gap between the icon and text.

**Text Span Styles**:
```css
box-sizing: border-box;
font-family: inherit; /* Google Sans */
margin: 0px;
padding: 0px;
font-size: 1rem;
font-weight: 500;
line-height: 1.5rem;
text-align: center;
color: rgb(38, 45, 51); /* Charcoal */
```

### Reference Implementation (Vanilla JS)
```javascript
// Render native empty state
element.innerHTML = `
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: 'Google Sans', sans-serif;
    gap: 6px;
  ">
    <div style="width: 24px; height: 24px; color: rgb(140, 140, 140); display: flex; align-items: center; justify-content: center;">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" style="width: 24px; height: 24px;">
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
```
