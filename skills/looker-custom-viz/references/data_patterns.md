# Data Patterns & Recipes

*(In Vanilla `.js` files, strip TypeScript `: Type` / `as Type` annotations and import `getCell` from `src/main.js`.)*

## 1. Handling Pivots (Filtering Row Totals, Null Metadata & Cross-Pivot Calcs)

Filter `!p.is_total` so Looker's `"$$$_row_total_$$$"` column does not double-count stacked series. Guard `null` metadata entries (`m?.rendered`), preserve `"0"` pivot values, and fall back to `getCell(row, metric.name)` for flat cross-pivot table calculations (`pivot_index`, `pivot_row`):

```typescript
const activePivots = (queryResponse.pivots || []).filter((p) => !p.is_total);

function formatPivotLabel(pivot: LookerPivot): string {
  if (pivot.metadata) {
    const parts = Object.values(pivot.metadata).map((m) => m?.rendered || m?.label).filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
  }
  if (pivot.data) {
    const parts = Object.values(pivot.data).map((v) => (v != null && v !== '' ? String(v) : '')).filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
  }
  return pivot.label || pivot.key.replace(/\|FIELD\|/g, ' · ');
}

if (activePivots.length > 0) {
  activePivots.forEach((pivot) => {
    measures.forEach((measure) => {
      const cell = getCell(row, measure.name, pivot.key) ?? getCell(row, measure.name);
    });
  });
}
```

## 2. Color Palettes (Strict String Narrowing)

Expose a `display: 'colors'` option in `options` and filter `custom_color_palette` with a type guard so `Array.isArray` on `unknown` never infers `any[]` (do **not** call `looker.charts.Utils.getScale`, which does not exist in API v2):

```typescript
const DEFAULT_PALETTE = ['#1A73E8', '#0F9D58', '#F29900', '#9334E6', '#00ACC1', '#D93025'];
const palette: string[] =
  Array.isArray(config.custom_color_palette) && config.custom_color_palette.length > 0
    ? config.custom_color_palette.filter((c): c is string => typeof c === 'string')
    : DEFAULT_PALETTE;
```

## 3. Merged Results & Table Calculations (`dimension_like` / `measure_like` / `table_calculations`)

Check `dimension_like` before `dimensions` and deduplicate `measure_like`, `measures`, and `table_calculations` by `name` (putting `measures` first drops Table Calculations whenever `>= 1` regular measure exists):

```typescript
const f = queryResponse.fields;
const dimensions = f.dimension_like && f.dimension_like.length > 0 ? f.dimension_like : f.dimensions || [];
const dimNames = new Set(dimensions.map((d) => d.name));
const seenMetrics = new Set<string>();
const measures = [...(f.measure_like || []), ...(f.measures || []), ...(f.table_calculations || [])].filter(
  (m) => !dimNames.has(m.name) && !seenMetrics.has(m.name) && (seenMetrics.add(m.name), true)
);
```

## 4. Query Shape Validation (`this.addError` Inside `plugin.updateAsync`)

Validate field counts using the resolved `dimensions` and `measures` arrays inside `plugin.updateAsync`, and always call `done()` before returning:

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

Convert flat rows into a nested tree matching `dimensions` order, preserving `node.cell` and measure `links` on single-row leaves while resetting `node.links` to parent `dimLinks` when multiple rows aggregate into one leaf:

```typescript
interface HierarchyNode {
  name: string;
  value?: number;
  cell?: LookerCell;
  links: LookerLink[];
  children?: HierarchyNode[];
}

function convertToHierarchy(data: LookerChartData, dimensions: LookerField[], measureName: string, pivotKey?: string): HierarchyNode[] {
  const root: HierarchyNode[] = [];
  data.forEach((row) => {
    let level = root;
    dimensions.forEach((dim, idx) => {
      const dimCell = getCell(row, dim.name);
      const name = dimCell?.value != null ? (dimCell.rendered || String(dimCell.value)) || '(Empty)' : '∅';
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
        node.links = isAggregated ? dimLinks : measCell?.links && measCell.links.length > 0 ? measCell.links : dimLinks;
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

Looker API v2 does not bundle `SSF` automatically (`npm install ssf` if needed, or check `window.SSF`). Hoist `fmt` and `ssf` before the closure for strict narrowing, normalize `-0`, and index both flat and pivoted `rendered` cells for `O(1)` fallback:

```typescript
function getFormatterForMeasure(data: LookerChartData, measure: LookerField | undefined, pivotKey?: string) {
  const fmt = measure?.value_format;
  const ssf = window.SSF;
  const renderedByVal = new Map<number, string>();
  if (measure) {
    data.forEach((r) => {
      const entry = r[measure.name];
      const cells =
        pivotKey !== undefined
          ? [getCell(r, measure.name, pivotKey)]
          : entry && typeof entry === 'object' && !('value' in entry)
            ? Object.values(entry as LookerPivotCellMap)
            : [getCell(r, measure.name)];
      cells.forEach((c) => {
        if (typeof c?.value === 'number' && Number.isFinite(c.value) && c.rendered && !renderedByVal.has(c.value)) {
          renderedByVal.set(c.value === 0 ? 0 : c.value, c.rendered);
        }
      });
    });
  }
  return (val: number | null | undefined): string => {
    if (typeof val !== 'number' || !Number.isFinite(val)) return '';
    const n = val === 0 ? 0 : val;
    if (fmt && ssf) {
      try { return String(ssf.format(fmt, n)); } catch { /* fallback below */ }
    }
    return renderedByVal.get(n) ?? n.toLocaleString();
  };
}
```

## 7. Safe Dynamic Option Registration (`registerOptions` Inside `plugin.updateAsync`)

Snapshot initial static `this.options` once (`_baseOptions`), prefer full `m.label` over `m.label_short` (avoiding duplicate `"Count"` labels across joined views), and guard `typeof this.trigger === 'function'`:

```typescript
const baseOpts = (this._baseOptions as Record<string, unknown> | undefined) ?? (this._baseOptions = { ...this.options });
const nextKey = measures.map((m) => `${m.name}:${m.label || m.label_short || ''}`).join('|');
if (this._registeredKey !== nextKey) {
  this._registeredKey = nextKey;
  const dynamicOptions: Record<string, unknown> = {
    ...baseOpts,
    size_by_measure: {
      type: 'string',
      label: 'Size By Measure',
      display: 'select',
      values: measures.map((m) => ({ [m.label || m.label_short || m.name]: m.name })),
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

Because `typeof NaN === 'number'` and `typeof Infinity === 'number'` are `true` in JavaScript, always pair `typeof` with `Number.isFinite` over declared `measures` (never infer measures via `Object.keys(row)`):

```typescript
function getNumericValue(row: LookerRow, field: string, pivotKey?: string): number | null {
  const raw = getCell(row, field, pivotKey)?.value;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}
```
