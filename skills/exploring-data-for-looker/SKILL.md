---
name: exploring-data-for-looker
description: >-
  Looker Developer Onboarding: Step 1.
  Guides the agent to explore BigQuery data and define the onboarding goal.
  This is the first active step, to be executed immediately after reading the parent orchestrator `looker-developer-onboarding`.
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Onboarding Interview & Data Exploration

This skill guides you through the initial phase of onboarding a Looker user:
interviewing them to understand their goals, and exploring their BigQuery data
to identify a good candidate for a dashboard.

## Prerequisites

-   The user must have a fresh Looker Core instance.
-   The user must have `gcloud` installed and authenticated to GCP.

## Instructions

### 1. Interview the User (Blocking Step)

You MUST start by interviewing the user to understand their goals and get the
target GCP project and dataset. DO NOT run any `gcloud` or `bq` commands before
asking these questions and receiving the user's explicit response.

Propose a set of questions like:

> "Welcome to Looker! To help you get started, I'll guide you through connecting
> your data, setting up a project, and building your first dashboard.
>
> To make sure we build something highly relevant to you, could you tell me: 1.
> What is the main goal of your Looker exploration? (e.g., Sales analysis, User
> behavior, Inventory tracking, Support metrics) 2. Which BigQuery project and
> dataset contains the data you want to use? 3. Are there specific metrics
> (e.g., total revenue, active users) or dimensions (e.g., product category,
> region) you are most interested in?"

**STOP AND WAIT** for the user to reply. Do not call any tools in this turn.

### 2. Explore BigQuery Data

Only after the user has responded to your interview questions with the target
project/dataset, proceed to explore their BigQuery data using the `bq` CLI.

> [!IMPORTANT] **Do NOT assume any table naming conventions** (such as `dim_` or
> `fct_` prefixes). While some datasets use them, many do not. You must identify
> dimension and fact tables by analyzing their schema (columns, types) and
> content, not just their names.

1.  **List Datasets** in the project:

    ```bash
    bq ls --project_id={gcp_project_id}
    ```

    Look for datasets that match the user's business area (e.g., `ecommerce`,
    `analytics`).

2.  **List Tables** in the selected dataset:

    ```bash
    bq ls {gcp_project_id}:{dataset_name}
    ```

    Identify candidate tables:

    -   **Dimension tables** contain reference or lookup data (e.g., `users`,
        `products`, `categories`, `locations`). Look for tables that describe
        entities.
    -   **Fact tables** contain transactional or event data (e.g., `orders`,
        `order_items`, `events`, `sessions`, `payments`). Look for tables that
        contain numeric metrics and timestamps.

3.  **Examine Table Schemas** for key candidate tables:

    ```bash
    bq show --format=prettyjson {gcp_project_id}:{dataset_name}.{table_name}
    ```

    Look for timestamps, numeric fields for aggregations, and foreign keys that
    link tables.

### 3. Propose the Onboarding Goal

Based on the user's input and your data exploration, propose a specific,
actionable dashboard goal.

Example proposal:

> "I've explored your dataset `{dataset_name}` and found some great tables: -
> `{table_1}` (contains transactional data with revenue and timestamps) -
> `{table_2}` (contains product dimensions like category and brand)
>
> I propose we target a **Sales Overview Dashboard** as our onboarding goal. It
> will include: 1. **Total Revenue** over time (daily/weekly). 2. **Top Product
> Categories** by sales volume. 3. **Order Status Distribution** (e.g.,
> completed, pending, cancelled).
>
> If this sounds good, I will proceed with setting up the Looker CLI and
> connecting this data!"
