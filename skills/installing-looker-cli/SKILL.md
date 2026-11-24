---
name: installing-looker-cli
description: >-
  Looker Developer Onboarding: Step 2.
  Verifies that the Looker CLI is available in the PATH, or installs it from GitHub Releases if missing.
  Only execute this after Step 1 (Data Discovery using `exploring-data-for-looker`).
license: Apache-2.0
metadata:
  publisher: google
  version: v1
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

Before downloading, check if the CLI is already installed and accessible on your
`PATH` (including `~/.local/bin`, which non-interactive subshells often omit):

```bash
export PATH="$HOME/.local/bin:$PATH"
command -v looker-cli && looker-cli --help
```

If this command executes successfully and prints the help menu, the CLI is
ready. **Skip the installation steps below** and proceed directly to Step 3
(Authentication). If it only succeeded because `~/.local/bin` was added above,
include `export PATH="$HOME/.local/bin:$PATH"` in subsequent commands or your
shell profile (`~/.bashrc` / `~/.zshrc`).

--------------------------------------------------------------------------------

### 2. Perform OS-Specific Installation

If `looker-cli` is not found, determine the operating system and CPU
architecture (`uname -s`, `uname -m`) of the environment and download the
corresponding release archive from GitHub Releases. Release assets include the
version number without a leading `v` (for example,
`looker-cli_1.3.0_linux_amd64.tar.gz`), so resolve the latest tag first instead
of hardcoding a `/releases/latest/download/` filename.

#### Option A: macOS & Linux

1.  **Resolve latest release tag and install**: Download the matching `.tar.gz`
    archive and extract `looker-cli` into `~/.local/bin/`:

    *For macOS (arm64 Apple Silicon):*

    ```bash
    TAG_URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/looker-open-source/looker-cli/releases/latest)
    TAG="${TAG_URL##*/}"
    VERSION="${TAG#v}"
    mkdir -p ~/.local/bin
    curl -fsSL "https://github.com/looker-open-source/looker-cli/releases/download/${TAG}/looker-cli_${VERSION}_darwin_arm64.tar.gz" | tar -xz -C ~/.local/bin looker-cli
    chmod +x ~/.local/bin/looker-cli
    ```

    *For macOS (amd64 Intel):*

    ```bash
    TAG_URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/looker-open-source/looker-cli/releases/latest)
    TAG="${TAG_URL##*/}"
    VERSION="${TAG#v}"
    mkdir -p ~/.local/bin
    curl -fsSL "https://github.com/looker-open-source/looker-cli/releases/download/${TAG}/looker-cli_${VERSION}_darwin_amd64.tar.gz" | tar -xz -C ~/.local/bin looker-cli
    chmod +x ~/.local/bin/looker-cli
    ```

    *For Linux (amd64):*

    ```bash
    TAG_URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/looker-open-source/looker-cli/releases/latest)
    TAG="${TAG_URL##*/}"
    VERSION="${TAG#v}"
    mkdir -p ~/.local/bin
    curl -fsSL "https://github.com/looker-open-source/looker-cli/releases/download/${TAG}/looker-cli_${VERSION}_linux_amd64.tar.gz" | tar -xz -C ~/.local/bin looker-cli
    chmod +x ~/.local/bin/looker-cli
    ```

    *For Linux (arm64):*

    ```bash
    TAG_URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/looker-open-source/looker-cli/releases/latest)
    TAG="${TAG_URL##*/}"
    VERSION="${TAG#v}"
    mkdir -p ~/.local/bin
    curl -fsSL "https://github.com/looker-open-source/looker-cli/releases/download/${TAG}/looker-cli_${VERSION}_linux_arm64.tar.gz" | tar -xz -C ~/.local/bin looker-cli
    chmod +x ~/.local/bin/looker-cli
    ```

    *Note: If `~/.local/bin` is not in your default `PATH`, add it to your shell
    profile or use `/usr/local/bin/` when you have write permissions there.*

#### Option B: Windows

1.  **Download and extract**: Resolve the latest release archive (use
    `windows_arm64.zip` on ARM64 Windows) and extract `looker-cli.exe`:

    ```powershell
    $tag = (Invoke-RestMethod "https://api.github.com/repos/looker-open-source/looker-cli/releases/latest").tag_name
    $ver = $tag.TrimStart("v")
    New-Item -ItemType Directory -Force -Path "$HOME\.local\bin" | Out-Null
    Invoke-WebRequest -Uri "https://github.com/looker-open-source/looker-cli/releases/download/$tag/looker-cli_${ver}_windows_amd64.zip" -OutFile "$env:TEMP\looker-cli.zip"
    Expand-Archive -Path "$env:TEMP\looker-cli.zip" -DestinationPath "$env:TEMP\looker-cli" -Force
    Move-Item -Force "$env:TEMP\looker-cli\looker-cli.exe" "$HOME\.local\bin\looker-cli.exe"
    Remove-Item -Recurse -Force "$env:TEMP\looker-cli", "$env:TEMP\looker-cli.zip"
    ```
2.  **Add to Path**: Ensure `$HOME\.local\bin` (containing `looker-cli.exe`)
    is in your system `%PATH%` (or Environment Variables).

--------------------------------------------------------------------------------

### 3. Verify the Installation

Run the help command again to verify the installation succeeded:

```bash
export PATH="$HOME/.local/bin:$PATH"
looker-cli --help
```

Confirm that the output shows the Looker CLI help menu correctly. If it fails,
check that `~/.local/bin` is included in your shell's `PATH`.
