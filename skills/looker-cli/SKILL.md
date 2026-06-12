---
name: looker-cli
description: How to install, configure, and use looker-cli (the Go-based replacement for gzr) to manage Looker resources.
---

# Looker CLI (looker-cli) Guide

`looker-cli` is a fast, Go-based command-line interface tool to manage Looker resources (folders, looks, dashboards, users, projects, etc.) via the Looker API 4.0. It replaces the legacy Ruby-based `gzr` tool.

## Installation

Once officially released, pre-compiled binaries will be available. For now, it can be compiled from source.

### Option 1: Pre-compiled Binaries (Recommended once released)
Download the appropriate binary for your OS and architecture from the [GitHub Releases](https://github.com/looker-open-source/gzr/releases) page (looker-cli is in the `gzr` repository).
Extract the binary and move it to a directory in your `PATH` (e.g., `/usr/local/bin`).

### Option 2: Go Install
If you have Go installed (version 1.26 or later):
```bash
go install github.com/looker-open-source/gzr/cmd/looker-cli@latest
```
Ensure your `GOPATH/bin` is in your `PATH`.

### Option 3: Build from Source
To compile `looker-cli` from source:
```bash
git clone -b go https://github.com/looker-open-source/gzr.git
cd gzr
go build -o looker-cli ./cmd/looker-cli
# Move looker-cli to your PATH
```

## Authentication

`looker-cli` supports several ways to connect to your Looker instance.

### 1. Interactive OAuth PKCE (Recommended for Users)
Log in interactively using a browser-based OAuth PKCE flow. You do not need to supply or save your API keys.
```bash
looker-cli session login --oauth --host your-looker-domain.com
```
*Note: In Looker 26.10 and later, the OAuth Client Application `com.looker.cli` is pre-registered. You may need to enable it under Admin -> Platform -> BI Connectors -> Developer Tools (toggle `Looker CLI`). For Looker 26.8 and earlier, it must be registered manually.*

### 2. Netrc File (Recommended for API Keys)
Store your API Client ID and Client Secret securely in `~/.netrc` to keep them out of your shell history:
```text
machine your-looker-domain.com
login YOUR_API_CLIENT_ID
password YOUR_API_CLIENT_SECRET
```
`looker-cli` will automatically retrieve these credentials when connecting to `your-looker-domain.com`.

### 3. Environment Variables
```bash
export LOOKERSDK_CLIENT_ID="your_client_id"
export LOOKERSDK_CLIENT_SECRET="your_client_secret"
```

### 4. Direct Flags
```bash
looker-cli user ls --client-id "ID" --client-secret "SECRET" --host your-looker-domain.com
```

## Profile Management

`looker-cli` supports configuration profiles to easily switch between different Looker instances. Profiles are stored in `~/.config/looker-cli/config.yaml`.

*   **Add Profile**:
    ```bash
    looker-cli profile add my-dev --host dev.looker.com --port 19999 --client-id "ID" --client-secret "SECRET"
    ```
*   **List Profiles**:
    ```bash
    looker-cli profile ls
    ```
    The active profile is marked with an asterisk (`*`).
*   **Set Default Profile**:
    ```bash
    looker-cli profile use my-dev
    ```
*   **Use Profile in Command**:
    ```bash
    looker-cli user me --profile my-dev
    ```

## Command Discovery (Meta Commands)

`looker-cli` provides built-in discovery tools to navigate its extensive command set.

*   **View Command Tree**:
    Show a hierarchical tree of all available commands and subcommands:
    ```bash
    looker-cli meta tree
    ```
    To scope the tree to a specific area (e.g., `project`):
    ```bash
    looker-cli meta tree --noun project
    ```
    To output the tree in JSON format:
    ```bash
    looker-cli meta tree --output json
    ```

*   **Search Commands**:
    Search for commands matching a keyword:
    ```bash
    looker-cli meta search <keyword>
    ```
    Example:
    ```bash
    looker-cli meta search alert
    ```
    To output search results in JSON format:
    ```bash
    looker-cli meta search alert --output json
    ```

## Common Commands Reference

### Folders (Spaces)
*   **List contents** (looks, dashboards, subfolders):
    ```bash
    looker-cli space ls [folder_id] --token-file --host your-domain.com
    ```
*   **Export folder recursively** (downloads all contents to local filesystem):
    ```bash
    looker-cli space export [folder_id] --token-file --host your-domain.com
    ```

### Dashboards & Looks
*   **Export Dashboard to JSON**:
    ```bash
    looker-cli dashboard cat [dashboard_id] --token-file --host your-domain.com > dash.json
    ```
*   **Import Dashboard from JSON**:
    ```bash
    looker-cli dashboard import dash.json [target_folder_id] --token-file --host your-domain.com
    ```
*   **Import LookML Dashboard**:
    ```bash
    looker-cli dashboard import_lookml "model::dash_name" [folder_id] --token-file --host your-domain.com
    ```

### Project Files (LookML)
Manage physical files and directories in Looker projects (uses undocumented API endpoints):
*   **List files in project**:
    ```bash
    looker-cli project file ls "my_project" --token-file --host your-domain.com
    ```
*   **View LookML file content**:
    ```bash
    looker-cli project file cat "my_project" "views/my_view.view.lkml" --token-file --host your-domain.com
    ```
*   **Create/Update LookML file**:
    ```bash
    looker-cli project file update "my_project" "views/my_view.view.lkml" local_file.lkml --token-file --host your-domain.com
    ```

### Raw API Access
Make raw Looker API calls based on the Looker API 4.0 Swagger spec:
*   **List Categories**: `looker-cli api help`
*   **List Operations under Category**: `looker-cli api query help`
*   **Get JSON Request Template**:
    For API commands that require a JSON body, use the `--template` flag to print a sample request payload:
    ```bash
    looker-cli api query run_inline_query --template
    ```
*   **Run Inline Query**:
    ```bash
    looker-cli api query run_inline_query json query.json --token-file --host your-domain.com
    ```
