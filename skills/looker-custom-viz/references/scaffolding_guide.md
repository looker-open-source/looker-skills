# Project Scaffolding & Library Selection

Scaffold new visualizations in `{project_name}/` with an offline Vite mock-data harness (`npm run dev` at `http://localhost:5173`) and a single-file `iife` production build (`dist/bundle.js`).

## Library Selection Matrix

Looker custom visualizations run in browser iframes (Python libraries like Matplotlib/Seaborn cannot execute):

| Library | Target | Best Fit | Mode | Looker Integration Note |
| :--- | :--- | :--- | :--- | :--- |
| **Apache ECharts** | Canvas / SVG / WebGL | Complex analytical tiles (Sunburst, Sankey, Heatmap, Treemap, large datasets), collision-free labels | `react` or `vanilla` | Import `echarts/core` + series option types from `echarts/charts` (`BarSeriesOption`, `CustomSeriesOption`). |
| **Chart.js** | Canvas | Compact (~60 KB gz) polar/radar/bar/line tiles with smooth animations | `react` (`react-chartjs-2`) or `vanilla` | Pass `chartEvent.native` to `openDrillMenu`; call `chart.destroy()` if canvas detaches. |
| **D3.js** | SVG / Canvas / DOM | Bespoke layouts (calendar heatmaps, dumbbell/slopegraphs, Marimekko, custom hierarchies) | `vanilla` or `react` | Import modular packages (`d3-scale`, `d3-array`, `d3-time`) to keep bundles `<40 KB`. |
| **Recharts** | SVG | Composable JSX charts in React-standardized teams (moderate row counts) | `react` only | Avoid animating thousands of SVG nodes simultaneously. |

---

## 1. React / TypeScript Mode (`react`)

### Directory Structure
```text
{project_name}/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    └── types.ts
```

### `package.json`
Add `"echarts": "^5.5.1"` for ECharts, or `"chart.js": "^4.4.4", "react-chartjs-2": "^5.2.0"` for Chart.js.
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
*(Note: Under `npm 12+`, `allowScripts` warnings on `esbuild` postinstall are benign because platform binaries install via `optionalDependencies`; run `npm install-scripts approve esbuild` only if `--omit=optional` was used.)*

### `vite.config.ts` (Single-File IIFE Bundle)
Looker loads `visualization: { file: "..." }` as a classic `<script>` and ignores separate `.css` files. Never write bare `import './styles.css'`—use inline JSX styles, a `<style>` tag, or Vite's `import css from './styles.css?inline'`:
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

### `tsconfig.json`
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

### `index.html`
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

### `src/types.ts` (Strict Flat + Pivoted Types & Ambient Globals)
```typescript
export interface LookerLink {
  label: string;
  url: string;
  type?: string;
  [key: string]: unknown;
}
export interface LookerCell {
  value: string | number | boolean | null | undefined;
  rendered?: string;
  html?: string;
  links?: LookerLink[];
}
export type LookerPivotCellMap = Record<string, LookerCell | undefined>;
export type LookerRow = Record<string, LookerCell | LookerPivotCellMap | undefined>;
export type LookerChartData = LookerRow[];

export function getCell(row: LookerRow, field: string, pivotKey?: string): LookerCell | undefined {
  const entry = row[field];
  if (!entry) return undefined;
  const isCell = 'value' in entry;
  if (pivotKey !== undefined) return isCell ? undefined : (entry as LookerPivotCellMap)[pivotKey];
  return isCell ? (entry as LookerCell) : undefined;
}

export interface LookerField {
  name: string;
  label: string;
  label_short?: string;
  value_format?: string | null;
  [key: string]: unknown;
}
export interface LookerPivot {
  key: string;
  is_total?: boolean;
  data?: Record<string, string>;
  metadata?: Record<string, { label?: string; rendered?: string }>;
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
  LookerCell,
  LookerChartConfig,
  LookerChartData,
  LookerQueryResponse,
  LookerVisualizationDetails,
  LookerVisualizationPlugin,
} from './types';

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const escapeHtml = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] || c);

const plugin: LookerVisualizationPlugin = {
  id: '{viz_id}',
  label: '{viz_title}',
  options: {
    show_labels: { type: 'boolean', label: 'Show Data Labels', default: true, section: 'Plot', order: 1 },
  },
  create(element: HTMLElement) {
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
    let mount = this._mount as HTMLElement | undefined;
    if (!mount || !element.contains(mount)) {
      mount = document.createElement('div');
      mount.style.cssText = 'width:100%;height:100%;overflow:hidden;';
      element.replaceChildren(mount);
      this._mount = mount;
      this._root = ReactDOM.createRoot(mount);
    }
    (this._root as ReactDOM.Root).render(
      <React.StrictMode>
        <App data={data} config={config} queryResponse={queryResponse} />
      </React.StrictMode>
    );
    requestAnimationFrame(() => done());
  },
};

if (typeof looker !== 'undefined' && looker?.plugins?.visualizations) {
  looker.plugins.visualizations.add(plugin);
} else {
  window.LookerCharts ??= {
    Utils: {
      htmlForCell: (c?: LookerCell) => c?.html ?? escapeHtml(c?.rendered ?? c?.value ?? ''),
      textForCell: (c?: LookerCell) => String(c?.rendered ?? c?.value ?? ''),
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

For ultra-compact zero-React bundles (e.g., `<40 KB` modular D3 charts):
1. **`package.json`**: Remove `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, and `typescript`; set `"build": "vite build"` and add modular libs (e.g., `"d3-scale": "^4.0.2"`, `"d3-array": "^3.2.4"`).
2. **`vite.config.js`**: Keep `define: { 'process.env.NODE_ENV': JSON.stringify('production') }`, `build.lib: { entry: 'src/main.js', name: 'LookerCustomViz', formats: ['iife'], fileName: () => 'bundle.js' }`, and `rollupOptions.output.inlineDynamicImports: true`. Point `index.html` to `/src/main.js`.
3. **`src/main.js` skeleton** (caches `_state` so `ResizeObserver` never runs before `updateAsync`, and exercises `create` + `updateAsync` in the offline harness):
```javascript
const vizPlugin = {
  id: '{viz_id}',
  label: '{viz_title}',
  options: {},
  create(element) {
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
  const container = document.getElementById('container');
  if (container) {
    const inst = Object.create(vizPlugin);
    inst.create(container, {});
    inst.updateAsync(/* mockData */ [], container, {}, { fields: { dimensions: [], measures: [] } }, {}, () => {});
  }
}
```
*(If shipping an unbundled script that uses `manifest.lkml` `dependencies: ["https://cdn.jsdelivr.net/..."]`, check `window[globalName]` first and dynamically inject `<script src="...">` only as an offline harness fallback.)*
