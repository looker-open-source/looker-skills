# Looker Deployment & Live Testing Guide

## 1. Preserving Existing `manifest.lkml`

Always inspect the project's existing `manifest.lkml` first (`get_project_file` in Looker MCP or `looker-cli project file cat {project_name} manifest.lkml`) and **append or update only the target `visualization: {}` block**—overwriting `manifest.lkml` from scratch deletes existing `constant:`, `application:`, `local_dependency:`, and sibling `visualization:` blocks:

```lkml
project_name: "{project_name}"

visualization: {
  id: "{viz_id}"
  label: "{viz_title}"
  file: "viz/{viz_id}.js"
}
```

---

## 2. Deployment Workflows

*(For unbundled single-file `.js` edits outside Vite, run `node -c {file}` first and optionally minify via `npx terser {file} --compress --mangle -o {out_file}`.)*

### Option A: `looker-cli` (`v1.2.1`, Recommended for Compiled Bundles)
```bash
# 1. Switch persistent session to Development Mode
looker-cli session update dev

# 2. Read existing manifest.lkml (if present), merge visualization block, then create or update
looker-cli project file cat {project_name} manifest.lkml
looker-cli project file update {project_name} manifest.lkml manifest.lkml   # or `create` if new
looker-cli project directory create {project_name} viz                       # once per project
looker-cli project file create {project_name} viz/{viz_id}.js dist/bundle.js

# Fast Dev Mode rebuild loop:
npm run build && looker-cli project file update {project_name} viz/{viz_id}.js dist/bundle.js

# 3. Validate LookML (compact error table)
looker-cli project validate {project_name}

# 4. After explicit user confirmation, commit & deploy to production
#    (works via CLI on bare/configured Git repos; use Looker IDE UI if remote Git requires OAuth/SSH auth)
looker-cli project commit {project_name} -m "Add {viz_id} custom visualization"
looker-cli project deploy {project_name}
```

### Option B: Looker MCP (`looker-dev` Tools)
1. Call `dev_mode` (`enable: true`) to enter Development Mode.
2. Call `get_project_file` to inspect `manifest.lkml`, `create_project_directory` (for `viz` if needed), and `create_project_file` / `update_project_file` to write `manifest.lkml` and compact Vanilla JS bundles.
   - **Bundle size limit**: MCP tool calls emit the entire file content as model output tokens; React/ECharts/Chart.js bundles (`150–600 KB`) exceed model output-token limits and truncate. Upload compiled bundles `>30 KB` via `looker-cli project file create/update` or Looker IDE file drag-and-drop.
3. Call `validate_project` to confirm zero LookML errors.
4. Looker MCP does not expose Git commit or production deploy tools—after user confirmation, complete the initial production deploy via `looker-cli project commit` + `project deploy` or the Looker IDE UI (**Commit Changes & Push → Deploy to Production**).

### Option C: Local HTTPS Bundle Server (`Admin > Visualizations`)
Looker **Admin > Visualizations** loads a classic `<script>` tag (not Vite's ESM dev server). To test locally over HTTPS without uploading files:
1. Generate local certs (`mkcert -install && mkcert localhost`) and configure `preview: { https: { key: './localhost-key.pem', cert: './localhost.pem' }, cors: true }` in `vite.config.*`.
2. Run `npx vite build --watch` alongside `npx vite preview --port 4173` and register `https://localhost:4173/bundle.js` in **Admin > Visualizations** (granting browser Private Network Access if prompted).

---

## 3. Registry & Dashboard Gotchas

- **Exact ID match**: `id` in `manifest.lkml` must match `id` in `looker.plugins.visualizations.add({ id })` character-for-character, or Looker renders a blank container.
- **First-time `production` indexing**: Looker will **not** display a brand-new `visualization` ID in the Explore visualization dropdown—even in Development Mode—until `manifest.lkml` has been deployed to `production` at least once. Subsequent `viz/{viz_id}.js` updates in Dev Mode take effect immediately on browser refresh.
- **LookML Dashboard & API `vis_config` type**: Project-scoped visualizations use `{project_name}::{viz_id}` (e.g., `type: {project_name}::{viz_id}`) in `.dashboard.lookml` elements and `create_query` `vis_config` objects.
