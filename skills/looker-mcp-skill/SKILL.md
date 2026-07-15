---
name: looker-mcp-skill
description: >-
  Guide for connecting to and using the Looker MCP Server. Explains how to access the Looker MCP server, set up Looker-managed vs local/standalone deployment, configure OAuth authentication, and catalog available MCP tools.
---

# Looker MCP Server Skill

This skill documents how to access, configure, and use the **Looker Model Context Protocol (MCP) Server**. It enables AI assistants, local IDEs (VS Code, Cursor, Claude Desktop, Gemini CLI), and automated agents to interact directly with Looker instances to query data, inspect semantic models, manage LookML projects, and execute system diagnostics.

---

## 1. Accessing the Looker MCP Server

Looker supports two primary deployment modes for the MCP server:

### A. Looker-Managed MCP Server (Recommended for Cloud / GCP Core)
The Looker-Managed MCP Server is built directly into Looker instances (Looker Core and Looker Original). It is hosted and managed by Google Cloud, eliminating the need to run separate server infrastructure.

- **Endpoint**: `https://<YOUR_LOOKER_INSTANCE_URL>/mcp`
- **Enablement**:
  1. Navigate to **Admin Panel** > **Platform** > **MCP**.
  2. Toggle **Enable MCP Server** to **On**.
  3. Ensure users and client applications have appropriate API and feature permissions.

### B. Local / Standalone MCP Server (MCP Toolbox for Databases)
For customer-hosted (on-premise) instances, custom developer environments, or standalone CLI integrations, you can run the MCP server locally using the **MCP Toolbox for Databases** (`@google/mcp-toolbox`).

- **Installation / Launch**:
  ```bash
  npx @google/mcp-toolbox --prebuilt=looker,looker-dev
  ```
  *Or via Docker:*
  ```bash
  docker run -p 5000:5000 \
    -e LOOKER_BASE_URL="https://your-instance.looker.com" \
    -e LOOKER_CLIENT_ID="<CLIENT_ID>" \
    -e LOOKER_CLIENT_SECRET="<CLIENT_SECRET>" \
    us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest --prebuilt=looker,looker-dev --address=0.0.0.0
  ```

- **Environment Variables**:
  - `LOOKER_BASE_URL`: Base URL of your Looker instance (e.g., `https://mycompany.looker.com`).
  - `LOOKER_CLIENT_ID`: Looker API 4.0 Client ID.
  - `LOOKER_CLIENT_SECRET`: Looker API 4.0 Client Secret.
  - `LOOKER_VERIFY_SSL`: Set to `false` for self-signed development certificates (default: `true`).

- **Cloud Run Deployment**:
  For running the MCP Toolbox server in Google Cloud Run, refer to the [Looker Cloud Run Sample](https://mcp-toolbox.dev/integrations/looker/samples/looker_cloud_run/).

---

## 2. Setting Up OAuth Authentication

To allow AI applications and clients to securely authenticate on behalf of users, register your client application as an OAuth client in Looker.

### Step 1: Register OAuth Client Application

You can register an OAuth client application using either the **API Explorer extension** (recommended) or via `curl`.

#### Option A: Using the Looker API Explorer (Recommended)
The **API Explorer** extension is included by default in Looker installations:
1. Open Looker and navigate to **Applications** > **API Explorer** (or go to `https://<YOUR_LOOKER_INSTANCE_URL>/extensions/marketplace_extension_api_explorer::api-explorer/`).
2. Search for the `register_oauth_client_app` endpoint (`POST /oauth_client_apps/{client_guid}`).
3. Enter your `<CLIENT_GUID>` and populate the request body parameters (`client_guid`, `display_name`, `redirect_uri`, `enabled: true`).
4. Execute **Run Request** to register the application.

#### Option B: Using `curl`
Alternatively, submit an HTTP POST request to Looker's `oauth_client_apps` endpoint:

```bash
curl -X POST "https://<YOUR_LOOKER_INSTANCE_URL>/api/4.0/oauth_client_apps/<CLIENT_GUID>" \
  -H "Authorization: Bearer <ADMIN_BEARER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "client_guid": "<CLIENT_GUID>",
    "display_name": "My AI Assistant Client",
    "redirect_uri": "http://127.0.0.1:7777/oauth/callback",
    "enabled": true
  }'
```

- `<CLIENT_GUID>`: A unique client identifier generated for your integration. **Note**: In your client application setup (e.g., IDE or AI client OAuth config), set the **OAuth Client ID** (`clientId`) to this `<CLIENT_GUID>`.
- `redirect_uri`: Target callback URL where authorization codes are sent. **Note**: The `redirect_uri` varies depending on the specific client or IDE application being registered:
  - **Antigravity**: `https://antigravity.google/oauth-callback`
  - **Claude Desktop / Claude AI**: `https://claude.ai/api/mcp/oauth/callback` or `http://localhost:<PORT>/oauth/callback`
  - **VS Code / Cloud Code Extension**: `https://vscode.dev/redirect` or `http://127.0.0.1:<PORT>/oauth/callback`
  - **Cursor Desktop**: `https://cursor.com/mcp/callback`
  - **Generic CLI / Local Tools**: `http://127.0.0.1:7777/oauth/callback` or `http://localhost:8080/callback`

> **Sample Configuration**: For a step-by-step example of configuring client OAuth credentials and client GUIDs, see [Configuring Claude Desktop with Looker OAuth](https://mcp-toolbox.dev/integrations/looker/samples/looker_claude_oauth/#configuring-claude-desktop).

### Step 2: Perform OAuth PKCE Flow / Bearer Authentication
1. **Redirect User to Authorization URL**:
   Generate a PKCE code verifier and SHA-256 challenge, then redirect the user to:
   ```
   https://<YOUR_LOOKER_INSTANCE_URL>/auth/oauth?client_id=<CLIENT_GUID>&response_type=code&code_challenge=<PKCE_CHALLENGE>&code_challenge_method=S256&redirect_uri=<REDIRECT_URI>
   ```

2. **Exchange Authorization Code for Access & Refresh Tokens**:
   Send a `POST` request to the token endpoint including the `code_verifier` to complete the PKCE handshake:
   ```bash
   curl -X POST "https://<YOUR_LOOKER_INSTANCE_URL>/api/4.0/oauth/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "client_id=<CLIENT_GUID>" \
     -d "redirect_uri=<REDIRECT_URI>" \
     -d "code=<AUTHORIZATION_CODE>" \
     -d "code_verifier=<CODE_VERIFIER>"
   ```

3. **Authenticate MCP Requests**:
   Include the acquired `access_token` in the HTTP header for requests sent to the MCP server:
   ```http
   Authorization: Bearer <ACCESS_TOKEN>
   ```

---

## 3. Connecting MCP Clients (IDE / Agent Configuration)

Add the server entry to your client configuration file (e.g., `.mcp.json`, Cursor `mcp.json`, or Gemini CLI config).

### Remote / Managed MCP Configuration

#### Native OAuth Clients (e.g. Claude Desktop)
Clients that natively support OAuth flows automatically handle authorization when configured with the server URL:
```json
{
  "mcpServers": {
    "Looker": {
      "httpUrl": "https://<YOUR_LOOKER_INSTANCE_URL>/mcp"
    }
  }
}
```
> Note: For native OAuth clients, configure the client's OAuth settings using your registered `<CLIENT_GUID>` as the Client ID. See [Configuring Claude Desktop](https://mcp-toolbox.dev/integrations/looker/samples/looker_claude_oauth/#configuring-claude-desktop) for details.

#### Standard HTTP Clients / Custom Scripts (Bearer Token via Headers)
For standard HTTP MCP clients or custom scripts that do not natively trigger OAuth login flows, pass the pre-acquired authentication token in the `headers` field:
```json
{
  "mcpServers": {
    "Looker": {
      "httpUrl": "https://<YOUR_LOOKER_INSTANCE_URL>/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_OAUTH_ACCESS_TOKEN>"
      }
    }
  }
}
```

### Local / Standalone MCP Configuration

#### Stdio Mode (via `npx`)
```json
{
  "mcpServers": {
    "Looker": {
      "command": "npx",
      "args": ["-y", "@google/mcp-toolbox", "--prebuilt=looker,looker-dev"],
      "env": {
        "LOOKER_BASE_URL": "https://<YOUR_LOOKER_INSTANCE_URL>",
        "LOOKER_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "LOOKER_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>"
      }
    }
  }
}
```

#### HTTP Mode (via Docker container)
If you are running the standalone MCP server via Docker (as specified in Section 1.B), connect your MCP client using `http://localhost:5000/mcp` as the MCP URL:

```json
{
  "mcpServers": {
    "Looker": {
      "httpUrl": "http://localhost:5000/mcp"
    }
  }
}
```

---

## 4. Tools Available via MCP

The Looker MCP Server exposes **45 tools** categorized into 6 functional areas:

### 📊 Data & Query Execution
| Tool | Description |
| :--- | :--- |
| `query` | Executes structured queries using LookML model, explore, dimensions, measures, filters, sorts, and limits. |
| `query_sql` | Generates the underlying SQL query compiled by Looker for a given query definition. |
| `query_url` | Runs or resolves queries given a Looker shareable query URL or slug. |
| `run_look` | Executes a saved Look by ID and returns dataset results. |
| `run_dashboard` | Runs and executes element queries for a specified Dashboard ID. |

### 🔍 Discovery & Metadata Catalog
| Tool | Description |
| :--- | :--- |
| `get_models` | Lists all available LookML models in the instance. |
| `get_explores` | Lists Explores defined within a LookML model. |
| `get_dimensions` | Retrieves dimension fields defined for an Explore. |
| `get_measures` | Retrieves measure fields defined for an Explore. |
| `get_filters` | Retrieves filter-only fields defined for an Explore. |
| `get_parameters` | Retrieves parameters defined for an Explore. |
| `get_connections` | Lists database connection configurations. |
| `get_connection_databases` | Lists databases accessible via a connection. |
| `get_connection_schemas` | Lists schemas inside a database connection. |
| `get_connection_tables` | Lists database tables inside a connection schema. |
| `get_connection_table_columns` | Lists columns and metadata for a database table. |

### 🎨 Dashboards & Content Creation
| Tool | Description |
| :--- | :--- |
| `get_looks` | Searches and retrieves saved Looks. |
| `get_dashboards` | Searches and retrieves user-defined and LookML dashboards. |
| `make_look` | Creates a new saved Look from a query definition. |
| `make_dashboard` | Creates a new dashboard container. |
| `add_dashboard_element` | Adds visualization/data elements to a dashboard. |
| `add_dashboard_filter` | Adds dynamic interactive filters to a dashboard. |
| `generate_embed_url` | Generates signed SSO embed URLs for embedding Looker content. |

### 🛠️ LookML Project Development
| Tool | Description |
| :--- | :--- |
| `dev_mode` | Toggles Development Mode vs Production Mode for the API session. |
| `get_projects` | Lists all LookML projects accessible to the session. |
| `get_project_directories` | Gets the directory structure tree of a project. |
| `get_project_files` | Lists files in a LookML project. |
| `get_project_file` | Views line contents of a specific LookML file. |
| `create_project_file` | Creates a new LookML file (`.lkml`, `.md`, etc.). |
| `update_project_file` | Updates line content of an existing LookML file. |
| `delete_project_file` | Removes a LookML file from the project workspace. |
| `create_project_directory` | Creates a subdirectory in the LookML project. |
| `delete_project_directory` | Deletes a project subdirectory. |
| `create_view_from_table` | Auto-generates standard LookML view definitions from a database table. |
| `validate_project` | Runs the LookML validator and returns compilation errors/warnings. |
| `get_lookml_tests` | Retrieves data test definitions written in LookML. |
| `run_lookml_tests` | Executes LookML data tests and returns pass/fail status. |

### 🌿 Git Version Control
| Tool | Description |
| :--- | :--- |
| `get_git_branch` | Retrieves active Git branch status for a LookML project. |
| `list_git_branches` | Lists remote and local Git branches. |
| `create_git_branch` | Creates a new Git working branch. |
| `switch_git_branch` | Switches project session context to specified Git branch. |
| `delete_git_branch` | Deletes a specified Git branch. |

### ⚙️ Developer & Diagnostics Utilities
| Tool | Description |
| :--- | :--- |
| `health_pulse` | Performs lightweight liveness and health checks on Looker instance. |
| `health_analyze` | Audits instance query performance and flags slow queries/PDT bottlenecks. |
| `health_vacuum` | Identifies un-utilized content, unused Explores, and candidate objects for cleanup. |

---

## 5. Security & Authorization Guidelines

1. **User Scope Enforcement & OAuth Context**: User-level scope enforcement and access controls (e.g., Access Grants, Model Sets, and User Roles) apply when using the **Looker-Managed MCP Server** (which authenticates users via OAuth) or when a standalone server is configured with user-specific OAuth tokens.
2. **Static API Credential Warning**: If the standalone/local MCP server is deployed with static environment credentials (`LOOKER_CLIENT_ID` and `LOOKER_CLIENT_SECRET`, e.g., as a shared Cloud Run service), all tool executions run under the security context of that single API credential pair. This may bypass individual user-level access controls and row-level security rules.
3. **Dev Mode Isolation**: Always toggle `dev_mode` to `true` when editing project files to isolate edits to personal developer workspace branches before staging and committing.

---

## 6. Alternative Tooling: Looker CLI (`looker-cli`)

For terminal workflows, shell scripts, and CI/CD pipelines, **Looker CLI (`looker-cli`)** is available as a command-line alternative for interacting with Looker API operations.

- **Repository**: [Looker CLI GitHub Repository](https://github.com/looker-open-source/looker-cli)
- **Use Cases**: Shell scripting, terminal interactive commands, CI/CD automation, and developer onboarding workflows (see `installing-looker-cli` and `authenticating-looker-cli` skills).

