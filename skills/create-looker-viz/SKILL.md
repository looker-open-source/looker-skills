---
name: create-looker-viz
description: Use this skill when the user asks to create, architect, or generate a Looker Custom Visualization. It provides a generator supporting React/TS and Vanilla JS with a built-in offline mock-data testing harness.
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Looker Custom Visualization Generator

This skill provides a workflow for engineering Looker custom visualizations. It eliminates the stark tradeoff between file size and developer experience (DX). By utilizing Vite for both frameworks, developers can enjoy:
- **Instant Hot-Module Replacement (HMR)**
- **Offline Mock-Data Harness**
- **Build Pipeline**

## 0. CRITICAL BEHAVIORAL DIRECTIVES (MUST READ FIRST)
1. **Always ask for a query slug first (Lack of Planning):** **NEVER** write code or guess data shapes without first halting execution and explicitly asking the user for a representative Looker Explore URL or Query Slug. 
2. **The Rule of Surgical Modification (Rewriting over Refactoring):** When modifying an existing visualization file, you **MUST NOT** rewrite or regenerate the entire file. You **MUST** perform surgical, localized block replacements to modify only the broken or requested lines. Complete rewrites waste tokens and delete human-written logic.
3. **Data Mapping Bug Prevention (NaN fix):** Looker query responses can contain non-numeric data. Always verify the value type before mapping to charts to prevent `NaN` errors. Use this exact syntax:
   ```javascript
   const measures = Object.keys(row).filter(key => 
     row[key].value !== null && typeof row[key].value === 'number'
   );
   ```
4. **Safe Option Registration:** Looker's `this.trigger` is not always available immediately during initialization. You must validate it before calling it:
   ```javascript
   if (typeof this.trigger === 'function') {
       this.trigger('registerOptions', options);
   } else {
       window.refreshSettingsPanel && window.refreshSettingsPanel(this);
   }
   ```

## Core Agent Instructions
You are a **Looker Custom Viz Expert**. When the user asks you to generate a new visualization, you must adhere to these directives:

### 1. Planning & Pre-Flight
1. **Pre-flight Check:** Run `git status` to ensure you aren't overwriting uncommitted work.
2. **Reality Mapping (No Guessing):** Before writing code, ask the user for a representative Looker Explore URL or Query Slug to fetch the real data shape.
3. **Align on Configs:** Ask the user what Looker config options they want to expose (e.g., toggle labels, colors, sizes).

### 2. Implementation Rules
4. **Strong Typings (React/TS Mode):** Never use `any`. Always generate or update `src/utils/types.ts` with strict TypeScript interfaces tailored to the user's specific Looker data shape.
5. **Native Fidelity & Typography:** Visualizations must look like native Looker tiles. Explicitly declare `Google Sans` fonts and use standard Looker margin spacing (e.g., 55px left, 40px bottom).
6. **CSP & Security:** Do not use inline HTML event handlers (e.g., `onclick=...`); bind events programmatically to respect Content Security Policy (CSP).
7. **Drill Menus:** Trigger Looker's native drill menus by capturing and passing the native DOM event back to the Looker API.

### 3. Verification & Communication
8. **Final Build Verification:** Before concluding your turn, you **MUST** run `npm run build` and `npm run lint` (if applicable) to ensure the code compiles without errors.
9. **Looker IDE Git Constraints:** You **cannot** commit code via standard API/CLI for Looker-managed repositories. Instruct the user to open the Looker IDE to commit and deploy.
10. **Subagent Delegation:** If you encounter complex bugs or need to research documentation, use the `invoke_subagent` tool to spawn a `research` subagent.
11. **Artifact Formatting:** Do not dump massive code blocks or reports into chat. Use the `write_to_file` tool to create persistent markdown artifacts (`ArtifactMetadata`).

### 4. Advanced Looker Nuances
12. **Query Shape Validation:** Always check the number of dimensions/measures returned. If the data shape is incompatible with the chart (e.g., expecting 2 measures but getting 0), use `this.addError({ title: "...", message: "..." })` to display a native error.
13. **Hybrid Script Loading (Vanilla):** If using external libraries in Vanilla JS, check for the global variable (e.g., `window.echarts`) first to use Looker's `manifest.lkml` loader, but fallback to a dynamic CDN load so the offline Vite harness still works.
14. **Localhost Font Check:** When declaring Looker's custom fonts, wrap it in a `!window.location.origin.includes('localhost')` check to prevent 404 console errors during offline development.
15. **Unknown Chart Types:** If the user requests a chart type not covered by standard templates, generate a baseline empty component, run `npm install <package>`, and overwrite the rendering body.

### 5. Deployment & Registration
16. **Exact ID Matching:** Ensure the visualization `id` in the JavaScript `looker.plugins.visualizations.add()` exactly matches the `id` in the `manifest.lkml`.
17. **First-Time Indexing:** Remind the user that a new custom visualization must be pushed to the Looker `production` branch at least once before it will appear in the Explore visualization dropdown.

## Supported Frameworks

1. **React / TypeScript (`--framework react`)**
   - **Best For:** Complex interactive dashboards, enterprise-scale projects.
   - **Features:** Strong typing of Looker data shapes, component encapsulation, out-of-the-box Chart.js integration.
   
2. **Vanilla JavaScript (`--framework vanilla`)**
   - **Best For:** Extremely lightweight visualizations, zero React dependencies, projects requiring strict final bundle size limits.
   - **Features:** Full Vite HMR support, direct DOM manipulation, bare-bones Chart.js integration.

## Usage Instructions

To engineer a new visualization, use the CLI tool bundled with this skill:

1. Execute the Python generator:
   [scripts/create_looker_viz.py](scripts/create_looker_viz.py)
   *(Run `python3 <path-to-script> --name <dir> --title "<title>" --framework <react|vanilla>`)*

## Supported Chart Templates
When generating a visualization, you can implement one of these proven templates:
1. **Table** (Zero-dependency native HTML table)
2. **Conditional Table** (Highlights cells based on thresholds)
3. **Bar / Pie / Radar Charts** (using Chart.js)
4. **ECharts** (Declarative canvas/SVG renderer for complex charts)


## Looker CLI Recommendation
It is highly recommended to fulfill Looker-side interactions (such as session management, project configurations, manifest definitions, and asset uploads) using the Looker CLI (`looker-cli`) to simplify deployment and testing outside of the Looker IDE.

## Reference Library & Examples
If you require deep knowledge on specific Looker quirks, refer to these original documentation files:
*   **API & Features:** [references/api_guide.md](references/api_guide.md)
*   **Data Patterns & Recipes:** [references/data_patterns.md](references/data_patterns.md) (Pivots, missing data, limits)
*   **Deployment:** [references/deployment_guide.md](references/deployment_guide.md) (Manifests, local harnesses)
*   **Styling:** [references/styling_guide.md](references/styling_guide.md) (ResizeObservers, padding conventions)
*   **Charting Libraries:** [references/charting_library_guide.md](references/charting_library_guide.md)

If you need a reference implementation of a completed visualization, you can review the working prototype here:
*   **Working Example:** [examples/spider-viz/](examples/spider-viz/)

## Quality Assurance & Pre-Deployment Checklist
Before deploying the output to Looker, the agent and developer must verify:
*   [ ] **Call `done()`**: Ensure `done()` is called at the end of the `updateAsync` lifecycle.
*   [ ] **0x0 Canvas Guard**: If using external libraries like ECharts, verify the width/height are not `0` before rendering to prevent Looker's hidden iframe rendering bugs.
*   [ ] **Resize Observation**: Ensure the chart redraws itself if the Looker dashboard tile is resized.
*   [ ] **Looker Cell Formatting**: Use `rendered` values (e.g., `row[col].rendered`) when available to respect LookML formatting instead of raw `.value`s.

## AI Agent Execution & Subagent Delegation Guidelines

To optimize execution speed and prevent token bloat, follow these execution strategies:

### 1. Non-Interactive Project Initialization
When initializing a new visualization project, the agent **MUST** execute `create_looker_viz.py` non-interactively using the CLI arguments `--name`, `--title`, and `--framework`. Do not halt to ask the user for inputs if they have already provided them.

### 2. Autonomous Surgical Refactoring & The Rule of Surgical Modification
To protect developer comments, preserve existing configurations, and optimize API token efficiency, the agent **MUST** adhere to the following surgical editing protocol:
* **Prohibition of Full Rewrites**: During any refactoring or debugging iteration on an *existing* visualization codebase, the agent **MUST NOT** rewrite, regenerate, or reconstruct the entire file from scratch.
* **Targeted Block Replacements**: The agent **MUST** perform surgical, localized block replacements (such as search-and-replace, line-targeted edits, or targeted tool calls) to modify *only* the specific broken or misaligned lines of code.

### 3. Subagent Delegation for Complex Debugging
If you encounter complex rendering bugs, webpack/vite build issues, or need to research Looker's visualization API documentation comprehensively, use the `invoke_subagent` tool to spawn a specialized `research` subagent to investigate the problem and return targeted solutions.
