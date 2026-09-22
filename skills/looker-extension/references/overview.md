# Looker Extensions Overview & Setup

Looker Extensions are React/JavaScript applications hosted securely within the Looker instance. They run in an iframe and communicate with the Looker parent via the Looker Extension SDK.

## 1. Manifest Configuration (`manifest.lkml`)

Every extension requires a definition in the Looker project's `manifest.lkml` file.

```lookml
application: my_extension {
  label: "My Extension"
  # For local development:
  url: "https://localhost:8080/bundle.js"
  # For production (uploaded to Looker Git):
  # file: "bundle.js"

  entitlements: {
    use_embeds: yes
    use_form_submit: yes
    core_api_methods: ["all_users", "me", "run_query"]
    external_api_urls: ["https://api.example.com"]
    scoped_user_attributes: ["user_preference_attribute"]
  }
}
```

### Key Entitlements Gotcha
If you add an API call in code but do not update `core_api_methods` in `manifest.lkml`, the call will fail with a generic "Missing Capability" or 403-like error in the SDK wrapper.

---

## 2. SDK Initialization (React)

The recommended connection pattern uses the `@looker/extension-sdk-react` package.

### Wrappers

Always wrap your application root with `ExtensionProvider`.

```tsx
import React from 'react';
import { ExtensionProvider } from '@looker/extension-sdk-react';
import { MainApp } from './MainApp';

export const Root: React.FC = () => {
  return (
    <ExtensionProvider>
      <MainApp />
    </ExtensionProvider>
  );
};
```

### consuming the SDK Inside Components

Use the `useExtensionContext` hook to access the SDK and Looker API.

```tsx
import React, { useEffect } from 'react';
import { useExtensionContext } from '@looker/extension-sdk-react';

export const MainApp: React.FC = () => {
  const { core40SDK, extensionSDK } = useExtensionContext();

  useEffect(() => {
    const loadUser = async () => {
      const me = await core40SDK.ok(core40SDK.me());
      console.log("Logged in as:", me.display_name);
    };
    loadUser();
  }, [core40SDK]);

  return <div>Hello Looker Extension</div>;
};
```

---

## 3. Alternative Frameworks (Vanilla JS, Vue, Angular)

For non-React applications, use the framework-agnostic `@looker/extension-sdk` package.

### Initialization

Connect to the Looker parent using `createClient()`.

```javascript
import { LookerExtensionSDK } from '@looker/extension-sdk';

LookerExtensionSDK.createClient().then((client) => {
  const { extensionSDK, core40SDK } = client;
  
  console.log("Extension connected!");
  // Example: API Call
  core40SDK.me().then((me) => {
      console.log("User:", me.display_name);
  });
}).catch((error) => {
  console.error("Failed to connect to Looker host:", error);
});
```

---

## 4. Local Development Workflow & CORS

To enable rapid iteration, configure your application to serve locally and let Looker render it via a manifest pointer.

### Webpack DevServer Configuration

To allow Looker to download your local bundle without being blocked by browser security, your local server **must** serve the file with broad access control headers.

**Example `webpack.develop.js` (or `webpack.config.js` devServer):**

```javascript
module.exports = {
  // ... other config
  devServer: {
    port: 8080,
    https: true, // Looker requires HTTPS for local bundles
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
}
```

### 🧠 Why CORS is a Non-Issue for API Calls

When testing locally via `url: "https://localhost:8080/bundle.js"`:
1.  **Static Asset CORS**: The `Access-Control-Allow-Origin` headers above are only used so the Looker parent page (`your-looker.com`) can **download your local bundle code** into the iframe.
2.  **API execution**: When your extension calls `core40SDK.run_query()`, it does not make a direct fetch call to Looker. It passes a message to the Parent Frame via postMessage. Looker then executes the API call from its own origin.

**Workflow summary:**
1.  Enable **Development Mode** in Looker.
2.  Point `url: "https://localhost:8080/bundle.js"` in `manifest.lkml`.
3.  Run `npm run dev` (ensuring HTTPS is enabled).
4.  Refresh Looker to see live updates.

