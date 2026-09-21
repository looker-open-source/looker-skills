---
name: using-looker-cli
description: >-
  Comprehensive guide for using `looker-cli`. Covers profile setup and defaults, using the --profile flag, persistent logins (`session login`), command discovery (`meta tree` & `meta search`), and request body inspection (`--describe-body` & `--template`).
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Using Looker CLI (`looker-cli`)

This skill documents standard operations, session management, discovery workflows, and API payload tools in **Looker CLI (`looker-cli`)**.

---

## 1. Managing Profiles

Profiles allow you to store connection configurations (host, port, credentials, tokens) for different Looker instances (e.g., development, staging, production) in `~/.config/looker-cli/config.yaml`.

### Adding a Profile

Add connection settings for a Looker instance using `profile add`:

```bash
looker-cli profile add <profile_name> --host <instance_host> --port <port>
```

Optional flags when creating a profile:
- `--client-id <id>`: Set Looker API Client ID.
- `--client-secret <secret>`: Set Looker API Client Secret.
- `--token <access_token>`: Store a pre-acquired API access token.
- `--refresh-token <refresh_token>`: Store an OAuth refresh token.

Example:
```bash
looker-cli profile add staging --host staging.looker.mycompany.com --port 443
```

### Listing Profiles

List all configured profiles:

```bash
looker-cli profile ls
```

The active (default) profile is denoted with an asterisk (`*`):

```text
  dev (dev.looker.mycompany.com:443)
* staging (staging.looker.mycompany.com:443)
  prod (prod.looker.mycompany.com:443)
```

### Setting the Default Profile

Set a specific profile as your default active profile using `profile use`:

```bash
looker-cli profile use <profile_name>
```

Example:
```bash
looker-cli profile use prod
```

Subsequent commands will automatically execute against the active profile without needing explicit connection flags.

### Overriding Profile per Command (`--profile`)

To execute a single command against a profile other than the default active profile, use the global `--profile` flag:

```bash
looker-cli <command> --profile <profile_name>
```

Examples:
```bash
# Query current user on production without changing active default profile
looker-cli user me --profile prod

# List projects in dev environment
looker-cli project ls --profile dev
```

### Deleting a Profile

Remove a stored profile definition using `profile rm`:

```bash
looker-cli profile rm <profile_name>
```

---

## 2. Persistent Session Login (`session login`)

`looker-cli` supports persistent authentication sessions, allowing commands to run without authenticating on every request.

### Basic Persistent Login

Authenticate against the host defined in your active profile using configured API credentials:

```bash
looker-cli session login
```

Upon successful authentication, access credentials and session state are persisted to `~/.config/looker-cli/config.yaml`.

### OAuth 2.0 PKCE Browser Login (`--oauth`)

For user-scoped interactive logins using OAuth 2.0 PKCE, pass the `--oauth` flag:

```bash
looker-cli session login --oauth
```

Workflow:
1. The CLI launches an authorization URL (or outputs the URL in headless environments).
2. Complete authentication and grant access in the browser.
3. OAuth access tokens and refresh tokens are automatically saved to your active profile in `config.yaml`.

### Outputting Token to Terminal (`--text`)

To display the authenticated access token to stdout (e.g., for piping into scripts or environment variables) instead of persisting it to the config file, pass `--text`:

```bash
looker-cli session login --text
```

### Checking Active Session Status

View details about the currently active session (authenticated user ID, session workspace, expiration):

```bash
looker-cli session get
```

### Workspace Context Switching

Switch your persistent session context between personal development workspace (`dev`) and production (`production`):

```bash
# Switch to personal development mode
looker-cli session update --workspace-id dev

# Switch to production mode
looker-cli session update --workspace-id production
```

### Ending a Session

Invalidate and terminate the active persistent session:

```bash
looker-cli session logout
```

---

## 3. Command Discovery with Meta Utilities

`looker-cli` includes `meta` discovery utilities to inspect command hierarchies and search available API endpoints.

### Visualizing Command Subtrees (`meta tree`)

Display the interactive CLI command tree:

```bash
looker-cli meta tree
```

#### Scoping to a Specific Noun (`--noun`)

To filter the tree for subcommands pertaining to a specific resource noun (e.g., `project`, `dashboard`, `user`, `query`), pass `--noun`:

```bash
looker-cli meta tree --noun project
```

Sample output:
```text
project
├── branch
├── cat
├── checkout
├── create
├── deploy
│   └── key
├── directory
│   ├── create
│   ├── ls
│   └── rm
├── file
│   ├── cat
│   ├── create
│   ├── ls
│   ├── rm
│   └── update
├── import
├── ls
├── update
└── validate
```

#### JSON Output Format (`--output json`)

Output the command structure as a JSON object:

```bash
looker-cli meta tree --noun query --output json
```

### Searching Commands by Keyword (`meta search`)

Search all high-level CLI commands and low-level API operations by keyword:

```bash
looker-cli meta search <KEYWORD>
```

Examples:
```bash
# Search for commands related to projects
looker-cli meta search project

# Search for commands related to users or authentication
looker-cli meta search user
```

Sample output:
```text
Found 63 matching commands:
  looker-cli api project create_project - Create Project
  looker-cli api project deploy_to_production - Deploy To Production
  looker-cli api project validate_project - Validate Project
  looker-cli project create - Create a new project
  looker-cli project validate - Validate a project
```

---

## 4. Inspecting API Request Bodies (`--describe-body` & `--template`)

`looker-cli` exposes low-level REST API endpoints under `looker-cli api <group> <endpoint>`. When creating or updating Looker resources via raw API commands, use `--describe-body` and `--template` to inspect expected parameters and structure payload files.

### Inspecting Request JSON Schema (`--describe-body`)

Pass `--describe-body` on an API command to output the formal JSON Schema of its request body. This lists all allowable parameters, data types, field descriptions, write-only flags, and allowed values (`x-looker-values`):

```bash
looker-cli api <group> <endpoint> --describe-body
```

Example: Inspect schema for creating a project
```bash
looker-cli api project create_project --describe-body
```

Sample snippet:
```json
{
  "properties": {
    "name": {
      "description": "Project display name",
      "type": "string",
      "x-looker-nullable": false
    },
    "pull_request_mode": {
      "description": "The git pull request policy for this project. Valid values are: \"off\", \"links\", \"recommended\", \"required\".",
      "type": "string",
      "x-looker-nullable": false,
      "x-looker-values": [
        "off",
        "links",
        "recommended",
        "required"
      ]
    }
  }
}
```

### Generating Payload Skeleton Templates (`--template`)

Pass `--template` on an API command to print a clean JSON skeleton populated with default/empty values for writable fields:

```bash
looker-cli api <group> <endpoint> --template
```

Example: Generate template for creating a connection
```bash
looker-cli api connection create_connection --template
```

Sample output:
```json
{
  "database": "",
  "db_timezone": "",
  "dialect_name": "",
  "host": "",
  "name": "",
  "port": ""
}
```

### Practical Workflow: Creating Resources via API Payloads

Combine `--template` with piping or file redirection to construct and submit POST/PUT payloads:

1. **Generate and edit template file**:
   ```bash
   looker-cli api project create_project --template > new_project.json
   ```

2. **Populate required fields** in `new_project.json`:
   ```json
   {
     "name": "my_new_project",
     "pull_request_mode": "recommended"
   }
   ```

3. **Execute API request using payload file**:
   ```bash
   looker-cli api project create_project --body new_project.json
   ```

---

## 5. File Synchronization, Validation & Querying

### Automatic File Synchronization (VS Code Looker Extension)

In this development environment, **you do NOT need to manually upload or sync files via the CLI**. 

The **Looker VS Code Extension** is active and automatically synchronizes all local file edits, creations, and deletions directly to your Looker Dev workspace in real time when files are saved.

*   **Simply edit or create files on local disk** in your workspace directory (e.g., `views/`, `models/`).
*   **Do NOT execute** `looker-cli project file create` or `looker-cli project file update` unless operating in a headless non-VS Code environment where automated syncing is unavailable.
*   To inspect the remote file content on Looker if needed:
    ```bash
    looker-cli project file cat <project_id> <filepath_in_project>
    ```

### Validating LookML

Validate the project against the Looker LookML compiler:

```bash
looker-cli project validate <project_id>
```

Returns `Project is valid.` on success, or lists compilation errors with line numbers and descriptions.

### Verifying Queries via CLI

Verify that queries against your explores run cleanly on the target database (BigQuery):

```bash
# 1. Inspect generated SQL
echo '{"model":"<model_name>","view":"<explore_name>","fields":["<explore>.<field>"]}' | looker-cli api query run_inline_query sql -

# 2. Execute query and return JSON rows
echo '{"model":"<model_name>","view":"<explore_name>","fields":["<explore>.<field>"],"limit":"5"}' | looker-cli api query run_inline_query json -
```

---

## 6. Resetting the Looker Dev Environment

When switching tasks, abandoning dirty experimental edits, or realigning your personal Looker dev branch with production or remote Git:

### Reset Dev Branch to Match Production

Discards all uncommitted changes on your personal Looker dev branch and resets it to the current deployed production state:

```bash
looker-cli session update dev && looker-cli api project reset_project_to_production <project_id>
```

### Reset Dev Branch to Match Remote Git Branch

Discards local Looker uncommitted changes and resets the dev branch to the head of the corresponding remote Git branch:

```bash
looker-cli session update dev && looker-cli api project reset_project_to_remote <project_id>
```

---

## 7. Git & Webhook Production Deployment Workflow

Production deployment in this environment is driven by Git and Looker Deploy Webhooks:

1. **Local Development & Validation**:
   - Modify LookML files locally in VS Code (auto-synced to Looker dev mode).
   - Validate LookML: `looker-cli project validate <project_id>`
   - Run test query: `echo '...' | looker-cli api query run_inline_query json -`

2. **Commit & Push to Remote**:
   - Stage and commit your changes in git:
     ```bash
     git add .
     git commit -m "feat(lookml): describe your changes"
     git push origin <branch_name>
     ```

3. **Merge Pull Request on GitHub**:
   - Open and merge the Pull Request into `master` on GitHub.

4. **Automated Production Deployment via Webhook**:
   - GitHub notifies Looker via the configured deploy webhook.
   - Looker automatically pulls the latest commit from `master` into Production mode.

5. **Realign Dev Branch**:
   - Reset your Looker dev workspace to match production:
     ```bash
     looker-cli api project reset_project_to_production <project_id>
     ```

---

## 8. Quick Reference Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Add Profile** | `looker-cli profile add dev --host dev.looker.com --port 443` |
| **List Profiles** | `looker-cli profile ls` |
| **Set Default Profile** | `looker-cli profile use dev` |
| **Override Profile** | `looker-cli project ls --profile prod` |
| **Persistent Login** | `looker-cli session login` |
| **OAuth PKCE Login** | `looker-cli session login --oauth` |
| **Inspect Session** | `looker-cli session get` |
| **Set Dev Workspace** | `looker-cli session update dev` |
| **Push File to Looker** | `looker-cli project file update <project_id> <path> <local_file>` |
| **Create File on Looker** | `looker-cli project file create <project_id> <path> <local_file>` |
| **Validate LookML** | `looker-cli project validate <project_id>` |
| **Run Inline Query (SQL)** | `echo '{"model":"...","view":"...","fields":["..."]}' \| looker-cli api query run_inline_query sql -` |
| **Run Inline Query (JSON)** | `echo '{"model":"...","view":"...","fields":["..."]}' \| looker-cli api query run_inline_query json -` |
| **Reset Dev to Production** | `looker-cli api project reset_project_to_production <project_id>` |
| **Reset Dev to Remote Git** | `looker-cli api project reset_project_to_remote <project_id>` |
| **Command Tree** | `looker-cli meta tree` |
| **Search Commands** | `looker-cli meta search <keyword>` |
| **View Request Schema** | `looker-cli api <group> <endpoint> --describe-body` |
| **Generate JSON Template** | `looker-cli api <group> <endpoint> --template` |
