# Marketplace Requirements & Testing

## Verification Checklist

Looker requires these functions in the visualizations available from the Looker Marketplace. Use this checklist to verify your visualization before deployment.

| Function | Required | Verification Method |
| :---- | :---- | :--- |
| **Drilling Support** | Yes | Click a data point; verify the drill menu appears at the correct location. |
| **Color Palettes** | Yes | Change the "Collection" or "Palette" in Looker config; verify colors update. |
| **Responsiveness** | Yes | Resize the browser window; verify the chart rescales gracefully. |
| **Font Consistency** | Yes | Verify `font-family` is `Helvetica`, `Arial`, or `sans-serif`. |
| **Font Sizing** | Yes | Verify font size options (Small, Large, etc.) actually change the text size. |
| **Labels Toggle** | Yes | Toggle "Value Labels" or "Axis Labels"; verify they appear/disappear. |
| **Pivots** | Yes | Apply a Pivot in the Explore; verify the viz handles multi-dimensional data. |
| **Interactivity** | Yes | Filter or change options; verify `updateAsync` handles the change without a full refresh. |
| **Error Handling** | Yes | configuration error (e.g., 0 dimensions) should show a clear `addError()` message, not a blank screen. |
| **Options Impact** | Yes | Every option in the panel must have a visible effect. |
| **Value Formatting** | Yes | Dimensions/Measures should use their LookML `value_format` (e.g., `$1,234.00`) by default. |
| **No Results** | Yes | Query returning 0 rows should throw a friendly error, not crash. |

## Manual Testing Procedure

Test the new visualization by applying it to an appropriate Explore or Look on your Looker instance:

1.  **Navigate** to the Look or Explore.
2.  **Edit**: If on a Look, click **Edit**.
3.  **Select Viz**: Click the three-dot menu in the visualization type menu to open the drop-down list and select your custom visualization.
4.  **Verify**:
    *   Does it render?
    *   Do the options work?
    *   Does resizing work?
5.  **Save**: Click **Save**. Note any dashboards that may be impacted.
