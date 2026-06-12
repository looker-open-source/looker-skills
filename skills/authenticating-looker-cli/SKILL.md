---
name: authenticating-looker-cli
description: >-
  Looker Developer Onboarding: Step 3.
  Authenticates the Looker CLI using OAuth.
  Only execute this after Step 2 (CLI Verification using `installing-looker-cli`).
---

# Authenticating Looker CLI

Authenticates the Looker CLI to a Looker instance using OAuth and saves the
session configuration in a named profile.

## Prerequisites

-   Looker CLI must be installed (see `installing-looker-cli` skill).
-   You must know the Looker instance URL (host and API port). Generically, the
    API port is `443` for Looker Core / Google Cloud Core.

## Instructions

### 1. Configure a Named Profile

Create a new profile named `default` to save your connection details:

```bash
looker-cli profile add default --host {instance_host} --port {instance_port}
```

Set this new profile as your default configuration:

```bash
looker-cli profile use default
```

### 2. Trigger OAuth Login

Run the login command in the background (since it requires interactive browser
authorization):

```bash
looker-cli session login --oauth
```

### 3. Retrieve the Authorization URL

Monitor the background login task log or stdout to extract the generated login
URL. Looker CLI will output:

`Opening browser to URL:` followed by a long URL.

### 4. Instruct the User (Interactive Step)

Present the login URL to the user and instruct them:

> "Please open the following URL in your browser, log in to Looker, and
> authorize the CLI:
>
> URL: {auth_url}
>
> If you are running on a local desktop machine, the login should complete
> automatically once authorized. If you are on a remote server/headless
> workspace, the browser will show a page load error or try to redirect to
> `http://127.0.0.1:7777/?code=...`. Please copy the *entire* redirected URL
> from your browser's address bar and paste it back into the terminal prompt."

### 5. Handle the OAuth Response

-   **Scenario A (Automatic)**: If the user completes authentication and the CLI
    is listening locally on port 7777, the login command task will finish
    successfully.
-   **Scenario B (Headless Fallback)**: The background process will print:
    `Paste redirected URL here: ` If the user pastes the redirected URL, use
    `manage_task` with `send_input` to pass the pasted URL directly to the
    background login task.

Once complete, `looker-cli` will automatically save the access and refresh
tokens into your `default` profile in `~/.config/looker-cli/config.yaml`.

### 6. Verify Authentication

Confirm you can successfully communicate with the Looker API without passing any
connection flags:

```bash
looker-cli user me
```

This should return a JSON object containing the authenticated user details.
