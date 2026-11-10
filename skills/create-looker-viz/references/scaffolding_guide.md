# Project Scaffolding & Templates Guide

Use these blueprints to scaffold a Looker Custom Visualization project directly in `<project-name>/` with a Vite build pipeline and offline mock-data harness.

---

## 1. React / TypeScript Mode (`react`)

### Directory Structure
```text
<project-name>/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── VizComponent.tsx
    ├── looker.d.ts
    ├── main.tsx
    └── utils/
        └── types.ts
```

### `package.json`
Add `"chart.js": "^4.4.1", "react-chartjs-2": "^5.2.0"` for Bar/Pie/Radar charts, or `"echarts": "^5.4.3", "echarts-for-react": "^3.0.2"` for ECharts.
```json
{
  "name": "<project-name>",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.2.2",
    "vite": "^5.3.1"
  }
}
```

### `vite.config.ts`
Configure Vite's `lib` mode as an inline `iife` bundle (and define `process.env.NODE_ENV` for React) to guarantee a single self-contained `dist/bundle.js` that executes cleanly inside Looker's sandboxed `<script>` loader. Inject styles via inline styles or a `<style>` tag rather than importing external `.css` files.
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
})
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
    <title>Looker Custom Viz</title>
  </head>
  <body>
    <div id="container" style="width: 100vw; height: 100vh;"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `src/looker.d.ts` & `src/utils/types.ts`
**`src/looker.d.ts`**:
```typescript
import { LookerChartData, LookerChartConfig, LookerQueryResponse, LookerVisualizationDetails } from './utils/types';

export interface LookerVisualizationPlugin {
  id: string;
  label: string;
  options: Record<string, unknown>;
  create: (element: HTMLElement, config: LookerChartConfig) => void;
  updateAsync: (
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
    LookerCharts?: { Utils: { htmlForCell: (cell: unknown) => string; openDrillMenu: (opts: { links: unknown[]; event: Event }) => void } };
    refreshSettingsPanel?: (viz: unknown) => void;
  }
  const looker: Window['looker'];
}
```

**`src/utils/types.ts`**:
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
  [key: string]: unknown;
}
export type LookerRow = Record<string, LookerCell>;
export type LookerChartData = LookerRow[];
export interface LookerField {
  name: string;
  label: string;
  label_short?: string;
  value_format?: string | null;
  [key: string]: unknown;
}
export interface LookerQueryResponse {
  fields: { dimensions?: LookerField[]; measures?: LookerField[]; measure_like?: LookerField[] };
  pivots?: Array<{ key: string; is_total?: boolean }>;
}
export interface LookerChartConfig {
  backgroundColor?: string;
  textColor?: string;
  showLabels?: boolean;
  showLegend?: boolean;
  [key: string]: unknown;
}
export type LookerVisualizationDetails = Record<string, unknown>;
```

### `src/main.tsx` (Looker Plugin + Offline Mock Harness)
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { LookerChartData, LookerChartConfig, LookerQueryResponse, LookerVisualizationDetails } from './utils/types'

if (typeof looker !== 'undefined' && looker?.plugins?.visualizations) {
  looker.plugins.visualizations.add({
    id: '<viz_id>',
    label: '<Viz Title>',
    options: {},
    create: function(element: HTMLElement) {
      element.innerHTML = `<div id="viz-root" style="width:100%;height:100%;"></div>`;
      this.root = ReactDOM.createRoot(element.querySelector('#viz-root') as HTMLElement);
    },
    updateAsync: function(
      data: LookerChartData,
      _element: HTMLElement,
      config: LookerChartConfig,
      queryResponse: LookerQueryResponse,
      _details: LookerVisualizationDetails,
      done: () => void
    ) {
      if (this.clearErrors) this.clearErrors();
      (this.root as ReactDOM.Root).render(
        <React.StrictMode>
          <App data={data} config={config} queryResponse={queryResponse} />
        </React.StrictMode>
      );
      done();
    }
  });
} else {
  const container = document.getElementById('container');
  if (container) {
    const mockData: LookerChartData = [
      { 'dim_1': { value: 'Category A', rendered: 'Category A' }, 'meas_1': { value: 120, rendered: '120' } },
      { 'dim_1': { value: 'Category B', rendered: 'Category B' }, 'meas_1': { value: 240, rendered: '240' } }
    ];
    const mockQuery: LookerQueryResponse = {
      fields: { dimensions: [{ name: 'dim_1', label: 'Category' }], measures: [{ name: 'meas_1', label: 'Total' }] }
    };
    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <App data={mockData} config={{ backgroundColor: '#ffffff', textColor: '#262d33' }} queryResponse={mockQuery} />
      </React.StrictMode>
    );
  }
}
```

---

## 2. Vanilla JavaScript Mode (`vanilla`)

For lightweight zero-React bundles:
1. Omit `react`, `react-dom`, `@vitejs/plugin-react`, and `typescript` from `package.json` (`"build": "vite build"`).
2. Point `index.html` to `<script type="module" src="/src/main.js"></script>`.
3. Register `looker.plugins.visualizations.add({ id, label, options, create, updateAsync })` in `src/main.js` with an `else` branch rendering mock data into `#container` when `typeof looker === 'undefined'`.
