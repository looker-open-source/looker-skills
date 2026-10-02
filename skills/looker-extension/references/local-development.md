# Local Development Guide for Looker Extensions

Developing Looker extensions locally requires understanding how Looker loads the application inside a sandboxed iframe, how to manage browser loopback security, and how to configure Vite to serve a compiled static script correctly.

---

## 🚀 The Modern Development Workflow (HTTP Preview Mode)

Looker extensions run inside a sandboxed `<iframe>` hosted on a public cloud domain (e.g., `https://*.looker.app`). 

Because sandboxed iframes require a **fully compiled static bundle** (unbundled ESM `dev` mode often returns SPA directory fallback HTML for deep links, triggering CSP syntax crashes), the most stable way to develop is serving a compiled static production bundle via Vite's local preview server over **plain HTTP**:

### 1. Compile & Preview the Application Bundle
1. **Build the bundle**:
   ```bash
   npm run build
   ```
   This compiles your TypeScript and bundle outputs into `dist/bundle.js`.
2. **Start the static preview server**:
   ```bash
   npm run preview
   ```
   This serves your bundle over a plain HTTP port (`http://localhost:5173/bundle.js`).

### 2. Configure the LookML Project Manifest (`manifest.lkml`)
In your Looker IDE, point the `url:` directive directly to your local preview server:
```lookml
project_name: "your_project_name"

application: your_extension_id {
  label: "Your Extension Label"
  
  # Production file (commented out during dev)
  # file: "bundle.js"
  
  # Point exactly to local HTTP preview server
  url: "http://localhost:5173/bundle.js"
  
  mount_points: {
    standalone: yes
  }
  # ... (entitlements)
}
```
*Make sure to click **"Validate LookML"** in the Looker IDE after updating.*

---

## 🔐 Loopback Security & Chrome's Local Network Access (LNA)

Loading a local resource (`http://localhost:5173`) from a public cloud page (e.g., `https://*.looker.app`) triggers modern browser security checks designed to protect local network endpoints.

### 1. The `localhost` HTTP Exception
Browsers generally block loading insecure HTTP content inside an HTTPS page (Mixed Content). However, **`localhost` is treated as a special secure loopback exception**. 
By running your local Vite server over plain HTTP instead of self-signed HTTPS, you completely bypass complex SSL certificate warnings (which fail silently within iframe sandboxes).

### 2. Chrome's Private Network Access (PNA) Preflight Check
When Looker attempts to fetch `http://localhost:5173/bundle.js`, Chrome issues a preflight `OPTIONS` request. If your server does not return correct PNA approval headers, the browser blocks the connection.

To pass this check, your Vite server must respond to preflights with three critical headers:
- Reflect the exact requesting origin (do NOT use `*` if credentials are included).
- `Access-Control-Allow-Private-Network: true`
- `Access-Control-Allow-Credentials: true`

#### Optimal `vite.config.ts` PNA Plugin:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const privateNetworkPlugin = () => ({
  name: 'allow-private-network',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Request-Private-Network, x-requested-with');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      next();
    });
  },
  configurePreviewServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const origin = req.headers.origin || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Request-Private-Network, x-requested-with');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), privateNetworkPlugin()],
  server: { port: 5173, strictPort: true, cors: false },
  preview: { port: 5173, strictPort: true, cors: false }
})
```

### 3. Chrome site permission grant
Even with correct PNA headers, modern Chrome blocks public-to-private access by default. **You must grant a one-time site permission**:
1. On your active Looker browser tab, click the **Site Information / Lock icon** (🔒 or sliders) on the far left of the URL address bar.
2. Select **"Site settings"**.
3. Locate the permission labeled **"Apps on device"** (or **"Local network access"** / **"Insecure content"** depending on Chrome version).
4. Change it from "Block (default)" to **"Allow"**.
5. Return to your Looker tab and perform a **Hard Refresh** (Cmd+Shift+R / Ctrl+Shift+R).
