# Project Scaffolding & Library Selection

Scaffold new visualizations in `{project_name}/` with an offline Vite mock-data harness (`npm run dev` at `http://localhost:5173`) and a single-file `iife` production build (`dist/bundle.js`).

## Library Selection Matrix & Shared `index.html`

Looker custom visualizations run in browser iframes (Python libraries like Matplotlib/Seaborn cannot execute). Looker loads `visualization: { file: "..." }` as a classic `<script>` and ignores separate `.css` files—never write bare `import './styles.css'` (use inline styles, a `<style>` tag, or Vite's `import css from './styles.css?inline'`).

| Library | Target | Best Fit | Mode | Looker Integration Note |
| :--- | :--- | :--- | :--- | :--- |
| **Apache ECharts** | Canvas / SVG / WebGL | Complex analytical tiles (Sunburst, Sankey, Heatmap, Treemap, large datasets), collision-free labels | `react` or `vanilla` | Import `echarts/core` + series option types from `echarts/charts` (`BarSeriesOption`, `CustomSeriesOption`). |
| **Chart.js** | Canvas | Compact (~60 KB gz) polar/radar/bar/line tiles with smooth animations | `react` (`react-chartjs-2`) or `vanilla` | Register scales/elements/controllers via `Chart.register(...)`; pass `chartEvent.native` to `openDrillMenu`; call `chart.destroy()` if detached. |
| **D3.js** | SVG / Canvas / DOM | Bespoke layouts (calendar heatmaps, dumbbell/slopegraphs, Marimekko, custom hierarchies) | `vanilla` or `react` | Import modular packages (`d3-scale`, `d3-array`, `d3-time`) to keep bundles `<40 KB`. |
| **Recharts** | SVG | Composable JSX charts in React-standardized teams (moderate row counts) | `react` only | Avoid animating thousands of SVG nodes simultaneously. |

Shared `index.html` (use `/src/main.tsx` in `react` mode or `/src/main.js` in `vanilla` mode):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Looker Custom Viz Harness</title>
  </head>
  <body style="margin: 0; padding: 0; overflow: hidden;">
    <div id="container" style="width: 100vw; height: 100vh;"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 1. React / TypeScript Mode (`react`)

### Directory Structure & `package.json`
Files: `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `src/types.ts`, `src/main.tsx`, `src/App.tsx`.
Add `"echarts": "^5.5.1"` for ECharts, or `"chart.js": "^4.4.4", "react-chartjs-2": "^5.2.0"` for Chart.js:
```json
{
  "name": "{project_name}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.8"
  }
}
```
*(Under `npm 12+`, `allowScripts` warnings on `esbuild` postinstall are benign because platform binaries install via `optionalDependencies`; run `npm install-scripts approve esbuild` only if `--omit=optional` was used.)*

### `vite.config.ts` & `tsconfig.json`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'LookerCustomViz',
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

### `src/types.ts` (Strict Flat + Pivoted Types, Helpers & Ambient Globals)
```typescript
export interface LookerLink {
  label: string;
  url: string;
  type?: string;
  [key: string]: unknown;
}
export interface LookerCell {
  value: string | number | boolean | null | undefined;
  rendered?: string | null;
  html?: string | null;
  links?: LookerLink[];
}
export type LookerPivotCellMap = Record<string, LookerCell | undefined>;
export type LookerRow = Record<string, LookerCell | LookerPivotCellMap | undefined>;
export type LookerChartData = LookerRow[];

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
export function escapeHtml(str: unknown): string {
  return String(str ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] || c);
}

export function getCell(row: LookerRow, field: string, pivotKey?: string): LookerCell | undefined {
  const entry = row[field];
  if (!entry || typeof entry !== 'object') return undefined;
  const isCell = 'value' in entry && (entry.value === null || typeof entry.value !== 'object');
  if (pivotKey !== undefined) return isCell ? undefined : (entry as LookerPivotCellMap)[pivotKey];
  return isCell ? (entry as LookerCell) : undefined;
}

export interface LookerField {
  name: string;
  label: string;
  label_short?: string | null;
  value_format?: string | null;
  [key: string]: unknown;
}
export interface LookerPivot {
  key: string;
  label?: string;
  is_total?: boolean;
  data?: Record<string, string | null>;
  metadata?: Record<string, { label?: string | null; rendered?: string | null } | null>;
  [key: string]: unknown;
}
export interface LookerQueryResponse {
  fields: {
    dimensions?: LookerField[];
    measures?: LookerField[];
    table_calculations?: LookerField[];
    dimension_like?: LookerField[];
    measure_like?: LookerField[];
  };
  pivots?: LookerPivot[];
}
export interface LookerChartConfig {
  show_labels?: boolean;
  custom_color_palette?: string[];
  [key: string]: unknown;
}
export type LookerVisualizationDetails = Record<string, unknown>;

export interface LookerVisualizationPlugin {
  id: string;
  label: string;
  options: Record<string, unknown>;
  create: (this: LookerVisualizationPlugin, element: HTMLElement, config: LookerChartConfig) => void;
  updateAsync: (
    this: LookerVisualizationPlugin,
    data: LookerChartData,
    element: HTMLElement,
    config: LookerChartConfig,
    queryResponse: LookerQueryResponse,
    details: LookerVisualizationDetails,
    done: () => void
  ) => void;
  addError?: (error: { group?: string; title: string; message: string }) => void;
  clearErrors?: (group?: string) => void;
  trigger?: (event: string, ...args: unknown[]) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    looker?: { plugins?: { visualizations?: { add: (plugin: LookerVisualizationPlugin) => void } } };
    LookerCharts?: {
      Utils: {
        htmlForCell: (cell: LookerCell | undefined) => string;
        textForCell: (cell: LookerCell | undefined) => string;
        openDrillMenu: (opts: { links: LookerLink[]; event: Event }) => void;
      };
    };
    SSF?: { format: (fmt: string, val: number) => string };
    refreshSettingsPanel?: (viz: unknown) => void;
  }
  const looker: Window['looker'];
  const LookerCharts: Window['LookerCharts'];
}
```

### `src/main.tsx` (Looker Registration + Full-Lifecycle Offline Harness)
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import {
  escapeHtml,
  LookerCell,
  LookerChartConfig,
  LookerChartData,
  LookerQueryResponse,
  LookerVisualizationDetails,
  LookerVisualizationPlugin,
} from './types';

const plugin: LookerVisualizationPlugin = {
  id: '{viz_id}',
  label: '{viz_title}',
  options: {
    show_labels: { type: 'boolean', label: 'Show Data Labels', default: true, section: 'Plot', order: 1 },
  },
  create(element: HTMLElement) {
    (this._root as ReactDOM.Root | undefined)?.unmount();
    const mount = document.createElement('div');
    mount.style.cssText = 'width:100%;height:100%;overflow:hidden;';
    element.replaceChildren(mount);
    this._mount = mount;
    this._root = ReactDOM.createRoot(mount);
  },
  updateAsync(
    data: LookerChartData,
    element: HTMLElement,
    config: LookerChartConfig,
    queryResponse: LookerQueryResponse,
    _details: LookerVisualizationDetails,
    done: () => void
  ) {
    this.clearErrors?.();
    const mount = this._mount as HTMLElement | undefined;
    if (!mount || !element.contains(mount)) this.create(element, config);
    (this._root as ReactDOM.Root).render(
      <React.StrictMode>
        <App data={data} config={config} queryResponse={queryResponse} />
      </React.StrictMode>
    );
    let settled = false;
    const finish = () => { if (!settled) { settled = true; done(); } };
    requestAnimationFrame(finish);
    setTimeout(finish, 100);
  },
};

if (typeof looker !== 'undefined' && looker?.plugins?.visualizations) {
  looker.plugins.visualizations.add(plugin);
} else {
  window.LookerCharts ??= {
    Utils: {
      htmlForCell: (c?: LookerCell) => c?.html || escapeHtml(c?.rendered || String(c?.value ?? '')),
      textForCell: (c?: LookerCell) => c?.rendered || String(c?.value ?? ''),
      openDrillMenu: ({ links, event }) => console.info('[Harness Drill]', links, event),
    },
  };
  const container = document.getElementById('container');
  if (container) {
    const mockData: LookerChartData = [
      { dim_1: { value: 'Category A', rendered: 'Category A' }, meas_1: { value: 120, rendered: '120' } },
      { dim_1: { value: 'Category B', rendered: 'Category B' }, meas_1: { value: 240, rendered: '240' } },
    ];
    const mockQuery: LookerQueryResponse = {
      fields: { dimensions: [{ name: 'dim_1', label: 'Category' }], measures: [{ name: 'meas_1', label: 'Total' }] },
    };
    const instance = Object.create(plugin) as LookerVisualizationPlugin;
    instance.addError = (err) => console.error('[Harness Viz Error]', err);
    instance.clearErrors = () => {};
    instance.create(container, {});
    instance.updateAsync(mockData, container, { show_labels: true }, mockQuery, {}, () => {});
  }
}
```

---

## 2. Vanilla JavaScript Mode (`vanilla`)

For ultra-compact zero-React bundles (`<40 KB` modular D3). When adapting TypeScript recipes from `data_patterns.md` or `api_and_styling.md` into `.js` files, strip TypeScript annotations (`: Type`, `as Type`, `<T>`).

### `package.json` & `vite.config.js`
```json
{
  "name": "{project_name}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
  "dependencies": { "d3-array": "^3.2.4", "d3-scale": "^4.0.2" },
  "devDependencies": { "vite": "^5.4.8" }
}
```

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: { entry: 'src/main.js', name: 'LookerCustomViz', formats: ['iife'], fileName: () => 'bundle.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
```

### `src/main.js` (Standalone Plugin, Helpers & Offline Harness)
```javascript
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] || c);

export function getCell(row, field, pivotKey) {
  const entry = row?.[field];
  if (!entry || typeof entry !== 'object') return undefined;
  const isCell = 'value' in entry && (entry.value === null || typeof entry.value !== 'object');
  return pivotKey !== undefined ? (isCell ? undefined : entry[pivotKey]) : (isCell ? entry : undefined);
}

function renderChart(wrap, state) {
  wrap.textContent = `Rows: ${state.data.length} (${state.width}x${state.height})`;
}

const vizPlugin = {
  id: '{viz_id}',
  label: '{viz_title}',
  options: {},
  create(element) {
    this._ro?.disconnect();
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;overflow:hidden;';
    element.replaceChildren(wrap);
    this._wrap = wrap;
    this._state = null;
    this._ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0 && this._state) {
        this._state.width = rect.width;
        this._state.height = rect.height;
        renderChart(this._wrap, this._state);
      }
    });
    this._ro.observe(wrap);
  },
  updateAsync(data, element, config, queryResponse, _details, done) {
    this.clearErrors?.();
    if (!this._wrap || !element.contains(this._wrap)) this.create(element, config);
    this._state = {
      data, config: config || {}, queryResponse,
      width: this._wrap.clientWidth || 640, height: this._wrap.clientHeight || 420,
    };
    renderChart(this._wrap, this._state);
    done();
  },
};

if (typeof looker !== 'undefined' && looker?.plugins?.visualizations) {
  looker.plugins.visualizations.add(vizPlugin);
} else {
  window.LookerCharts ??= {
    Utils: {
      htmlForCell: (c) => c?.html || escapeHtml(c?.rendered || String(c?.value ?? '')),
      textForCell: (c) => c?.rendered || String(c?.value ?? ''),
      openDrillMenu: ({ links, event }) => console.info('[Harness Drill]', links, event),
    },
  };
  const container = document.getElementById('container');
  if (container) {
    const mockData = [{ dim_1: { value: 'Category A', rendered: 'Category A' }, meas_1: { value: 120, rendered: '120' } }];
    const mockQuery = { fields: { dimensions: [{ name: 'dim_1', label: 'Category' }], measures: [{ name: 'meas_1', label: 'Total' }] } };
    const inst = Object.create(vizPlugin);
    inst.addError = (err) => console.error('[Harness Viz Error]', err);
    inst.clearErrors = () => {};
    inst.create(container, {});
    inst.updateAsync(mockData, container, {}, mockQuery, {}, () => {});
  }
}
```
*(If shipping an unbundled script that uses `manifest.lkml` `dependencies: ["https://cdn.jsdelivr.net/..."]`, check `window[globalName]` first and dynamically inject `<script src="...">` as an offline fallback, calling `this.addError?.(...)` and `done()` on `script.onerror`.)*
