# Looker Custom Viz: Harness Testing & Deployment

This guide covers how to test your visualization locally using the harness, and how to deploy it to a Looker instance.

---

## 1. Local Harness Testing
The local harness (`harness/builder.html`) simulates Looker's environment offline for fast, interactive development.

### How it Works
*   **Mocks**: `harness/mocks.js` mocks the `LookerCharts` global, including a styled DOM drill menu simulation at click coordinates.
*   **Scenarios**: `harness/data_scenarios.js` contains pre-packaged mock datasets of different shapes (flat, pivoted, multi-series).
*   **Auto-Run**: The harness auto-runs when selecting a scenario pill or editing the JSON textareas (debounced by 500ms).

### Running the Harness Proxy Server
Because browser sandboxing and CORS restrict fetching Looker API data directly from `localhost`, a local Python development server is provided to act as an API proxy. 

1.  Start the proxy server from the project root:
    ```bash
    python3 skills/looker-custom-viz/assets/harness/server.py --port 45873
    ```
2.  Open the harness in your browser:
    `http://localhost:45873/skills/looker-custom-viz/assets/harness/builder.html`

### Adding Real Data (Reality Mapping)
You can dynamically import Looker data shapes into the harness UI:
1.  Click the **+ Import** button.
2.  Paste a Looker Explore URL or Query Slug (e.g., `qXyZ123`).
3.  Check **Save to data_scenarios.js permanently** and specify a name if you want to save it as a quick-select pill for future offline testing.
4.  Click **Import**. The proxy server will fetch the query schema and results via your active CLI credentials and load them into the harness automatically.

### Harness UI Reference & File Loading

When developing a new visualization, do not place your code files inside the skill's directory. Instead, develop them in your active repository/project folder and load them into the harness UI:

1.  **Loading Your Viz File**:
    *   **Via URL Parameter**: Pass the absolute path to your file (from the workspace root) in the URL's `file` parameter. For example: `http://localhost:45873/skills/looker-custom-viz/assets/harness/builder.html?file=/pie_chart_viz.js`.
    *   **Via UI input**: In the **VIZ SCRIPT** input field at the top of the harness UI, enter the absolute path to your script (e.g., `/pie_chart_viz.js`) or a relative path from the harness (e.g., `../../../../pie_chart_viz.js`), and click **Load**.
2.  **Mock Data Tab**:
    *   Click a **Scenario Pill** to load preset datasets.
    *   Manually tweak the **Schema (Query Response)** JSON or **Dataset (Raw Rows)** JSON to test edge cases; changes will automatically re-render the preview (debounced by 500ms).
3.  **Options Preview Tab**:
    *   Once your script is loaded, the harness parses the `options` schema inside your code.
    *   Adjust the generated toggles, select dropdowns, and text inputs to verify they pass configs to `updateAsync` and re-render properly.
4.  **Preview Panel (Right Side)**:
    *   Select **Visualization Preview** to view your SVG/Canvas output.
    *   Select **Looker Table View** to verify cell values, drill links, and HTML formatting in a grid layout matching Looker's native explore table.

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
