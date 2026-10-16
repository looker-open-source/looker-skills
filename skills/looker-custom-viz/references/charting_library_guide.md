# Choosing a Data Visualization Library: Developer & Analyst Perspectives

This guide evaluates the top JavaScript data visualization libraries for building **Looker Custom Visualizations**. 

Because Looker custom visualizations render inside client-side browser iframes, **Python-based visualization libraries (like Matplotlib or Seaborn) cannot be used**. Developers and analysts must select a JavaScript-compatible library that complies with Looker's security sandboxing, iframe constraints, and performance requirements.

---

## 🌐 JavaScript Ecosystem

### 1. Apache ECharts (Recommended)
*Enterprise-grade, high-performance visual framework backed by the Apache Software Foundation.*

*   **💻 Developer Persona**:
    *   **Architecture & Performance**: Supports Canvas, SVG, and GPU-accelerated WebGL rendering. Natively handles datasets containing millions of points. Excellent mobile responsiveness.
    *   **Looker Integration**: Highly compatible. Renders cleanly inside Looker's sandboxed iframes. Since it is declarative, you can easily map Looker's configuration panel options to ECharts config objects.
        *   *Lifecycle & DOM Guard*: If `create()` runs multiple times, check `if (this.chart && this.chart.getDom() !== container) { this.chart.dispose(); }` before `echarts.init()` to avoid drawing to a detached canvas.
        *   *`0x0` Canvas Fallback*: Pass explicit fallback dimensions (`{ width: container.clientWidth || 600, height: container.clientHeight || 500 }`) to `echarts.init()` so early layout delays do not produce a blank `0x0` chart.
    *   **Bundle Size**: Heavy (~300KB gzipped). Not ideal for ultra-lightweight pages, but perfect for full-featured Looker analytical dashboards.
    *   **Security (CSP)**: Safe and secure; does not require `eval()` or inline scripts if loaded via bundle or static CDN.
*   **📊 Analyst Persona**:
    *   **Exploration Speed**: Very fast. You get an animated, interactive chart with rich features in a few lines of JSON config.
    *   **Advanced Features**: Powerful built-in tooltip popovers, hover effects (expanding slices), legend filtering, and complex charts (Sankey, Heatmaps, Treemaps, GIS).
    *   **Collision-Free Labels**: Built-in line positioning prevents labels on small shares from overlapping.
    *   **Ideal Use Case**: Heavy analytical Looker tiles, big data visualizations, and professional dashboards.

---

### 2. Chart.js
*Simple, canvas-based standard charts.*

*   **💻 Developer Persona**:
    *   **Architecture & Performance**: Canvas-based charting engine. Great rendering performance for standard chart types. Responsive resizing and basic animations work out of the box.
    *   **Looker Integration**: Easy to integrate. You only need to import the lightweight script inside your Looker viz registration code.
    *   **Bundle Size**: Extremely small and lightweight (~60KB gzipped).
*   **📊 Analyst Persona**:
    *   **Exploration Speed**: Very fast. Excellent default themes and animations.
    *   **Limitations**: Tied to 8 standard chart types. Customizing tooltips or drawing custom elements requires writing canvas override plugins, which can be verbose.
    *   **Ideal Use Case**: Simple, lightweight dashboard tiles (KPIs, simple bar/line trends) where load speed is a priority over complex custom shapes.

---

### 3. D3.js (Data-Driven Documents)
*The low-level library for complete visual freedom.*

*   **💻 Developer Persona**:
    *   **Architecture & Performance**: Low-level DOM manipulation library. Binds raw data to SVG, HTML, or Canvas elements. Exceptional performance for custom math and layouts because it bypasses overhead wrappers.
    *   **Looker Integration**: Fully compatible, but requires you to manage all rendering, mouse events, and resize triggers manually.
    *   **Bundle Size**: Modular. You can import only what you need (e.g. `d3-scale`, `d3-shape`) to keep your JS bundle under 20KB.
    *   **Security (CSP)**: Fully compliant. Does not use unsafe evaluation wrappers.
*   **📊 Analyst Persona**:
    *   **Exploration Speed**: Extremely slow. There is no `d3.pieChart()` or `d3.barChart()`. You must build axis lines, gridlines, shapes, and hover tooltips from scratch.
    *   **Data Parsing Overhead**: High. Requires significant data structuring and math calculations to map columns to coordinates.
    *   **Ideal Use Case**: Building completely bespoke, non-standard visual structures (e.g. custom maps, complex network graphs, and interactive infographic layouts).

---

### 4. Recharts (React Only)
*JSX-native, composable charts for React.*

*   **💻 Developer Persona**:
    *   **Architecture & Performance**: Composable SVG chart components built specifically for React. Uses D3 scales under the hood. Can suffer from performance bottlenecks if rendering/animating thousands of DOM nodes simultaneously.
    *   **Looker Integration**: Requires your Looker custom visualization to be built using a React wrapper. Unusable if you are using vanilla JavaScript.
    *   **Bundle Size**: Moderate. Fits seamlessly into React code-splitting configurations.
*   **📊 Analyst Persona**:
    *   **Exploration Speed**: Fast. You assemble charts visually using React tags (e.g. `<AreaChart>`, `<Tooltip />`).
    *   **Out-of-the-Box Aesthetics**: Modern, clean, and minimalist.
    *   **Ideal Use Case**: Teams standardizing their Looker custom visualizations on React-based templates.

---

## 📊 Summary Selection Matrix for Looker Custom Visualizations

| Library | Render Target | Abstraction Level | Best For (Developer) | Best For (Analyst) | Looker Framework Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apache ECharts** | Canvas / SVG / WebGL | Mid / High | Big data performance, rich features, declarative config mapping | Ready-to-go tooltips, legend filtering, and label collision solving | **Highly Recommended** (Best fit for standard and complex dashboards) |
| **Chart.js** | Canvas | High | Tiny bundle size, fast loading, low setup | Standard simple charts with smooth default animations | **Recommended** (Best for simple, speed-critical dashboard tiles) |
| **D3.js** | SVG / Canvas / DOM | Low | Complete visual freedom, zero architectural constraints | Bespoke, storytelling graphics and custom layouts | **Use Only When Needed** (High development time overhead) |
| **Recharts** | SVG | High | Composable JSX elements for React-based viz projects | React state-aligned charting | **Recommended for React projects** (Do not use in vanilla JS setups) |
