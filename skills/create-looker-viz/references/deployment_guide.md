# Looker Custom Viz: Harness Testing & Deployment

This guide covers how to test your visualization locally using the harness, and how to deploy it to a Looker instance.

---

## 1. Local Harness Testing
The generated visualization code includes a built-in Vite development server that simulates Looker's environment offline for fast, interactive development.

### How it Works
*   **Mocks**: The local app intercepts the visualization component and injects mock data shapes and configurations.
*   **Hot-Module Replacement (HMR)**: Changes to your code are reflected instantly in the browser without a full page reload.

### Running the Harness
1.  Install the required npm dependencies:
    ```bash
    npm install
    ```
2.  Start the Vite development server:
    ```bash
    npm run dev
    ```
3.  Open the local preview URL (usually `http://localhost:5173`) in your browser to interact with the visualization using mock data.

### Adding Real Data (Reality Mapping)
To test with real Looker data shapes, you can capture the JSON query response from a Looker Explore and update the mock data files inside your project's `src/` directory.

1. In Looker, build the Explore query you want to visualize.
2. Select **Explore Actions (gear icon) > Download**, choose **JSON** format, and save the result.
3. Use this JSON to populate the mock data structures in your local development environment to ensure your visualization logic properly maps to the exact data shapes it will receive in production.

---

## 2. Code Validation and Minification

Always check for syntax errors and compress your code before uploading it to a Looker project.

### 1. Syntax Validation (Mandatory)
Before minifying or deploying, always verify that your JavaScript file is free of compile and syntax errors:
*   **Vanilla JS**: Run `node -c path/to/viz.js` (this compiles the file offline and reports any unexpected tokens or syntax issues).
*   **React/Webpack**: Run `npm run build` (compilation will fail automatically if there are syntax errors).

### 2. Asset Minification
To improve dashboard loading performance and reduce download overhead, compress the production code using `terser`:
```bash
npx terser path/to/viz.js --compress --mangle -o path/to/viz.min.js
```
Always verify the minified script compiles properly before uploading.

---

## 3. Deployment Strategies

### Strategy A: Git-Integrated Manifest (Recommended for Production)
This method hosts the visualization code directly inside Looker's version-controlled Git repository. It eliminates CORS and HTTPS certificate setup.

1.  **Build UMD bundle**: `npm run build` -> compiles to `dist/viz_bundle.js`.
2.  **Add Manifest**: Create `manifest.lkml` in the Looker project root:
    ```lkml
    project_name: "my-viz-project"
    visualization: {
      id: "my_custom_viz"
      label: "My Custom Chart"
      file: "dist/viz_bundle.js"
      dependencies: [
        "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js",
        "https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js"
      ]
    }
    ```
3.  **Push**: Commit the `dist/` directory and `manifest.lkml` to the repository. Switching to Dev Mode in Looker lets you immediately use the viz.

### Strategy B: Looker CLI Dev Mode (Fastest for Live Testing)
Deploy changes directly to Looker via the CLI without git commits.

1.  **Login**: `looker-cli session login --oauth`
2.  **Create Dev Project** (once): `looker-cli project create "my-viz-dev"`
3.  **Upload File**:
    ```bash
    npm run build
    looker-cli project file create my-viz-dev manifest.lkml manifest.lkml --force
    looker-cli project file create my-viz-dev viz_bundle.js dist/viz_bundle.js --force
    ```

### Strategy C: Local HTTPS Server (Alternative)
Serve the file locally over HTTPS.
*   **Setup**: Run `mkcert -install && mkcert localhost` once to trust local certificates.
*   **Run**: Serving over HTTPS (e.g. `webpack serve --https` on port 8080).
*   **Configure**: In Looker Admin > Visualizations, add a viz pointing to `https://localhost:8080/viz_bundle.js`.
*   *Note*: Modern browsers might block localhost URLs on non-local domains unless CORS/Private Network Access is configured.

---

## 4. Registry & Dev Mode Gotchas
*   **ID Matching**: The `id` defined in the `manifest.lkml` project file (e.g. `id: "my_custom_viz"`) **must exactly match** the `id` string passed to `looker.plugins.visualizations.add({ id: 'my_custom_viz' })` inside your JavaScript code. If they do not match, the explore interface will load a blank visualization container.
*   **Initial Production Footprint**: When registering a **new** custom visualization ID for the first time, Looker's registry will not display it in the Explore dropdowns under Development Mode until the project's manifest has been committed and deployed to production **at least once**. Once this initial manifest is pushed to production, subsequent code changes to the JS files inside your dev workspace are instantly hot-reloaded without further deploys.
*   **Git Commit Step Required for Prod**: The Looker API has no endpoint to commit changes. Running `looker-cli project file update` only writes the changes to your Development Mode workspace. To push changes all the way to production, you must instruct the user to open the Looker IDE UI, click **Commit Changes & Push**, and then click **Deploy to Production** to merge the changes. Running `looker-cli project deploy` without this manual commit step will not deploy uncommitted changes.

---

## 5. Looker CLI Reference Sheet

Below is a cheat sheet of the standard `looker-cli` commands used for configuring projects, connections, and permissions during custom visualization onboarding.

### 1. Authentication & Session Setup
*   **OAuth Login (Interactive)**:
    ```bash
    looker-cli session login --oauth
    ```
    > [!IMPORTANT]
    > **Remote Workstation Port Forwarding**: The OAuth login flow (`looker-cli session login --oauth`) starts a temporary local redirect listener on port `7777`. If you are developing on a remote VM, Cloud Workstation, or SSH host, you **must forward port 7777** to your local machine (e.g. via VS Code port forwarding or `ssh -L 7777:localhost:7777`) before logging in, otherwise the browser auth completion redirect will fail.
*   **Switch to Development Workspace** (Required to edit files/projects):
    ```bash
    looker-cli session update dev
    ```

### 2. Project Creation & Setup
*   **Create a new Looker Project**:
    ```bash
    # 1. Write project creation JSON payload
    echo '{"name": "custom_visualizations"}' > /tmp/project_create.json
    
    # 2. Import the project using CLI
    looker-cli project import /tmp/project_create.json
    ```
*   **Configure Local Bare Git Repository**:
    ```bash
    # 1. Write git configurations JSON payload
    echo '{"git_service_name": "bare"}' > /tmp/project_git.json
    
    # 2. Update the project git settings
    looker-cli project update custom_visualizations /tmp/project_git.json
    ```
*   **Upload Manifest & Bundles**:
    ```bash
    looker-cli project file create custom_visualizations manifest.lkml manifest.lkml --force
    looker-cli project file create custom_visualizations viz_bundle.js dist/viz_bundle.js --force
    ```

### 3. Admin settings Configuration (API commands)
*   **Create Fake Database Connection** (Required to satisfy LookML model compilation):
    ```bash
    # 1. Write postgres connection JSON payload
    echo '{
      "name": "custom_visualizations",
      "dialect_name": "postgres",
      "host": "localhost",
      "port": 5432,
      "username": "looker"
    }' > /tmp/connection_create.json
    
    # 2. Execute via Looker API wrapper
    looker-cli api connection create_connection /tmp/connection_create.json
    ```
*   **Update Model Set Permissions**:
    To allow users to see the custom visualization model, add the model name to the active model set:
    ```bash
    # 1. Fetch current model set definition to get existing models list
    looker-cli api role model_set <MODEL_SET_ID>
    
    # 2. Write updated model list JSON payload (re-add existing and append your new model)
    echo '{"models": ["existing_model_1", "existing_model_2", "custom_visualizations"]}' > /tmp/model_set_update.json
    
    # 3. Update model set
    looker-cli api role update_model_set <MODEL_SET_ID> /tmp/model_set_update.json
    ```
