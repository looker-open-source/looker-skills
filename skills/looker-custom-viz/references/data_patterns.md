# Data Patterns & Recipes

## 1. Handling Pivots (Filtering Row Totals & Reading Labels)

When `queryResponse.pivots` is present, filter out `!p.is_total` so Looker's `"$$$_row_total_$$$"` column does not double-count stacked series. Read human-readable series labels from `pivot.metadata` or `pivot.data` rather than raw `"2026-Q4|FIELD|Direct Web"` keys, and use `getCell(row, measure.name, pivot.key)`:

```typescript
const activePivots = (queryResponse.pivots || []).filter((p) => !p.is_total);
const measures = queryResponse.fields.measures || [];

function formatPivotLabel(pivot: { key: string; metadata?: Record<string, { rendered?: string; label?: string }>; data?: Record<string, string> }): string {
  if (pivot.metadata) {
    const parts = Object.values(pivot.metadata).map((m) => m.rendered || m.label).filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
  }
  if (pivot.data) {
    const parts = Object.values(pivot.data).filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
  }
  return pivot.key.replace(/\|FIELD\|/g, ' · ');
}

if (activePivots.length > 0) {
  activePivots.forEach((pivot) => {
    measures.forEach((measure) => {
      const cell = getCell(row, measure.name, pivot.key);
    });
  });
}
```

## 2. Color Palettes

Expose a `display: 'colors'` option in `options` and fall back to an accessible hex array (do **not** call `looker.charts.Utils.getScale`, which does not exist on `window.looker` in API v2):

```typescript
const DEFAULT_PALETTE = ['#1A73E8', '#0F9D58', '#F29900', '#9334E6', '#00ACC1', '#D93025'];
const palette =
  Array.isArray(config.custom_color_palette) && config.custom_color_palette.length > 0
    ? config.custom_color_palette
    : DEFAULT_PALETTE;
```

## 3. Merged Results & Table Calculations (`dimension_like` / `measure_like`)

Merged Results and Table Calculations often leave `fields.dimensions` or `fields.measures` empty while populating `dimension_like` and `measure_like`:

```typescript
const dimensions =
  queryResponse.fields.dimensions && queryResponse.fields.dimensions.length > 0
    ? queryResponse.fields.dimensions
    : queryResponse.fields.dimension_like || [];
const measures =
  queryResponse.fields.measures && queryResponse.fields.measures.length > 0
    ? queryResponse.fields.measures
    : queryResponse.fields.measure_like || [];
```

## 4. Query Shape Validation (`this.addError`)

Validate field counts using the `dimension_like` / `measure_like` fallbacks above and always call `done()` before returning:

```typescript
this.clearErrors?.();
if (dimensions.length < 1 || measures.length < 1) {
  this.addError?.({
    group: 'query_shape',
    title: 'Incompatible Query Shape',
    message: 'Select at least 1 dimension and 1 numeric measure.',
  });
  done();
  return;
}
```

## 5. Hierarchical Trees (Sunburst, Treemap, Org/Dependency Graphs)

Convert flat rows into a nested tree matching `dimensions` order, supporting optional `pivotKey`, preserving `node.cell` and measure drill `links` on single-row leaves, and keeping parent dimension drills when multiple rows aggregate into one leaf:

```typescript
function convertToHierarchy(data: LookerChartData, dimensions: LookerField[], measureName: string, pivotKey?: string) {
  interface TreeNode { name: string; value?: number; cell?: LookerCell; links: LookerLink[]; children?: TreeNode[] }
  const root: TreeNode[] = [];
  data.forEach((row) => {
    let level = root;
    dimensions.forEach((dim, idx) => {
      const dimCell = getCell(row, dim.name);
      const name = dimCell?.value != null ? String(dimCell.rendered ?? dimCell.value) || '(Empty)' : '∅';
      const dimLinks = dimCell?.links || [];
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = { name, links: dimLinks };
        level.push(node);
      }
      if (idx === dimensions.length - 1) {
        const measCell = getCell(row, measureName, pivotKey);
        const val = typeof measCell?.value === 'number' && Number.isFinite(measCell.value) ? measCell.value : 0;
        const isAggregated = node.value !== undefined;
        node.value = (node.value || 0) + val;
        node.cell = isAggregated ? undefined : measCell;
        if (!isAggregated && measCell?.links && measCell.links.length > 0) {
          node.links = measCell.links;
        }
      } else {
        node.children = node.children || [];
        level = node.children;
      }
    });
  });
  return root;
}
```

## 6. Formatting Custom Aggregated Rollups (`SSF`)

Looker API v2 does not bundle `SSF` into custom iframes automatically (run `npm install ssf` if needed, or check `window.SSF`). Hoist `fmt` and `ssf` before the closure for strict TypeScript narrowing, guard non-finite inputs, and pre-index `rendered` strings in a `Map` for `O(1)` lookup:

```typescript
function getFormatterForMeasure(data: LookerChartData, measure: LookerField | undefined, pivotKey?: string) {
  const fmt = measure?.value_format;
  const ssf = window.SSF;
  const renderedByVal = new Map<number, string>();
  if (measure) {
    data.forEach((r) => {
      const c = getCell(r, measure.name, pivotKey);
      if (typeof c?.value === 'number' && c.rendered && !renderedByVal.has(c.value)) {
        renderedByVal.set(c.value, c.rendered);
      }
    });
  }
  return (val: number | null | undefined): string => {
    if (typeof val !== 'number' || !Number.isFinite(val)) return '';
    if (fmt && ssf) {
      try { return ssf.format(fmt, val); } catch { /* fallback below */ }
    }
    return renderedByVal.get(val) ?? val.toLocaleString();
  };
}
```

## 7. Safe Dynamic Option Registration (`registerOptions`)

Snapshot initial static `this.options` once (`_baseOptions`), include field labels in the cache key, and guard `typeof this.trigger === 'function'`:

```typescript
const baseOpts = (this._baseOptions as Record<string, unknown> | undefined) ?? (this._baseOptions = { ...this.options });
const nextKey = measures.map((m) => `${m.name}:${m.label_short || m.label || ''}`).join('|');
if (this._registeredKey !== nextKey) {
  this._registeredKey = nextKey;
  const dynamicOptions: Record<string, unknown> = {
    ...baseOpts,
    size_by_measure: {
      type: 'string',
      label: 'Size By Measure',
      display: 'select',
      values: measures.map((m) => ({ [m.label_short || m.label || m.name]: m.name })),
      default: measures[0]?.name || '',
      section: 'Series',
    },
  };
  if (typeof this.trigger === 'function') {
    this.trigger('registerOptions', dynamicOptions);
  } else {
    this.options = dynamicOptions;
    window.refreshSettingsPanel?.(this);
  }
}
```

## 8. Finite Numeric Validation (`NaN` & `Infinity` Prevention)

Because `typeof NaN === 'number'` and `typeof Infinity === 'number'` are `true` in JavaScript, always combine `typeof` with `Number.isFinite` over declared `measures` / `measure_like` (never infer measures via `Object.keys(row)`, which misclassifies numeric ID/year dimensions):

```typescript
function getNumericValue(row: LookerRow, field: string, pivotKey?: string): number | null {
  const raw = getCell(row, field, pivotKey)?.value;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}
```
