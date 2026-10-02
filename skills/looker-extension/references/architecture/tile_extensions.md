# Looker Tile Extensions

Tile Extensions are applications built on the Looker Extension Framework meant to be embedded inside a Looker Dashboard, taking the place of a standard tile.

## 1. Manifest Declaration

To run as a tile, the `application` block in `manifest.lkml` **must** declare `tile_attributes`.

```lookml
application: my_tile_extension {
  label: "Custom Tile"
  url: "https://localhost:8080/bundle.js"
  
  tile_attributes: {
    dashboard_filters: yes      # Allow reading/reacting to dashboard filters
    dashboard_layout: yes       # Allow resizing or layout adjustments
  }
  
  entitlements: {
    core_api_methods: ["all_users"]
  }
}
```

---

## 2. Consuming Tile Context

Tile extensions are injected with a specific `tileContext` available via the SDK.

### Using React Hook `useExtensionContext`

The context contains dashboard state, filters, and layout information.

```tsx
import React, { useEffect } from 'react';
import { useExtensionContext } from '@looker/extension-sdk-react';

export const TileApp: React.FC = () => {
  const { tileContext } = useExtensionContext();

  useEffect(() => {
    if (tileContext) {
      const { dashboard, filters } = tileContext;
      console.log("Dashboard ID:", dashboard.id);
      console.log("Current Dashboard Filters:", filters);
    }
  }, [tileContext]);

  // listening for filter changes
  useEffect(() => {
    if (tileContext?.tileEvents) {
      const unsubscribe = tileContext.tileEvents.on('dashboard:filters:change', (event) => {
        console.log("Filters updated:", event.filters);
        // Trigger re-fetch of your tile data here
      });
      return () => unsubscribe();
    }
  }, [tileContext]);

  return <div>I am running as a Dashboard Tile</div>;
};
```

---

## 3. Gotchas & Pitfalls

### ⚠️ Size & Responsiveness
Dashboard layouts are flexible. A tile extension must handle height/width adjustments gracefully.
- **Best Practice**: Use `100%` width/height layouts and listen to window resize events or layout height updates provided by dashboard triggers.

### ⚠️ Filter Mapping Missyncs
Dashboard filters don't automatically map to your tile unless they are mapped in the Dashboard UI setup for that tile.
- **Action**: Ensure user maps the filter in the dashboard edit UI so the `tileContext.filters` object populated correctly.

---

## 4. Adding to a Dashboard

1.  Go to a Dashboard in **Edit Mode**.
2.  Click **Add -> Visualization / Tile**.
3.  Select your **Extension** from the tile source list.
