# Cross-Instance Connectivity

Looker Extensions run in a sandboxed iframe. To communicate with a *different* Looker instance (e.g., for migration tools), standard `fetch` calls usually fail due to CORS.

To bypass this, use the `extensionSDK.fetchProxy` method, which routes requests through the host Looker instance's backend.

---

## 1. Manifest Setup (`manifest.lkml`)
You must whitelist the Target instance URL in `external_api_urls`.

```lookml
application: my-extension {
  entitlements: {
    external_api_urls: ["https://target-instance.looker.com"]
  }
}
```

---

## 2. The `fetchProxy` Pattern

Create a class to wrap your Target API calls.

```typescript
export class TargetApi {
  constructor(
    private extensionSDK: ExtensionSDK,
    private baseUrl: string,
    private token: string
  ) {}

  async request(endpoint: string, options: any = {}) {
    // 1. Sanitize Base URL (Strip trailing slash)
    const cleanBase = this.baseUrl.replace(/\/$/, '');
    const url = `${cleanBase}/api/4.0/${endpoint}`;

    // 2. Proxy the Request
    const response = await this.extensionSDK.fetchProxy(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.token}` // Token for the TARGET instance
      }
    });

    if (!response.ok) {
       throw new Error(`Target API Error: ${response.statusText}`);
    }

    // SDK response body is usually parsed automatically if JSON
    return response.body;
  }

  async searchFolders(name: string) {
    return this.request(`folders/search?name=${encodeURIComponent(name)}`);
  }
}
```

---

## 3. Gotchas & Pitfalls

### ⚠️ Trailing Slashes
Looker's entitlement list is exact match based. `https://target.com/` (with slash) may fail if the manifest lists `https://target.com`.
- **Best Practice**: Always strip trailing slashes in your URL sanitization logic before passing to `fetchProxy`.

### ⚠️ Credential Leaks
To connect to a target, you typically need API credentials for that target.
- **Never** hardcode credentials.
- **Do** use `scoped_user_attributes` to read them from Looker state securely.
- **Do** use `fetchProxy` to avoid exposing secrets in the browser network tab when making calls (though they are still loaded in JS memory, fetchProxy protects the final call from CORS triggers).
