---
name: looker-extension
description: >-
  Comprehensive guide for building, securing, and deploying Looker Extensions
  using React and Vite. Covers frontend configurations, entitlements, API usage,
  and best practices.
---

# Looker Extension Expert Guide

This skill provides a comprehensive guide for developers building applications on the **Looker Extension Framework**. It advocates for a modern stack while acknowledging the framework's flexibility.

## 🧩 Framework Agnosticism

The Looker Extension Framework is **framework-agnostic**. Because extensions run inside a sandboxed `<iframe>`, you can use *any* technology that runs in a browser:
*   **React** (Highly recommended for rich UIs and best SDK support)
*   **Vue.js**
*   **Angular**
*   **Svelte**
*   **Vanilla JavaScript**

The core communication with Looker happens via postMessage protocols handled by the Looker Extension SDK.

## 🎯 Core Architecture: Full-Frame vs Tile Extensions

Extensions can be deployed in two main contexts:

| Type | Purpose | SDK Context |
| :--- | :--- | :--- |
| **Full-Frame** | Standalone App in Looker UI Navigation | `extensionSDK` |
| **Tile Extension** | Embedded inside an existing Dashboard | `extensionSDK.tileContext` |

## 🚀 The Opinionated Stack: React + Vite

While you can use any framework, this guide strongly advocates for **React + Vite** for building full-featured applications.

### Why React?
*   **First-Class SDK**: `@looker/extension-sdk-react` provides seamless connection wrappers (`ExtensionProvider`) and hooks (`useExtensionContext`).
*   **Looker UI Theme**: `@looker/components` is built on React, allowing your extension to mirror the exact look and feel of standard Looker dashboards/applications.

### Why Vite?
*   **Speed**: Instant server start and lightning-fast Hot Module Replacement (HMR).
*   **Modern**: Better support for ES modules and modern JavaScript features.
*   **Simplicity**: Cleaner configuration compared to Webpack.

## 🛠️ Step-by-Step Implementation (React + Vite)

### 1. Initialize Project
```bash
npm create vite@latest my-looker-extension -- --template react-ts
cd my-looker-extension
npm install
```

### 2. Install Looker SDKs
```bash
npm install @looker/extension-sdk @looker/extension-sdk-react @looker/sdk
npm install @looker/components styled-components # For native UI
```

### 3. Basic Application Structure (`src/App.tsx`)
```typescript
import React from 'react'
import { ExtensionProvider, useExtensionContext } from '@looker/extension-sdk-react'

const InnerApp = () => {
  const { coreSDK } = useExtensionContext()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    coreSDK.ok(coreSDK.me()).then(setUser).catch(console.error)
  }, [coreSDK])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello from Looker Extension!</h1>
      {user && <p>Welcome, {user.display_name}</p>}
    </div>
  )
}

export const App = () => (
  <ExtensionProvider>
    <InnerApp />
  </ExtensionProvider>
)
export default App
```

## 📞 Calling the API

### Via React Hooks (Recommended)
Use `useExtensionContext` to access `coreSDK`.
```typescript
const { coreSDK } = useExtensionContext()
// Call API methods directly
coreSDK.ok(coreSDK.all_lookml_models()).then(models => ...)
```

### Via Core SDK (Vanilla JS)
If not using React, use `LookerExtensionSDK.create()`.
```javascript
import { LookerExtensionSDK } from '@looker/extension-sdk'

async function initialize() {
  const extensionSDK = await LookerExtensionSDK.create()
  const coreSDK = extensionSDK.coreSDK
  const me = await coreSDK.ok(coreSDK.me())
}
```

## 🏗️ Architectural Patterns

### 1. Backend-less Pattern
Use this pattern to avoid maintaining a custom backend for simple operations.
*   **Mechanic**: Use Looker's SQL Runner APIs (`create_sql_query`, `run_sql_query`) to read/write directly to BigQuery scratch schemas.
*   **Benefit**: Zero server maintenance, fully contained within Looker security model.

### 2. Backend-Connected Pattern
Use this pattern when you need a custom backend for complex logic.
*   **Mechanic**: Rely on **Looker User Attributes** to securely pass connection parameters (URL, API Key) to the frontend.
*   **Benefit**: Avoids storing secrets in `localStorage`.

## 🔐 Manifest Configuration & Entitlements (`manifest.lkml`)

Your extension's capabilities are strictly controlled by the `manifest.lkml` file.

### Example Manifest
```lookml
application: my_extension {
  label: "My Custom Extension"
  url: "http://localhost:5173/bundle.js"
  
  mount_points: {
    standalone: yes
    dashboard_extension: yes
  }

  entitlements: {
    use_form_submit: yes
    navigation: yes
    new_window: yes
    use_clipboard: yes
    core_api_methods: ["me", "all_lookml_models", "run_inline_query"]
    external_api_urls: ["https://api.example.com"]
    global_user_attributes: ["backend_url"]
  }
}
```

## ⚠️ Gotchas & Pitfalls

### Storage Sandbox
Do **not** use `window.localStorage` or `sessionStorage`. They fail or clear unpredictably in iframes.
*   **Fix**: Use `extensionSDK.localStorage` or persistent `scoped_user_attributes`.

### React Version Conflicts
React 18+ root mounting can conflict with older Looker container wrappers.
*   **Action**: Stick to React 17 unless explicitly testing backwards compatibility, or use standard `createRoot` with `looker-components` version locks. (Note: Recent apps like `chat-extension` use React 19, so verify compatibility if upgrading).

### Entitlement Locks
If a feature fails with "Missing capability", check `manifest.lkml`.
*   **Action**: You must explicitly declare entitlements in the Looker project manifest.

## 📁 Additional Resources & Scripts

This skill folder contains additional resources to assist you:

*   **References**:
    *   [SQL Runner Persistence Pattern](./references/patterns/sql-runner-persistence.md): Detailed guide on reading/writing to BigQuery directly from the frontend.
    *   [Local Development Guide](./references/local-development.md): Recommendations for standing up the extension in local development.
    *   [Backend Requirements Reference](./references/backend-requirements.md): Details on connection parameters, CORS, and auth.
*   **Scripts**:
    *   [Scaffold Extension Script](./scripts/scaffold-extension.sh): A bash script to quickly initialize a Vite + React project pre-configured for Looker.
