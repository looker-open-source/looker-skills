# Configuration Persistence

In Looker Extensions, `window.localStorage` is often unreliable due to sandboxed iframe restrictions or browser privacy settings blocking third-party storage.

Here are the two supported, reliable methods for persisting state/config.

---

## 1. Scoped User Attributes (Server-Side)
*Best for: User preferences, API keys, config that survives device switches.*

Scoped user attributes are server-side, secure, and namespaced to your extension.

### Manifest Setup (`manifest.lkml`)
You must explicitly list the attributes your extension can access.

```lookml
application: my-extension {
  entitlements: {
    scoped_user_attributes: [
      "target_url",
      "user_theme"
    ]
  }
}
```

### Reading Attributes (React)
Sync read from `lookerHostData` is fast; Async read is fresh.

```typescript
const loadConfig = async (sdk: ExtensionSDK) => {
  // 1. Sync check (Fast)
  const hostData = (sdk as any).lookerHostData || {};
  const attrs = hostData.userAttributes || {};
  
  if (attrs.target_url) return attrs.target_url;

  // 2. Async Fallback (Fresh)
  try {
    return await sdk.userAttributeGetItem('target_url');
  } catch (error) {
    console.warn("Attribute load failed:", error);
    return '';
  }
};
```

### Writing Attributes
Use `userAttributeSetItem` (not `updateUserAttribute`).

```typescript
await extensionSDK.userAttributeSetItem('target_url', 'https://api.example.com');
```

---

## 2. SDK LocalStorage (Client-Side)
*Best for: UI states, drafts, temporary local cache.*

Unlike `window.localStorage`, the SDK's built-in LocalStorage proxy works reliably in sandboxed environments.

### Manifest Setup
```lookml
application: my-extension {
  entitlements: {
    local_storage: yes
  }
}
```

### Usage

```typescript
// Writing
await extensionSDK.localStorageSetItem('key', 'value');

// Reading
const data = await extensionSDK.localStorageGetItem('key');

// Removing
await extensionSDK.localStorageRemoveItem('key');
```

---

## Gotchas & Pitfalls

### ⚠️ Async Attribute Crashes
Calling `userAttributeGetItem` on an attribute **not** declared in `manifest.lkml` can crash the SDK client silently or throw `TypeError`. Always wrap in `try/catch`.

### ⚠️ Stale Manifest State
Adding a scoped user attribute to Looker requires the attribute to actually exist on the Looker instance first. If missing in Looker Admin, the entitlement won't activate.
