---
name: looker-custom-viz
description: Comprehensive guide for developing, testing, and deploying Looker Custom Visualizations. Use this skill when you need to build a new specific custom visualization, debug an existing one, or understand the Looker Viz API (v2). It includes a local harness workflow for rapid development and best practices for data handling.
---

# Looker Custom Viz Developer

## Core Philosophy

You are a **Looker Custom Viz Expert**. Your goal is to build robust, performant visualizations that work seamlessly in Looker's unique environment using modern web standards (React 18+, Webpack 5).

### 💡 Looker CLI Recommendation
It is highly recommended to fulfill Looker-side interactions (such as session management, project configurations, manifest definitions, and asset uploads) using the Looker CLI (`looker-cli`) to simplify deployment and testing.

### Development Principles

1.  **Native Fidelity & Typography**: Look and feel exactly like native Looker tiles. Because sandboxed custom visualization iframes do not inherit styles, you must explicitly declare Google's native fonts (resolved dynamically at runtime from the parent origin) and use Looker's exact theme colors and empty states.
2.  **Compile-Safe Deployment**: Never upload untested raw code to a project. Always run offline syntax checks (`node -c path/to/viz.js`) or bundler builds (`npm run build`) before pushing files to prevent breaking Looker dashboards.
3.  **Asset Minification**: Always compress production assets using `terser` to keep files lightweight and minimize dashboard loading latency.
4.  **Simulation & Reality Mapping (Harness First)**: Always use the local testbed (`harness/builder.html`) to isolate and test rendering code. **You must verify the visualization in the local harness and have the user confirm it works before uploading the file to Looker.**
5.  **Clean Dependency Loading**: Prefer using Looker's native `dependencies` array in `manifest.lkml` to load external libraries (like D3 or React) instead of hardcoding dynamic script loaders in your JavaScript. This ensures compatibility with Looker's Content Security Policy (CSP). Always implement a hybrid fallback in your JS loader so it still works in the local offline harness.
6.  **API Verification**: Do not guess method names for external libraries (e.g. D3, Rough.js). Always verify the API usage against documentation or existing examples (e.g. verify `rough.js` uses `rectangle` instead of `rect`).
7. **Git Commit Constraint**: Looker-managed Git does not support commits via the standard API. Do not attempt to find or use CLI commit commands; always instruct the user to commit via the Looker IDE.

## Onboarding Transparency & Alignment
When starting a new custom visualization project, the developer agent **MUST NOT** make modifications to the Looker instance (such as creating projects, connections, or model sets) automatically. Instead, you must:
1.  **Document and Present the exact `looker-cli` commands** needed for these adjustments to the user.
2.  Allow the user to review the commands and execute them manually, or request explicit confirmation before running any instance-modifying command on their behalf.
3.  For reference on `looker-cli` setup and commands, refer to [references/deployment_guide.md](file://./references/deployment_guide.md).

## Quick Start

### 1. Setting Up Your Local Workspace

All Looker-side operations (creating projects, managing development sessions, and uploading visualization files) **must be fulfilled exclusively using the Looker CLI (`looker-cli`)**. 

To set up a local workspace for coding and testing:
1.  **Create a project directory** on your local machine (your active workspace).
2.  **Create your visualization script**: Create your main JavaScript file (e.g., `my_viz.js`) in your project directory.
3.  **Start the harness server**: Run the server directly from the skill's installation directory. You do **not** need to copy any harness files into your project directory:
    ```bash
    python3 /path/to/looker-custom-viz/assets/harness/server.py --port 45873
    ```
    *(Note: Replace `/path/to/looker-custom-viz` with the absolute path to this skill in your environment).*
4.  **Open the Harness**: Open the harness in your browser, passing your visualization script path relative to your project root in the `file` parameter:
    `http://localhost:45873/?file=/my_viz.js`

### 2. Requirements Alignment & Reality Mapping (Mandatory)

**Crucial First Step**: Do not guess the chart shape or configuration panel options. Before writing code, you must align on requirements and map real data structures:

1.  **Request Explore Link**: Ask the user for a link to a representative Looker Explore or a Query Slug (e.g., `xY7s...`) to fetch real data shapes.
2.  **Ask for Configurations & Custom Options**: Ask the user what specific interactive options they want to expose in Looker's visualization config panel (e.g., show labels, legend positions, donut hole size, default chart title, custom toggle buttons).
3.  **Start Proxy Server**: Run the harness API proxy server locally:
    ```bash
    python3 /path/to/looker-custom-viz/assets/harness/server.py --port 45873
    ```
4.  **Import Dynamically**: Open `http://localhost:45873/` in your browser. Click **+ Import**, paste the Explore URL or Query Slug, check **Save permanently**, and click **Import** to load it instantly.

## Development Workflows

1.  **Harness Mode (Fastest, Offline)**:
    *   Run the proxy server locally:
        ```bash
        python3 skills/looker-custom-viz/assets/harness/server.py --port 45873
        ```
    *   Open `http://localhost:45873/skills/looker-custom-viz/assets/harness/builder.html` in your browser.
    *   *Details & Edge Cases*: Refer to [references/deployment_guide.md: Section 1 (Harness Testing)](file://./references/deployment_guide.md#L7-L32).
2.  **Looker Deployment & Live Mode**:
    *   Manage active testing or production deploys using Looker CLI or Git Manifest project integrations.
    *   *Details*: Refer to [references/deployment_guide.md: Section 3 (Deployment Strategies)](file://./references/deployment_guide.md#L52-L87).

## Reference Library

*   **API & Features Guide**: [references/api_guide.md](file://./references/api_guide.md) - Lifecycle methods, parameters, cell HTML formatting, and native drill coordinates.
*   **Data Patterns & Recipes**: [references/data_patterns.md](file://./references/data_patterns.md) - Code patterns for handling pivoted data structures, programmatic drill actions, mock scenarios, coloring fallbacks, and query shape/field count validations.
*   **Harness & Deployment Guide**: [references/deployment_guide.md](file://./references/deployment_guide.md) - Local offline testing, mock scenarios, Looker CLI dev mode, and manifest settings.
*   **Marketplace Requirements**: [references/marketplace_requirements.md](file://./references/marketplace_requirements.md) - Official Looker quality guidelines including code organization, security audits, dependency schemas, and styling consistency checklist.
*   **Styling & Layout Guide**: [references/styling_guide.md](file://./references/styling_guide.md) - ResizeObserver dynamic resizing, padding conventions, dynamic font resolution, and native Looker empty states.
*   **Data Visualization Guide**: [references/visualization_guide.md](file://./references/visualization_guide.md) - Best practices for chart presentation, chart choice rules, axes, coloring, and Looker config parameters.
*   **Charting Library Guide**: [references/charting_library_guide.md](file://./references/charting_library_guide.md) - Evaluation of top JavaScript charting libraries from Developer (performance, security, lifecycle) and Analyst (EDA speed, data overhead) perspectives.

---

## Pre-Flight & Marketplace Checklist

Before deploying your custom visualization to production, verify you have completed these quality checks:

*   [ ] **Call `done()`**: Ensure `done()` is called at the end of `updateAsync` (see [api_guide.md](file://./references/api_guide.md#L15-L24)).
*   [ ] **Query Shape Validation**: Verify measures and dimensions count using `this.addError` (see [data_patterns.md](file://./references/data_patterns.md#L141-L178)).
*   [ ] **Looker Cell Formatting**: Render display values using `LookerCharts.Utils.htmlForCell` (see [api_guide.md](file://./references/api_guide.md#L67-L80)).
*   [ ] **Drill Menus**: Trigger drill menus by passing the native DOM event (see [api_guide.md](file://./references/api_guide.md#L81-L99)).
*   [ ] **Dynamic Font Resolution**: Load `Google Sans` using referrer origin interpolation (see [styling_guide.md](file://./references/styling_guide.md#L45-L77)).
*   [ ] **Fluid Sizing (ResizeObserver)**: Bind container sizing to `ResizeObserver` (see [styling_guide.md](file://./references/styling_guide.md#L5-L39)).
*   [ ] **Tighter Margin Spacing**: Follow standard margin spacing conventions (55px left, 40px bottom, 2px padding) (see [styling_guide.md](file://./references/styling_guide.md#L41-L43)).
*   [ ] **CSP Inline Script Compliance**: Do not use inline HTML handlers; bind programmatically (see [api_guide.md](file://./references/api_guide.md#L101-L119)).
*   [ ] **Exact ID Matching**: Verify `manifest.lkml` ID matches the JS registration ID (see [deployment_guide.md](file://./references/deployment_guide.md#L88-L96)).
*   [ ] **First-Time Prod Deploy**: Project must be pushed to production once to index the custom viz dropdown (see [deployment_guide.md](file://./references/deployment_guide.md#L97-L99)).
*   [ ] **Dependency Declaration**: If the visualization relies on external libraries (e.g., D3, Lodash, Rough.js, ECharts), declare them in the `dependencies` array of the `visualization` block in `manifest.lkml` (see [deployment_guide.md](file://./references/deployment_guide.md#L83)).
*   [ ] **Hybrid Script Loading**: In your JavaScript file, use a hybrid script loader that checks for the global variable (e.g., `window.echarts` or `window.d3`) first. This ensures it uses the Looker-loaded dependency in production (resolving instantly without network calls) but falls back to dynamic CDN loading when running in the local harness.
*   [ ] **Defensive Canvas/DOM Management & `0x0` Guard**: If using ECharts or Chart.js, verify `this.chart.getDom() === activeContainer` inside `updateAsync` before rendering (disposing any detached instances if `create()` re-ran), and pass explicit non-zero width/height fallbacks to `echarts.init()` to prevent `0x0` blank canvas bugs (see [api_guide.md](file://./references/api_guide.md#L23)).
*   [ ] **Safe Option Registration (`registerOptions`)**: If dynamically updating options in `updateAsync`, always verify `typeof this.trigger === 'function'` before calling `this.trigger('registerOptions', options)` with fallback to `window.refreshSettingsPanel(this)` (see [data_patterns.md](file://./references/data_patterns.md#L295)).
*   [ ] **Localhost Font Check**: Check `if (!window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1'))` before injecting Google Sans `@font-face` to prevent `404` errors during local offline testing.
*   [ ] **IDE Git Commit Step**: If using Looker-managed Git (internal bare repositories), the agent **cannot** commit code. You must instruct the user to open the Looker IDE in their browser, click **Commit Changes & Push**, and then click **Deploy to Production** to make the changes live (see [deployment_guide.md](file://./references/deployment_guide.md#L110)).
*   [ ] **Code Minification**: Verify syntax with `node -c` and minify files using `terser` (see [deployment_guide.md](file://./references/deployment_guide.md#L34-L49)).
