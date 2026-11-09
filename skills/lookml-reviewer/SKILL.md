---
type: howto
name: lookml-reviewer
title: LookML Code Review Procedure
description: >-
  Review a LookML codebase or file to confirm its compliance with official best
  practices and style guidelines using the Looker CLI (looker-cli). Use this skill
  whenever the user asks to review, audit, check, or critique LookML code or a LookML project.
tags:
  - looker
  - lookml
  - code-review
  - lams
  - best-practices
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# LookML Reviewer Skill

This skill performs a rigorous code audit on LookML files, checking them against a bundled set of best practice references and style guidelines using the Looker CLI (`looker-cli`).

## Workflow Instructions

When invoked, execute the following steps precisely:

1. **Pre-flight Guardrails & Verification**:
   Before requesting details or fetching code, verify that `looker-cli` is installed and authenticated:
   - **Verify CLI Installation**:
     Run: `looker-cli --help`
     **If the command fails or is not found**: Halt immediately and instruct the user:
     > "`looker-cli` is not installed or not in your PATH. Please refer to the installation instructions in the Looker CLI documentation: https://github.com/looker-open-source/looker-cli"
   - **Verify Authentication & Looker Configuration**:
     Run: `looker-cli user me`
     **If unauthenticated or connection fails**: Halt immediately and instruct the user:
     > "You are not authenticated to a Looker instance. Please configure and authenticate `looker-cli` using one of the following methods:
     >
     > **Method 1: Interactive OAuth (Recommended)**
     > 1. In Looker, ensure the Looker CLI connector is enabled:
     >    Navigate to **Admin** > **Platform** > **BI Connectors** > under **Developer Tools**, toggle **Looker CLI** to **ON**.
     > 2. Configure your profile and log in:
     >    ```bash
     >    looker-cli profile add default --host <your-looker-host> --port 443
     >    looker-cli profile use default
     >    looker-cli session login --oauth
     >    ```
     >
     > **Method 2: API Keys (Client ID & Client Secret)**
     > If OAuth is not enabled or for headless/service accounts:
     > ```bash
     > looker-cli profile add default --host <your-looker-host> --port 443 --client-id <CLIENT_ID> --client-secret <CLIENT_SECRET>
     > looker-cli profile use default
     > ```
     >
     > Once configured, please rerun your review request."

2. **Understand Scope & Validate Branch**:
   - Identify the Looker Instance URL (e.g., `https://<instance>.looker.com` or `https://<instance-id>.<region>.looker.app`), the Looker Project Name (e.g., `fashionly`), the target branch, and whether the user wants to review the entire project or a **single specific LookML file** (e.g., `views/order_items.view.lkml`).
   - **CRITICAL - Looker Instance URL**: If the Looker instance URL is not mentioned, you MUST ask the user to provide it before proceeding.
   - **CRITICAL**: You MUST always ask the user for the project name and branch name before proceeding, unless they explicitly provided them in their request.
   - **CRITICAL Guardrail - Branch Verification (DO NOT CREATE BRANCHES)**:
     - Ensure the session workspace is in dev mode:
       ```bash
       looker-cli session update dev
       ```
     - Check all existing branches:
       ```bash
       looker-cli project branch <project_id> --all
       ```
     - **DO NOT create a branch if it does not exist.** Never use commands or API calls that create branches.
     - **`master` / `main` Equivalence**: If the user requested `master` but only `main` exists (or vice versa), automatically map to the existing one (`main` or `master`) and inform the user.
     - **Branch Not Found**: If the specified branch (or its `master`/`main` equivalent) does not exist in the branch list, halt immediately, list the available branches to the user, and ask for clarification.

3. **Retrieve LookML Files via `looker-cli`**:
   - **Checkout Target Branch**:
     ```bash
     looker-cli project checkout <project_id> <branch_name>
     ```
     - **Conflict Guardrail**: If checkout fails due to uncommitted local changes or checkout conflicts in the current dev workspace, halt immediately. Report the conflicting files to the user and ask them to commit or discard their changes in Looker before retrying.
   - **List Project Files**: Retrieve the file listing for the project:
     ```bash
     looker-cli project file ls <project_id>
     ```
   - **Fetch File Content**:
     - **Single File Mode**: If the user explicitly mentioned a single LookML file, verify that it exists in the project file listing and retrieve only that file:
       ```bash
       looker-cli project file cat <project_id> <file_path>
       ```
       *(If the file is not found, halt, list matching project files, and ask for clarification).*
     - **Full Project Mode**: If no single file was specified, read the content of each LookML file (`*.model.lkml`, `*.explore.lkml`, `*.view.lkml`, `manifest.lkml`, and config files):
       ```bash
       looker-cli project file cat <project_id> <file_path>
       ```

4. **Analyze Codebase / Target File**:
   - Perform a comprehensive analysis of the retrieved LookML file(s) against Looker best practices (refer to the guides in `references/`: [conversational-analytics-best-practices.md](references/conversational-analytics-best-practices.md), [lams-style-guide.md](references/lams-style-guide.md), [lookml-dos-and-donts.md](references/lookml-dos-and-donts.md), [sustainable-maintainable-lookml.md](references/sustainable-maintainable-lookml.md), [playbook_lookml_quality.md](references/playbook_lookml_quality.md), and the 0–4 Transcriber Maturity Rubric in [playbook_transcriber_scoring.md](references/playbook_transcriber_scoring.md)).
   - If reviewing a single file, audit the file thoroughly (checking field definitions, primary keys, foreign keys, naming conventions, descriptions, count measure filters, and conversational analytics readiness).
   - If reviewing the full project, analyze the project as a whole to provide a holistic review (checking model-explore relationships, view joins, primary keys, symmetric aggregate `SUM(DISTINCT)` fanout prevention, datagroups, naming conventions, conversational analytics readiness, and optional 0–4 Transcriber scoring).

5. **Compile Report**: Draft a highly verbose and comprehensive review report based on your analysis. The report must contain the following sections:
   - **Summary**: A high-level summary of the health of the target file or full codebase, naming the project, branch, and target file (if single-file mode) reviewed, along with key findings.
   - **Strengths**: A bulleted list highlighting code patterns that were done exceptionally well.
   - **Improvement Points**: A highly detailed breakdown of violations organized by file. For each point:
     - Describe the violation clearly. **Do NOT explicitly list or recite the full rules in the report.**
     - Suggest exactly how to fix it (providing concrete before/after code snippets).
     - **CRITICAL**: Include the exact file path and line number(s) of the violation (e.g., `views/order_items.view.lkml:L16-L19`). Use the Looker instance URL to construct a direct link to the file in the Looker IDE: `<instance_url>/projects/<project_id>/files/<file_path>`.
6. **Print Report**: Formulate the report and print it directly in the chat or console as your primary response. Do not save it to a file or an artifact.
