# Troubleshooting Common Issues

Building Looker Extensions involves interacting with a layered security sandbox. Below are the most common issues and how to resolve them.

---

## 1. The "Naked Extension" State
**Symptom**: Your app loads in a white screen, or fails to fully boot the SDK, or console shows generic extension proxy timeouts.

### 🔍 CAUSE A: React 18+ Batching Issues
Looker's `ExtensionProvider` can sometimes experience race conditions with React 18's concurrent rendering.
-   **Fix**: Downgrade to React 17 OR ensure `ExtensionProvider` is loaded conditionally only after looking for extension signals in `window`.

---

## 2. "Missing Capability" or 403 Platform Errors
**Symptom**: Looker API call fails with an error stating capability is missing, even if the user has full Looker Admin rights.

### 🔍 CAUSE: Manifest Out of Sync
Looker protects API surfaces via the `manifest.lkml`. Even Looker Admins cannot make calls from an extension if the manifest blocks it.
-   **Fix**: Check your `manifest.lkml` `entitlements` block.
-   Include exact endpoint name in `core_api_methods`:
    ```lookml
    core_api_methods: ["all_users", "create_query"]
    ```
-   **Gotcha**: Custom/internal endpoints often require `use_embeds: yes` or broad core access.

---

## 3. `localStorage` Crashes
**Symptom**: `SecurityError: Failed to read the 'localStorage' property.`

### 🔍 CAUSE: Sandboxed Iframe
Looker extensions run in sandboxed iframes (`data:` URLs or scoped origins). Browsers block full standard storage access inside these contexts for privacy.
-   **Fix**: Switch to `extensionSDK.localStorageGetItem` / `localStorageSetItem`.

---

## 4. Chrome Loopback Blocker (Private Network Access)
**Symptom**: Browser console displays `Permission was denied for this request to access the loopback address space` or Chatty handshake fails with `The development server appears not to be running`.

### 🔍 CAUSE A: Chrome's Local Network Access (LNA) Security
Modern Chromium-based browsers block public cloud sites (e.g. `https://*.looker.app`) from making requests to private local services (`localhost` or `127.0.0.1`) by default.

-   **Fix (Site Permission)**:
    1. On your active Looker browser tab, click the **Site Information / Lock icon** (🔒 or sliders) on the far left of the URL address bar.
    2. Select **"Site settings"** from the dropdown menu.
    3. Find the permission named **"Apps on device"** (or **"Local network access"** or **"Insecure content"** depending on the exact Chrome version).
    4. Change the option from **"Block (default)"** to **"Allow"**.
    5. Perform a **Hard Refresh** (Cmd+Shift+R / Ctrl+Shift+R) on the Looker tab.

### 🔍 CAUSE B: Missing Private Network Access (PNA) Headers
Chrome sends a preflight `OPTIONS` request to `localhost` to inspect its loopback permissions before loading the bundle. If your local dev/preview server does not explicitly return loopback authorization, Chrome immediately aborts.

-   **Fix**: Ensure your local server (Vite/Webpack/Backend) attaches correct CORS and PNA headers to `OPTIONS` preflight requests:
    -   Reflect the exact requesting `Origin` header (wildcard `*` is forbidden if credentials are sent).
    -   `Access-Control-Allow-Private-Network: true`
    -   `Access-Control-Allow-Credentials: true`
    -   `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`

### 🔍 CAUSE C: Insecure HTTPS Handshake Fails Inside Sandbox Iframe
If your local development server is running over HTTPS with a self-signed certificate (e.g., using `@vitejs/plugin-basic-ssl`), Chrome will silently block the iframe request since the certificate is untrusted, without giving you a prompt.
-   **Fix (Switch to HTTP)**: Bypassing HTTPS is the most reliable method. Turn off SSL on your local dev/preview server and run it over plain **`http://localhost:5173`**. Browsers treat `localhost` as a special loopback exception, allowing a secure HTTPS parent to load HTTP localhost without mixed-content security rejections.

---

## 5. SPA fallback HTML served as JS (Vite dev server)
**Symptom**: Looker sandbox frame crashes with syntax/CSP errors when parsing `bundle.js` (e.g., `Setting the document's base URI violates Content Security Policy base-uri 'self'`).

### 🔍 CAUSE: Unbundled Dev Server Fallback
When running Vite in raw dev mode (`npm run dev`), requesting `/bundle.js` often triggers Vite's SPA fallback, serving your project's index HTML (`index.html`) instead of compiling a static script file. When Looker's sandboxed template executes the HTML as a `<script>` tag, it syntax crashes.

-   **Fix**: Switch your workflow to local preview mode:
    1. Compile a static production bundle: `npm run build` (outputs to `dist/bundle.js`).
    2. Serve the static bundle using Vite's preview server: `npm run preview`.
    3. Point your Looker manifest `url` to `http://localhost:5173/bundle.js`.
