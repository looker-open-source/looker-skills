---
name: installing-looker-cli
description: >-
  Looker Developer Onboarding: Step 2.
  Verifies that the Looker CLI is available in the PATH, or installs it from GitHub Releases if missing.
  Only execute this after Step 1 (Data Discovery using `exploring-data-for-looker`).
---

# Installing Looker CLI

Checks if `looker-cli` is already available on the system. If it is not found,
downloads and installs the appropriate pre-compiled binary from the GitHub
Releases page of the `looker-cli` repository
(`https://github.com/looker-open-source/looker-cli/releases`).

## Prerequisites

-   Active internet connection to download the binary from GitHub.
-   Privileges to write to local binary directories (e.g. `/usr/local/bin` or
    `~/.local/bin`).

## Instructions

### 1. Check for Existing Installation

Before downloading, check if the CLI is already installed and accessible:

```bash
looker-cli --help
```

If this command executes successfully and prints the help menu, the CLI is
ready. **Skip the installation steps below** and proceed directly to Step 3
(Authentication).

--------------------------------------------------------------------------------

### 2. Perform OS-Specific Installation

If `looker-cli` is not found, determine the operating system of the environment
and execute the corresponding installation steps.

#### Option A: macOS & Linux

1.  **Retrieve latest release tag**: Query the GitHub API or check the releases
    page (`https://github.com/looker-open-source/looker-cli/releases`) to
    identify the latest version tag (e.g., `v1.0.0`).
2.  **Download and install**: Run the following sequence to download, rename,
    and move the binary to your local bin path:

    *For macOS (arm64 Apple Silicon):*

    ```bash
    curl -Lo looker-cli https://github.com/looker-open-source/looker-cli/releases/latest/download/looker-cli-darwin-arm64
    chmod +x looker-cli
    mkdir -p ~/.local/bin && mv looker-cli ~/.local/bin/
    ```

    *For macOS (amd64 Intel):*

    ```bash
    curl -Lo looker-cli https://github.com/looker-open-source/looker-cli/releases/latest/download/looker-cli-darwin-amd64
    chmod +x looker-cli
    mkdir -p ~/.local/bin && mv looker-cli ~/.local/bin/
    ```

    *For Linux (amd64):*

    ```bash
    curl -Lo looker-cli https://github.com/looker-open-source/looker-cli/releases/latest/download/looker-cli-linux-amd64
    chmod +x looker-cli
    mkdir -p ~/.local/bin && mv looker-cli ~/.local/bin/
    ```

    *Note: If `~/.local/bin` is not in your `PATH` or you have root permissions,
    you can choose to move it to `/usr/local/bin/` instead.*

#### Option B: Windows

1.  **Download**: Download the latest Windows binary (e.g. using PowerShell):

    ```powershell
    Invoke-WebRequest -Uri "https://github.com/looker-open-source/looker-cli/releases/latest/download/looker-cli-windows-amd64.exe" -OutFile "looker-cli.exe"
    ```
2.  **Add to Path**: Move `looker-cli.exe` to a directory in your system
    `%PATH%` (or add its directory to the Environment Variables).

--------------------------------------------------------------------------------

### 3. Verify the Installation

Run the help command again to verify the installation succeeded:

```bash
looker-cli --help
```

Confirm that the output shows the Looker CLI help menu correctly. If it fails,
check that the destination directory is indeed in your shell's `PATH`.
