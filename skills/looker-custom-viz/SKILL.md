---
name: looker-custom-viz
description: >-
  Creates, customizes, debugs, and deploys Looker Custom Visualizations (API v2) in React/TypeScript or Vanilla JavaScript (ECharts, Chart.js, D3, Recharts) with an offline Vite mock-data harness and `manifest.lkml` bundle config. Use when building bespoke dashboard tiles (such as Sunburst, radar, calendar heatmap, or Marimekko charts) beyond Looker's native visualization menu or troubleshooting existing custom visualization scripts. Don't use for configuring native Looker Explore/LookML chart types or building full-page Looker Extension Framework apps.
license: Apache-2.0
compatibility: Requires Node.js (npm) for Vite builds; Looker MCP or looker-cli optional for live Looker deployment.
metadata:
  publisher: google
  version: "0.1.0"
  domain: looker-apps-viz
  status: preview
  usage-interface: looker-mcp looker-cli
---

# Looker Custom Visualization Developer

## Workflow

1. **Pre-flight & Reality Mapping**:
   - Run `git status` (if inside a Git repository) before modifying files so uncommitted work is preserved.
   - **New visualizations (or when query fields are absent from `src/`)**: Stop before writing chart code and ask the user for a **Looker Explore URL, Query Slug, or JSON-Detail payload** plus desired **Edit** settings-pane options. Never invent field names.
   - Fetch real query shapes via `looker-cli query runquery {slug} --format json_detail` (resolves a Query Slug into full `json_detail`), or via Looker MCP (`get_dimensions`/`get_measures` + `query`, or `run_look`, wrapping flat `{ field: val }` rows as `{ field: { value: val } }` in local mocks; note `query_url` generates URLs rather than resolving slugs). Otherwise point to `looker-mcp-skill` / `installing-looker-cli` or ask for **Explore Actions > Download > Results in JSON-Detail** (not plain `JSON`).

2. **Surgical Edits vs. New Project Scaffold**:
   - **Editing an existing visualization**: Apply localized block edits in `src/*` (never hand-edit minified `dist/bundle.js` or rewrite whole files; edit raw `.js` directly only for unbundled plugins).
   - **Creating a new visualization**: Follow the target framework blueprint (`React/TS` or `Vanilla JS`) in `references/scaffolding_guide.md`.

3. **Enforce Looker Sandbox & API v2 Guardrails**:
   - **Strict typing (`React/TS`)**: Define data and option interfaces in `src/types.ts` (zero `any`); read cells via `getCell(row, field, pivotKey)` so flat and pivoted rows both type-check.
   - **Validation, `NaN` & XSS safety**: Call `this.clearErrors?.()` first in `updateAsync`, validate field counts (`this.addError?.(...)` + `done()`), check `typeof v === 'number' && Number.isFinite(v)`, prefer `cell.rendered`, and `escapeHtml(...)` untrusted strings in `innerHTML` and HTML tooltips.
   - **Dynamic options, CSP & drills**: Guard `typeof this.trigger === 'function'` and cache by field/label key before `registerOptions`. Never emit inline `onclick=...` attributes; pass the raw DOM `Event` (`event.nativeEvent` in React) to `LookerCharts.Utils.openDrillMenu`.
   - **Layout, fonts & `done()`**: Observe resizes with `ResizeObserver`, guard `0x0` initial frames, dispose/destroy detached chart instances, render React empty states as JSX inside `<App />` (keeping `#viz-root` mounted), inject `Google Sans` only on `http(s)` non-localhost origins, and call `done()` after rendering settles (racing `requestAnimationFrame` with a `100ms` `setTimeout` in React 18 so below-the-fold iframe PDF/PNG exports never time out or capture blank frames).

4. **Build & Verify**:
   - Prefer modular imports (`echarts/core` + `echarts/charts`, or `d3-scale`/`d3-array`) to keep bundles fast.
   - Run `npm install` (only if `node_modules` is missing or `package.json` changed) and `npm run build` (or `node -c {file}` for unbundled JS), fixing all compiler/bundler errors before finishing.

5. **Register & Deploy**:
   - Match `id` in `looker.plugins.visualizations.add({ id })` with `manifest.lkml`, preserve existing `manifest.lkml` blocks, and confirm with the user before deploying to `production` (required once for Looker to index a new `visualization` ID).

## Task-Gated Reference Routing

Read **only** the reference sections required by the current task:

| Task Need | Reference File & Line Ranges |
| :--- | :--- |
| `React/TS` blueprint (`1-294`), `Vanilla JS` blueprint (`1-32, 296-396`), `npm run dev`, or library matrix | [Scaffolding & library selection guide](references/scaffolding_guide.md) |
| Lifecycle (`1-14`), XSS & drills (`15-35`), `options` (`36-66`), or `ResizeObserver` / `Google Sans` / empty states (`67-117`) | [API lifecycle & native styling guide](references/api_and_styling.md) |
| Pivots, palettes, merged/table-calc fields & shape validation (`1-75`), hierarchy trees (`76-118`), or `SSF` / `registerOptions` / `Number.isFinite` (`119-193`) | [Data patterns & recipes](references/data_patterns.md) |
| Merging `manifest.lkml` (`1-18`), deploying via `looker-cli` or Looker MCP (`19-59`), or registry/`vis_config` gotchas (`61-65`) | [Looker deployment guide](references/deployment_guide.md) |
