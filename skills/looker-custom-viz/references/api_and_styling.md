# Looker Custom Viz API, Security & Native Styling

## 1. Lifecycle & Canvas Guards

- **`create(element, config)`**: Runs once on initialization. Unmount/disconnect any prior root or `ResizeObserver`, create a fluid wrapper (`width: 100%; height: 100%`), inject fonts, and observe resizes. Do not render data here.
- **`updateAsync(data, element, config, queryResponse, details, done)`**: Runs on data changes, tile resizes, and option edits.
  1. Call `this.clearErrors?.()` at the start.
  2. Always invoke `done()` on every exit path (including empty-data and `addError` branches). In React 18, race `requestAnimationFrame` with `setTimeout(..., 100)` because Chromium suspends `requestAnimationFrame` on below-the-fold cross-origin/opaque iframes during scheduled PDF/PNG exports.
  3. **Detached DOM & `0x0` Canvas Guards**:
     - **ECharts**: If `this.chart && this.chart.getDom() !== container`, call `this.chart.dispose()` before re-initializing, and pass fallback dimensions (`{ width: container.clientWidth || 600, height: container.clientHeight || 420 }`) to `echarts.init()` so initial `0x0` iframe layouts never lock a blank canvas.
     - **Chart.js**: If `this.chart && this.chart.canvas !== canvas`, call `this.chart.destroy()` (`dispose()` does not exist on Chart.js; omitting `destroy()` throws `Canvas is already in use`).

---

## 2. Safe Formatting, XSS Escaping & Native Drills

- **Plain text**: Prefer `cell?.rendered || String(cell?.value ?? '')` (or `window.LookerCharts?.Utils?.textForCell(cell)`), using `||` rather than `??` on `rendered` so `rendered: ""` does not mask a non-empty `value`.
- **HTML cells**: Guard `window.LookerCharts?.Utils?.htmlForCell ? window.LookerCharts.Utils.htmlForCell(cell) : escapeHtml(cell?.rendered || String(cell?.value ?? ''))` (using `escapeHtml` from `src/types.ts` or `src/main.js`).
- **Prevent XSS / DOM corruption**: Always `escapeHtml(...)` raw `cell.value`, `cell.rendered`, `field.label`, and pivot labels before interpolating into Vanilla JS `innerHTML`, SVG markup, or ECharts HTML `tooltip.formatter` (which defaults to `renderMode: 'html'`).
- **Click-to-Drill & Strict CSP**: Looker's iframe CSP blocks inline attributes (`onclick="..."`). Use JSX handlers (`onClick`) in React or `addEventListener` with `data-*` attributes in Vanilla JS, and pass the **raw DOM `Event`** to `LookerCharts.Utils.openDrillMenu` (`event.nativeEvent` in React, `params.event?.event` in ECharts, `chartEvent.native` in Chart.js):

```typescript
function handleCellClick(nativeEvent: Event | null | undefined, cell: LookerCell | undefined): void {
  if (nativeEvent && cell?.links && cell.links.length > 0 && window.LookerCharts?.Utils?.openDrillMenu) {
    nativeEvent.preventDefault();
    window.LookerCharts.Utils.openDrillMenu({
      links: cell.links,
      event: nativeEvent,
    });
  }
}
```

---

## 3. Settings Pane (`options`) & Visual Integrity

Declare `options` on the visualization object (never mutate nested option descriptors in-place across multi-tile instances, and ensure **every declared option key visibly affects rendered output**):

| Property | Supported Values |
| :--- | :--- |
| `type` | `'string'`, `'number'`, `'boolean'`, or `'array'` |
| `section` & `order` | Tab name in Looker's Edit panel (`'Plot'`, `'Series'`, `'Formatting'`) and integer sort order |
| `display` | `'select'` or `'radio'` (with `values: [{ 'Label': 'val' }]`), `'text'`, `'color'`, or `'colors'` |
| `default` | Initial value when `config[key]` is unset |

```javascript
options: {
  legend_position: {
    type: 'string', label: 'Legend Position', display: 'select', default: 'bottom',
    values: [{ Left: 'left' }, { Right: 'right' }, { Bottom: 'bottom' }, { Hidden: 'none' }],
    section: 'Plot', order: 1,
  },
  custom_color_palette: {
    type: 'array', label: 'Color Palette', display: 'colors',
    default: ['#1A73E8', '#0F9D58', '#F29900', '#9334E6'], section: 'Series', order: 1,
  },
}
```

**Visual Integrity Conventions**:
- **Axes & labels**: Start bar/column value axes at `0` (line/scatter/radar axes may use labeled non-zero minimums). Never render `90°` vertical axis labels—rotate overlapping labels `30°-45°` or switch to horizontal bars. Color-code dual axes with a toggle in `options`.
- **Palettes & gridlines**: Match palette structure to data (distinct hues for categorical, single-hue light-to-dark for sequential, two-hue neutral-midpoint for diverging), avoid pure red/green pairs, and keep gridlines subtle (`rgba(15, 23, 42, 0.08)`).

---

## 4. Responsive Sizing, `Google Sans` & Native Empty States

### `ResizeObserver` & Tile Margins
Dashboard tiles settle asynchronously after initial mount. Attach a `ResizeObserver` to the fluid container (`width: 100%; height: 100%`) and redraw when `contentRect.width > 0 && contentRect.height > 0`. Match Looker's native tile spacing: `2px` outer padding, `~55px` left margin, `~40px` bottom margin, and `15px` (`35px` with legend) top margin.

### Dynamic `Google Sans` Resolution (Guarded Against Localhost & Opaque Origins)
Sandboxed iframes may report `window.location.origin === "null"`. Resolve the parent Looker `http(s)` origin from `document.referrer`, skip local dev hosts to prevent 404 console noise, and include `local('Google Sans')` + `'Roboto', -apple-system, sans-serif` fallbacks:

```javascript
function injectLookerFonts() {
  if (document.getElementById('looker-native-fonts')) return;
  let origin = '';
  try {
    origin = document.referrer ? new URL(document.referrer).origin : window.location.origin;
  } catch { return; }
  if (!/^https?:\/\//.test(origin)) return;
  const host = new URL(origin).hostname;
  if (['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0'].includes(host)) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'looker-native-fonts';
  styleEl.textContent = `
    @font-face {
      font-family: 'Google Sans'; font-weight: 400; font-style: normal;
      src: local('Google Sans'), url('${origin}/fonts/vendor/google-sans/GoogleSans-Regular-cb71e97c92.woff') format('woff');
    }
    @font-face {
      font-family: 'Google Sans'; font-weight: 500; font-style: normal;
      src: local('Google Sans Medium'), url('${origin}/fonts/vendor/google-sans/GoogleSans-Medium-36c5aa25bb.woff') format('woff');
    }
  `;
  document.head.appendChild(styleEl);
}
```

### Native Looker `"No results"` Empty State
When `!data || data.length === 0`:
- **React (`<App />`)**: Render the empty state **as JSX inside `<App />`** (never overwrite `element.innerHTML` outside React, which detaches `#viz-root`; include `isEmpty` in chart `useEffect` dependency arrays so ECharts/Chart.js re-attaches when rows return).
- **Vanilla JS**: Write `EMPTY_STATE_HTML` into `this._wrap` (not `element`, keeping `ResizeObserver` attached), then call `done()`:

```javascript
const EMPTY_STATE_HTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;font-family:'Google Sans','Roboto',sans-serif;gap:6px;">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="rgb(140,140,140)" style="width:24px;height:24px;">
      <path fill="none" d="M0 0h24v24H0V0z"></path>
      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
    </svg>
    <span style="font-size:1rem;font-weight:500;line-height:1.5rem;color:rgb(38,45,51);">No results</span>
  </div>
`;
```
