---
name: looker-developer-onboarding
description: >-
  Orchestrates the entire E2E Looker developer onboarding journey.
  This is the MUST-READ parent skill that coordinates the overall process.
  Start here when beginning a new Looker setup. It guides you to act as an informative, transparent guide, leading the user in sequence through: Pre-flight, Discovery, CLI, Auth, Connect, Project, Model, Dashboard.
---

# Looker Developer Onboarding Orchestrator

This skill orchestrates the Looker developer onboarding process. You must
execute the following steps in exact sequence. Ensure each step's outcome is
verified before moving to the next.

## Step-by-Step Onboarding Sequence

| Step | Goal | Skill to Use | Success Verification |
| :--- | :--- | :----------- | :------------------- |
| **1. Pre-flight Check** | Verify system & gcloud prerequisites | `onboarding-preflight-check` | Run system check successfully |
| **2. Discovery** | Explore BigQuery data & define goal | `exploring-data-for-looker` | Propose a dashboard goal to the user |
| **3. CLI Check** | Verify `looker` CLI is in `PATH` | `installing-looker-cli` | Run `looker-cli --help` successfully |
| **4. Auth** | Authenticate CLI via OAuth | `authenticating-looker-cli` | Run `looker-cli user me` successfully |
| **5. Connect** | Connect Looker to BigQuery | `connecting-looker-to-bigquery` | Run `looker-cli connection cat {name}` successfully |
| **6. Project** | Create project & configure bare Git | `setting-up-looker-project` | Run `looker-cli project cat {id}` successfully (`uses_git: true`) |
| **7. Model** | Write LookML, validate & query | `creating-lookml-model` | Clean results & successful inline query |
| **8. Dashboard** | Create LookML dashboard & import UDD | `creating-looker-dashboard` | Imported UDD URL & successful user sync loop |

## Orchestration Rules

-   **Strict Sequence**: Never skip a step or execute out of order. (Sequence:
    Pre-flight, Discovery, CLI, Auth, Connect, Project, Model, Dashboard).
-   **Fail Fast**: Stop immediately if any step fails or fails verification.
-   **Interactive Steps**: Step 4 (Auth) is interactive; guide the user through the OAuth browser flow.

## Educational Transparency & Guidelines

Since this user has never used Looker before, act as an informative,
communicative guide. Narrate your progress and briefly explain key Looker
concepts as you work, maintaining a tight balance between education and
execution speed: - **Narrate Actions**: Before running major commands or
creating files, briefly explain what you are doing and why. - **Explain
Concepts**: When completing setup milestones (views, explores, UDD imports),
briefly explain the concept in 1–2 sentences (e.g., views map to tables). -
**Prioritize Speed**: Keep explanations extremely concise. Do not write long
paragraphs; get the user to their dashboard ASAP.
