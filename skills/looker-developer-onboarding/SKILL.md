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

| Step        | Goal          | Skill to Use                    | Success      |
:             :               :                                 : Verification :
| :---------- | :------------ | :------------------------------ | :----------- |
| **1.        | Verify system | `onboarding-preflight-check`    | Run system   |
: Pre-flight  : & gcloud      :                                 : check        :
: Check**     : prerequisites :                                 : successfully :
| **2.        | Explore       | `exploring-data-for-looker`     | Propose a    |
: Discovery** : BigQuery data :                                 : dashboard    :
:             : & define goal :                                 : goal to the  :
:             :               :                                 : user         :
| **3. CLI    | Verify        | `installing-looker-cli`         | Run          |
: Check**     : `looker` CLI  :                                 : `looker-cli  :
:             : is in `PATH`  :                                 : --help`      :
:             :               :                                 : successfully :
| **4. Auth** | Authenticate  | `authenticating-looker-cli`     | Run          |
:             : CLI via OAuth :                                 : `looker-cli  :
:             :               :                                 : user me`     :
:             :               :                                 : successfully :
| **5.        | Connect       | `connecting-looker-to-bigquery` | Run          |
: Connect**   : Looker to     :                                 : `looker-cli  :
:             : BigQuery      :                                 : connection   :
:             :               :                                 : cat {name}`  :
:             :               :                                 : successfully :
| **6.        | Create        | `setting-up-looker-project`     | Run          |
: Project**   : project &     :                                 : `looker-cli  :
:             : configure     :                                 : project cat  :
:             : bare Git      :                                 : {id}`        :
:             :               :                                 : successfully :
:             :               :                                 : (`uses_git\: :
:             :               :                                 : true`)       :
| **7.        | Write LookML, | `creating-lookml-model`         | Clean        |
: Model**     : validate &    :                                 : results &    :
:             : query         :                                 : successful   :
:             :               :                                 : inline query :
| **8.        | Create LookML | `creating-looker-dashboard`     | Imported UDD |
: Dashboard** : dashboard &   :                                 : URL &        :
:             : import UDD    :                                 : successful   :
:             :               :                                 : user sync    :
:             :               :                                 : loop         :

## Orchestration Rules

-   **Strict Sequence**: Never skip a step or execute out of order. (Sequence:
    Pre-flight, Discovery, CLI, Auth, Connect, Project, Model, Dashboard).
-   **Fail Fast**: Stop immediately if any step fails or fails verification.
-   **Interactive Steps**: Step 4 (Auth) is interactive; guide the user through
    the OAuth browser flow.

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
