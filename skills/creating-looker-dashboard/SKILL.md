---
name: creating-looker-dashboard
description: >-
  Looker Developer Onboarding: Step 7 (Final Step).
  Creates a LookML dashboard in the project, imports it as a user-defined dashboard (UDD) in Looker, and iteratively refines it based on user feedback by syncing changes.
  Only execute this after Step 6 (Model Setup using `creating-lookml-model`).
license: Apache-2.0
metadata:
  publisher: google
  version: v1
---

# Creating Looker Dashboard & Feedback Loop

This skill guides you through the final step of onboarding: building the target
dashboard requested by the user. You will define the dashboard as a LookML
dashboard file in the project, import it into Looker as a User-Defined Dashboard
(UDD), and iteratively update and synchronize it based on the user's feedback.

## Prerequisites

-   Looker CLI must be installed and authenticated (Step 2 & 3).
-   Looker project, connection, views, and models must be fully set up and
    validated (Step 4, 5 & 6).

## Instructions

### 1. Retrieve Dashboard Specs & Identify Target Folder

1.  Refer back to the target dashboard goal, tables, dimensions, and measures
    established with the user during the **Step 1 (Discovery)** interview in the
    conversation history (and subsequently created in **Step 7 (Model)**). You
    must recall these specifications to ensure the dashboard displays the
    correct data.
2.  Locate the target Looker **Folder ID** to place the dashboard. Since this is
    a brand-new Looker instance, we will prescriptively place the dashboard in
    the default **Shared** folder:
    -   List all folders using the Looker CLI: `looker-cli folder ls`
    -   Find the folder named `"Shared"` in the output. In a brand-new instance,
        this folder is always present and its ID is almost always `"1"`.
    -   Identify the ID of this `"Shared"` folder and use it as your target
        folder ID (which will be passed to the `folder_id` parameter in later
        steps).

### 2. Create the LookML Dashboard File (CLI)

You must define the dashboard structure as a LookML dashboard file in your
project:

1.  **Create the `dashboards` directory**: If the `dashboards/` directory does
    not yet exist in the project, create it using the Looker CLI:

    ```bash
    looker-cli project directory create {project_id} dashboards
    ```

2.  **Generate Dashboard LookML**: Write the LookML dashboard definition locally
    (e.g. to `/tmp/{dashboard_name}.dashboard.lookml`). Ensure the file uses the
    `.dashboard.lookml` extension.

3.  **Upload the Dashboard File**: Upload the file to your Looker project
    dashboards folder (path convention
    `dashboards/{dashboard_name}.dashboard.lookml`):

    ```bash
    looker-cli project file create {project_id} dashboards/{dashboard_name}.dashboard.lookml /tmp/{dashboard_name}.dashboard.lookml
    ```

4.  **Critical Inclusion Step**: You **MUST** include the dashboard files in
    your LookML model file (`{model_name}.model.lkml`) so they can be discovered
    by the project validator and the CLI import/sync commands:

    ```lkml
    include: "/dashboards/**/*.dashboard.lookml"
    ```

5.  Inside the dashboard file, write the LookML dashboard definition,
    configuring tiles (elements) that display the dimensions and measures you
    created in Step 7. It is highly recommended to use **`layout: newspaper`**
    (which supports grid coordinates `row`, `col`, `width`, and `height` out of
    24 columns) to prevent import errors that can happen with older `layout:
    grid` row groupings.

*Example Dashboard LookML (`layout: newspaper`):*

```yaml
- dashboard: sales_performance
  title: Sales Performance Overview
  layout: newspaper
  preferred_viewer: dashboards-next

  elements:
    - name: total_revenue_tile
      title: Total Revenue Over Time
      model: ecommerce
      explore: orders
      type: looker_line
      fields: [orders.created_date, orders.total_revenue]
      sorts: [orders.created_date desc]
      limit: 500
      row: 0
      col: 0
      width: 12
      height: 8

    - name: order_count_tile
      title: Top Countries by Orders
      model: ecommerce
      explore: orders
      type: looker_column
      fields: [users.country, orders.count]
      sorts: [orders.count desc]
      limit: 10
      row: 0
      col: 12
      width: 12
      height: 8
```

*Note: Make sure the `model` and `explore` properties on each tile match the
model and explore names defined in your project, and the `fields` use fully
qualified `view_name.field_name` formats.*

### 3. Validate and Commit LookML

Validate the project to ensure the dashboard syntax is perfect and has no
reference errors:

```bash
looker-cli api project validate_project {project_id}
```

If errors are returned, fix the LookML dashboard definition and re-validate
until clean.

### 4. Import LookML Dashboard as UDD (CLI)

Import the LookML dashboard into your target Folder as a User-Defined Dashboard
(UDD). This converts it from a static file into a database-backed dashboard in
Looker.

1.  Construct the `lookml_dashboard_id` in the format
    `{model_name}::{dashboard_name}` (e.g. `ecommerce::sales_performance`).
2.  **Ensure Dev Mode Workspace Context**: By default, Looker CLI sessions
    execute in the production workspace. Since your newly created dashboard
    exists only in Development Mode, you **MUST** switch the CLI session to the
    dev workspace immediately prior to importing/syncing. Chain the session
    update command to the import command:

    ```bash
    looker-cli session update dev && looker-cli dashboard import lookml {model_name}::{dashboard_name} {folder_id}
    ```

3.  The command will return a JSON object containing the details of the imported
    UDD. Record the dashboard numeric `id` (e.g., `45`) or `slug` from the
    response.

### 5. Validate Dashboard Content (SQL Query Verification Check)

Looker's project validation only checks LookML syntax—it does **not** verify if
the SQL queries for each tile execute successfully against the database. To
guarantee that the dashboard is 100% free of query errors before presenting it
to the user, you **MUST** retrieve and execute the query behind every single
dashboard tile:

1.  Retrieve the dashboard element details (specifically targeting `query_id`)
    for your newly imported UDD dashboard:

    ```bash
    looker-cli dashboard cat {udd_id} --fields "dashboard_elements(query_id)"
    ```

2.  For each unique `query_id` returned in the JSON results (excluding any null
    values from text tiles), execute the query to verify database correctness:

    ```bash
    looker-cli query runquery {query_id}
    ```

3.  Verify that each query executes successfully and returns data without SQL or
    database errors. If any query fails (indicating a database column mismatch,
    bad SQL dialect function, or GCP permission issue), you **MUST** resolve the
    issue in your LookML views, commit the changes, re-run `looker-cli api
    project validate_project {project_id}`, synchronize using `looker-cli
    dashboard sync lookml`, and re-verify using this sequence until all queries
    execute successfully.

### 6. Present and Iterate with User (Interactive Step)

1.  Present the imported dashboard link to the user:
    `{instance_url}/dashboards/{udd_id}` (or `/dashboards-next/{udd_id}`).
2.  **STOP AND ASK** the user for feedback on the layout, chart types, or
    labels:

    > "I have successfully built and imported your new dashboard! You can view
    > it here: {dashboard_url}
    >
    > Does this look good to you? Let me know if you'd like me to change any
    > chart types, add new metrics, or adjust the layout!"

3.  **STOP AND WAIT** for the user's response. Do not call any tools.

### 7. Refine and Synchronize Changes

If the user requests changes to the dashboard (e.g., "make the order count a bar
chart instead of column," or "add a filter"):

1.  Edit your local LookML dashboard file and update it on the Looker server:

    ```bash
    looker-cli project file update {project_id} dashboards/{dashboard_name}.dashboard.lookml /tmp/{dashboard_name}.dashboard.lookml
    ```

2.  Validate the project:

    ```bash
    looker-cli api project validate_project {project_id}
    ```

3.  Propagate your changes directly to the imported UDD dashboard using the CLI
    sync command:

    ```bash
    looker-cli dashboard sync lookml {model_name}::{dashboard_name}
    ```

4.  **Re-run Query Validation**: Run the query verification check again to
    ensure your refinements did not introduce any new SQL or database errors:

    -   Fetch the UDD elements again (to capture any new tile queries): `looker
        dashboard cat {udd_id} --fields "dashboard_elements(query_id)"`
    -   For each returned `query_id`, run the query to verify SQL correctness:
        `looker-cli query runquery {query_id}`

5.  Ask the user to refresh their browser and review the changes. Repeat this
    loop until the user is fully satisfied!
