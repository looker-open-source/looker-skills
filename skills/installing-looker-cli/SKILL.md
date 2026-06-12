---
name: installing-looker-cli
description: >-
  Looker Developer Onboarding: Step 2.
  Verifies that the Looker CLI is available in the PATH.
  Only execute this after Step 1 (Data Discovery using `exploring-data-for-looker`).
---

# Installing Looker CLI

Currently, the Looker CLI is assumed to be pre-installed on the system and
available in your `PATH`.

## Prerequisites

-   Looker CLI must be pre-installed by the user.

## Instructions

### 1. Verify Looker CLI Installation

Verify that the CLI is installed and accessible:

```bash
looker-cli --help
```

This should output the Looker CLI help text. If the command is not found,
instruct the user that they must install the Looker CLI to proceed.
