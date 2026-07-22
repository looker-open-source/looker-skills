---
name: setting-up-looker-project
description: >-
  Looker Developer Onboarding: Step 5.
  Creates a new Looker project and configures Git.
  Only execute this after Step 4 (BigQuery Connection using `connecting-looker-to-bigquery`).
---

# Setting Up Looker Project

Creates a new Looker project and configures it with a local bare Git repository.

## Prerequisites

-   Looker CLI must be installed and authenticated (see `installing-looker-cli`
    and `authenticating-looker-cli` skills).

## Instructions

### 1. Switch to the Development Workspace

Switch to the 'dev' workspace (required for creating or modifying project
configurations). It is recommended to chain this with project operations to
guarantee dev workspace persistence:

```bash
looker-cli session update dev
```

### 2. Create the Project

Write the project name payload to `/tmp/project_create.json`:

```json
{
  "name": "{project_id}"
}
```

Create the Looker project using the project import command (chained with
`session update dev`):

```bash
looker-cli session update dev && looker-cli project import /tmp/project_create.json
```

> [!NOTE] Use a unique, URL-safe name for `{project_id}` (e.g.,
> `my_new_project`).

### 3. Configure Local Bare Git Repository

Write the Git configuration payload to `/tmp/project_git.json`:

```json
{
  "git_service_name": "bare"
}
```

Configure the project to use a local bare Git repository:

```bash
looker-cli session update dev && looker-cli project update {project_id} /tmp/project_git.json
```

> [!NOTE] This sets up a local Git repository on the Looker server, which is
> ideal for quick onboarding without needing external Git hosting.

### 4. Verify Project Setup

Retrieve the project details to verify that Git was correctly configured:

```bash
looker-cli project cat {project_id}
```

Ensure the output indicates that `uses_git` is `true` and `git_remote_url` is
not null (it will look like `../../bare_models/{project_id}.git`).

> [!NOTE] There might be a slight propagation delay on the Looker server after
> updating Git. If the `project cat` command fails (e.g., with a 400 error),
> wait a few seconds and retry.
