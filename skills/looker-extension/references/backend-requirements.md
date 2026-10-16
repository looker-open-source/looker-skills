# Looker Extension: Remote Backend Requirements

This reference file outlines what a frontend developer needs to know about the remote backend when building a Looker Extension that connects to an external service.

## 1. Connection Parameters

To avoid hardcoding URLs and exposing secrets in the frontend bundle, Looker Extensions should rely on **Looker User Attributes** to pass configuration down to the application.

### Required User Attributes
The Looker Admin must configure the following global user attributes:

*   `backend_url`: The URL of the deployed backend service (e.g., `https://api.example.com`).
*   `backend_api_key`: (Optional) The Bearer token or API key used to authenticate requests to the backend.

### Fetching in Frontend
Use the Looker Extension SDK to fetch these attributes dynamically on application mount:

```javascript
const backendUrl = await extensionSDK.userAttributeGetItem('backend_url');
const apiKey = await extensionSDK.userAttributeGetItem('backend_api_key');
```

## 2. Secure Connection & CORS

Looker Extensions run in a sandboxed iframe. The browser will block any network requests to domains not explicitly allowed.

### Entitlements in `manifest.lkml`
You must declare the backend URL in the `external_api_urls` section of your `manifest.lkml`:

```lookml
entitlements: {
  external_api_urls: [
    "https://api.example.com"
  ]
}
```

### CORS on the Backend
The remote backend must be configured to allow cross-origin requests (CORS) from the Looker instance domain.
*   Ensure the backend responds with appropriate `Access-Control-Allow-Origin` headers.
*   Do not use wildcard `*` if credentials (cookies/auth headers) are being sent.

## 3. Authentication Flow

Instead of implementing a complex OAuth flow or login screen in the extension, leverage Looker's authentication:

1.  **Identify User**: The extension can identify the current Looker user via the SDK (`extensionSDK.me()`).
2.  **Secure Relay**: Pass the Looker user's identity or a secure token (derived or stored in user attributes) to the backend to authenticate the user on the backend side.
3.  **Backend Validation**: The backend should validate the incoming requests using the provided API key or by verifying a Looker-signed token if applicable.

## 4. Fallback for Local Development

During local development, you often need to connect to a local backend (e.g., `http://localhost:8000`).

*   Create a dev-specific user attribute like `backend_url_dev`.
*   In your code, toggle between production and dev URLs based on the environment or a URL parameter.
