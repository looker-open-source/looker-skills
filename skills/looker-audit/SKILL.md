---
name: looker-audit
description: >-
  Audits a Looker instance for performance, governance, and cleanup opportunities.
  Use when analyzing dashboard performance, identifying anti-best practices,
  checking for excessive table calculations, or auditing datagroup health.
  Don't use for general Looker onboarding or creating new dashboards.
---

# Looker Audit & Health Check

This skill guides you through auditing a Looker instance using `looker-cli` and System Activity to identify performance bottlenecks, governance gaps, and cleanup opportunities. It flags the violation of best practices and suggests optimal fixes e.g. code snippets or step-by-step guide. 

> [!IMPORTANT]
> ## ⚠️ Rules of Engagement (CRITICAL)
> 1. **Strictly API/CLI Only**: All operational auditing MUST be done via `looker-cli` or System Activity.
> 2. **NO Local Filesystem Scans**: Do **NOT** use `find`, `grep`, `ls`, `code_search`, or `find_by_name` to search the local filesystem (e.g., `google3/`). You are auditing a remote/containerized instance.
> 3. **Immediate Action**: Run your first `looker-cli` or API command in **Step 1**. Do not waste turns exploring directories.
> 4. **File Paths and Content via API Only**: If you need to identify file paths, line numbers, or read file content, you **MUST** use `looker-cli api project all_project_files [project_id]` or `project_file`. Do **NOT** use local filesystem tools to find or read them.
>    - **Scaling Guardrail**: Before running loops over project files, you MUST check the total number of files. If the total number of view files exceeds **50**, you **MUST ask the user** to specify which projects or files should be prioritized. Do NOT proceed with exhaustive loops on large codebases without explicit user direction.
> 5. **Graceful Degradation**: If the API fails to return file paths or details (e.g., 404), **STOP**. Report the violation using the identifiers you have (View Name, Model Name, Dashboard ID). Do **NOT** pivot to local filesystem searches.
> 6. **No Custom Pipelines**: Use inline queries directly. Do **NOT** write Python scripts or pipelines.
> 7. **Comprehensive Checklist Coverage**: You **MUST** execute queries and review **ALL** sections defined in the **Audit Checklist**. Do NOT skip sections unless explicitly instructed by the user. Thoroughness is critical.


## 🔍 Step 0: Looker CLI Setup & Connection Verification
Before starting any audit, ensure `looker-cli` is installed, configured for the target instance host, and authenticated.
### 1. Installation Verification
Verify that `looker-cli` (or `looker`) is installed and accessible in `PATH`:
```bash
which looker-cli || which looker
```

> [!IMPORTANT]
> If looker-cli is not installed or not found in PATH, you MUST stop and set it up using the installing-looker-cli skill.

### 2. Profile Verification & Selection
Check configured profiles and switch to the profile corresponding to your target Looker instance URL:

```bash
looker-cli profile ls
looker-cli profile use [target_profile_name]
```

### 3. Authentication Check
Confirm active authentication with the target Looker instance:

```bash
looker-cli user me
```

> [!IMPORTANT]
> If this command fails (e.g., token expired or unauthorized), you MUST stop and authenticate using the authenticating-looker-cli skill.

# 🔁 Execution Workflow

Follow this three-tiered audit strategy to move from symptoms to structural root causes: 

1. **High-level Health audits**: Use Pulse/Vacuum commands for a broad, fast initial assessment (e.g., "Is the instance healthy? What are the top 5 slow things?").
2. **Drill-down review**: Use System Activity Inline Queries (refer to audit checklist below) for deep drill-downs, specific timeframes (e.g., 90 days vs 7 days), or custom filtering (e.g., filtering by a specific user or custom thresholds).
   - **Actionable Transition**: If `pulse dashboard-performance` flags a slow dashboard, **THEN** use the **Dashboard Average Runtime** query to drill down.
3. **Root-Cause Telemetry over Static Metrics**: Do not simply flag an issue. When a bottleneck is identified, immediately trace the root cause by cross-referencing relevant areas and identify what is causing latencies or failures (e.g. tile bloat, un-cached Explores, or missing required partition filters) to help guide developers to fix the underlying LookML.
   - **Actionable Transition**: If average runtime is high, **THEN** check **Tile Bloat (Heavy Dashboards)**, **Dynamic Fields**, or **Merged Queries**.
   - **LookML Inspection**: If LookML issues are suspected, you **MUST** provide full paths to the files (discovered via API as per Rule 4).



## ⚡ High-level Health Audits
Before running detailed custom queries, you can use pre-packaged `looker-cli health` commands for a rapid overview of instance health. These are often faster than inline queries for a quick pulse check.

- **Dashboard Performance**: Find dashboards with queries slower than 30 seconds in the last 7 days.
  ```bash
  looker-cli health pulse dashboard-performance
  ```
- **Dashboard Errors**: Check for dashboards with erroring queries in the last 7 days.
  ```bash
  looker-cli health pulse dashboard-errors
  ```
- **Slow Explores**: Identify the slowest explores in the past 7 days.
  ```bash
  looker-cli health pulse explore-performance
  ```
- **Schedule Failures**: Quick check for failing schedules.
  ```bash
  looker-cli health pulse schedule-failures
  ```
- **Database Connections**: Verify connection status and query volume. Look for high latency (> 5 seconds), large result sets (> 1M rows), or stale tests.
  ```bash
  looker-cli health pulse db-connections
  ```


## 📋 Audit Checklist

> [!TIP]
> **Avoid Limit Truncation (CRITICAL)**: Many System Activity queries below use a `limit` to prevent excessive output. To get the **exact total count** for reporting, you **MUST** run a separate query selecting only the `count` measure (e.g., `user.count`) with the same filters, or count the results in bash/jq if applicable. Do NOT just report the number of rows returned if it matches the limit.


### 1. Dashboard and Looks Health & Complexity
Excessive complexity on dashboards leads to browser lag and poor user experience. Look for dashboards with > 20 tiles or average query times > 30 seconds.

- **Tile Bloat (Heavy Dashboards)**: Identify dashboards with excessive tiles (> 25).
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id"],"filters":{"dashboard_element.count":">25"}}' | looker-cli api query run_inline_query json - | jq 'length'
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","dashboard_element.count"],"filters":{"dashboard_element.count":">25"},"sorts":["dashboard_element.count desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```


- **Auto-Refresh**: Identify dashboards running unnecessary auto refresh.
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.count"],"filters":{"dashboard.refresh_interval_ordered":"NOT NULL","dashboard.moved_to_trash":"No"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.title","dashboard.refresh_interval_ordered","user.name","dashboard.id","dashboard_element.count","dashboard_element.count_text","dashboard_element.total_query_tiles"],"filters":{"dashboard.refresh_interval_ordered":"NOT NULL","dashboard.moved_to_trash":"No"},"sorts":["dashboard.refresh_interval_ordered"],"limit":"100"}' | looker-cli api query run_inline_query json - | jq
    ```

- **Dynamic Fields**: Excessive dynamic fields (Table Calculations, Custom Fields) bypass LookML governance and strain browser memory.
  - **CRITICAL**: Do NOT scan LookML files for these; they are defined at the dashboard/tile level. You **MUST** use this **System Activity Inline Query** exclusively.
  - **Concern Thresholds**: > 2 per tile.
  - **Total Count of Dashboards**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id"],"filters":{"query.count_of_dynamic_fields":">2"}}' | looker-cli api query run_inline_query json - | jq 'length'
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","query.count_of_dynamic_fields"],"filters":{"query.count_of_dynamic_fields":">2"},"sorts":["query.count_of_dynamic_fields desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```

- **Merged Queries**: Merged queries bypass LookML joins and can be slow. Identify dashboards and Looks currently using them.
  - **Total Count of Dashboards**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.count"],"filters":{"result_maker.is_merge_query":"Yes","dashboard.moved_to_trash":"No"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title","dashboard_element.id","result_maker.merge_query_id"],"filters":{"result_maker.is_merge_query":"Yes","dashboard.moved_to_trash":"No"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```

- **Dashboard Average Runtime**: Drill down into average runtime of top 10 dashboards to investigate dashboard's latency.
  ```bash
  echo '{"model":"system__activity","view":"dashboard_performance","fields":["dashboard.title","dashboard_history_stats.avg_runtime"],"sorts":["dashboard_history_stats.avg_runtime desc"],"limit":"10"}' | looker-cli api query run_inline_query json - | jq
  ```

### 2. Query Performance
Identify slow queries across Explores, Dashboards, and Looks to pinpoint optimization targets.

- **Slow Queries (Last 30 Days)**: Find queries taking longer than 10 seconds.
  ```bash
  echo '{"model":"system__activity","view":"history","fields":["history.created_time","history.source","history.runtime","query.model","query.view","user.name"],"filters":{"history.runtime":">10","history.created_date":"30 days","history.source":"explore,dashboard,look"},"sorts":["history.runtime desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### 3. Pipeline & Cache Health

Ensure data is moving and caching efficiently. Check for stale data (models where max build time is older than DB's max update time).

- **Failed Datagroups**:
  - **Workflow**: First, check the operational status via the API or System Activity. If failures are found, **then** inspect the LookML definition to suggest fixes. Do NOT scan LookML files to find failures.
  ```bash
  # Check via Looker API
  looker-cli api datagroup all_datagroups | jq '.[] | select(.trigger_error != null) | {name: .name, model: .model_name, error: .trigger_error}'

  # Check via System Activity inline query
  echo '{"model":"system__activity","view":"datagroup","fields":["datagroup.name","datagroup.model_name","datagroup.trigger_error"],"filters":{"datagroup.trigger_error":"-NULL"}}' | looker-cli api query run_inline_query json - | jq
  ```
- **Failed PDTs**:
  - **Workflow**: Check operational status via System Activity first. When failures are identified, fetch the view definition (`looker-cli project file cat [PROJECT] [PATH]`) to diagnose root cause.
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"pdt_event_log","fields":["pdt_event_log.count"],"filters":{"pdt_event_log.action":"%error%","pdt_event_log.created_date":"24 hours"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"pdt_event_log","fields":["pdt_event_log.view_name","pdt_event_log.model_name","pdt_event_log.action","pdt_event_log.error_reason","pdt_event_log.created_time"],"filters":{"pdt_event_log.action":"%error%","pdt_event_log.created_date":"24 hours"},"sorts":["pdt_event_log.created_time desc"]}' | looker-cli api query run_inline_query json - | jq
    ```
  - **🔍 PDT Error Diagnosis Checklist**:
    1. **Unscoped Table References**: Hardcoded `FROM table_name` in derived table SQL instead of `${view_name.SQL_TABLE_NAME}` (causes `Dataset ... not found` errors in BigQuery).
    2. **Non-Portable SQL Functions**: Dialect-specific functions (e.g. `CURDATE()` vs `CURRENT_DATE()`).
    3. **Invalid Datagroup Triggers**: `datagroup_trigger` referencing a broken or non-existent datagroup.

- **Cache Efficiency (Cache Hits vs Live Queries)**: Check the ratio of cache hits. Target > 50% for standard dashboards.
  ```bash
  echo '{"model":"system__activity","view":"history","fields":["history.result_source","history.query_run_count"],"pivots":["history.result_source"],"filters":{"history.result_source":"-NULL","history.created_date":"30 days"},"sorts":["history.result_source"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
  ```

### 4. LookML Code Quality & Anti-Patterns (Remote Static Analysis)
Scan remote LookML project files for anti-patterns using `looker-cli`.

#### 🔍 Prioritization & Scaling Guardrails
1. **Identify Top Models**:
   ```bash
   echo '{"model":"system__activity","view":"history","fields":["query.model","history.query_run_count"],"sorts":["history.query_run_count desc"],"limit":"10"}' | looker-cli api query run_inline_query json - | jq
   ```
2. **Map Models to Projects**: Use `looker-cli api lookmlmodel all_lookml_models` to map high-usage models to project names. Focus static audit on the top 3 projects.
3. **Scaling Guardrail**: For each project, count files (`looker-cli api project all_project_files [PROJECT_ID] | jq '[.[] | select(.type=="view")] | length'`). If > **50**, **MUST ask the user** if they want to prioritize specific LookML files before running exhaustive loops.

#### ⚡ Optimized Single-Pass Inspection Loop
To minimize API requests, run Looker's validator and execute a **single combined iteration loop** per project across all `.lkml` files:

```bash
proj="[PROJECT_ID]"
echo "=== Auditing Remote LookML for Project: $proj ==="

# 1. Run built-in Looker validator
looker-cli api project validate_project "$proj" | jq

# 2. Single-pass inspection over all LKML files (with line numbers)
for file in $(looker-cli api project all_project_files "$proj" | jq -r '.[] | select(.extension==".lkml") | .path'); do
  content=$(looker-cli project file cat "$proj" "$file")
  
  # Wildcard Includes (Model files)
  echo "$content" | grep -n -iE 'include:\s*"*\*\.view' && echo "  └─ ⚠️ Wildcard include in $file"
  
  # Missing Primary Keys (View files)
  if [[ "$file" == *.view.lkml ]]; then
    echo "$content" | grep -q "primary_key:\s*yes" || echo "  └─ ⚠️ Missing primary key in $file"
  fi
  
  # Number Type for ID Dimensions
  echo "$content" | grep -n -iE "dimension:\s*[a-zA-Z0-9_]*id" -A 5 | grep -i "type:\s*number" && echo "  └─ ⚠️ Number ID dimension in $file"
  
  # Hardcoded Database References
  echo "$content" | grep -n 'sql:' | grep -v '\${' | grep '\.' && echo "  └─ ⚠️ Hardcoded DB ref in $file"
done
```

#### 📦 Unused LookML Projects (No Queries in 1 Year / 365 Days)
Identify LookML models and projects that have received **0 query executions in the last 1 year (365 days)** and should be considered for archiving or deletion:

```bash
# 1. Fetch query counts and last query date per model in the past 365 days
echo '{"model":"system__activity","view":"history","fields":["query.model","history.query_run_count","history.most_recent_query_date"],"filters":{"history.created_date":"365 days"},"sorts":["history.query_run_count asc"],"limit":"500"}' | looker-cli api query run_inline_query json - | jq

# 2. List all configured models and map to project names
looker-cli api lookmlmodel all_lookml_models | jq -r '.[] | {model: .name, project: .project_name}'
```

#### 🔍 Unused Fields & Views (Zero Usage Across Explores)
Identify LookML fields and views that have **0 usage across all Explores in the last 90 days**:

```bash
echo '{"model":"system__activity","view":"field_usage","fields":["field_usage.explore","field_usage.view","field_usage.field","field_usage.times_used"],"filters":{"field_usage.times_used":"0"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
```

> [!NOTE]
> **Audit Guidance**: Flag models/projects with **0 queries in 365 days** as primary candidates for archiving or deletion. Exclude core `system__activity` models and active Marketplace extension applications (`marketplace_*` / extension models).


### 5. User, Content, and Schedule Management
Audit the instance for inactive assets, orphaned schedules, and schedule hotspots using System Activity. Look for high-volume schedules (> 1/hr) or stale schedules (not run in 30 days).

- **Inactive Accounts (No Login in 90 Days)**:
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"user","fields":["user.count"],"filters":{"user_facts.last_ui_login_date":"before 90 days ago","user.is_disabled":"No"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"user","fields":["user.created_date","user.id","user.name","user_facts.last_ui_login_credential_type","user_facts.last_ui_login_date","history.most_recent_query_date"],"filters":{"user_facts.last_ui_login_date":"before 90 days ago","user.is_disabled":"No"},"sorts":["user.created_date desc"],"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```


- **Inactive Content (Dashboards and Looks Not Queried in 60 Days)**:
  - **Audit Note**: If the title suggests it is an **Annual** or **Quarterly** report, flag this in the audit report so the reviewer can take it into account before deleting or archiving.
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"content_usage","fields":["content_usage.content_count"],"filters":{"content_usage.days_since_last_accessed":">=60","content_usage.dashboard_deleted":"No","content_usage.look_deleted":"No"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"content_usage","fields":["content_usage.content_id","content_usage.content_title","content_usage.content_type","content_usage.api_total","content_usage.embed_total","content_usage.favorites_total","content_usage.other_total","content_usage.schedule_total"],"filters":{"content_usage.days_since_last_accessed":">=60","content_usage.dashboard_deleted":"No","content_usage.look_deleted":"No"},"limit":"100"}' | looker-cli api query run_inline_query json - | jq
    ```


- **Draft/Test/Copy Content (Dashboards)**:
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.count"],"filters":{"dashboard.title":"%test%,%copy%,%draft%","dashboard.moved_to_trash":"No"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"dashboard","fields":["dashboard.id","dashboard.title"],"filters":{"dashboard.title":"%test%,%copy%,%draft%","dashboard.moved_to_trash":"No"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```

- **Draft/Test/Copy Content (Looks)**:
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"look","fields":["look.count"],"filters":{"look.title":"%test%,%copy%,%draft%","look.deleted_date":"NULL"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"look","fields":["look.id","look.title"],"filters":{"look.title":"%test%,%copy%,%draft%","look.deleted_date":"NULL"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```


- **Schedule Hotspots (Peak Hours)**: Identify hours of the day with excessive scheduled jobs.
  ```bash
  echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_job.created_hour_of_day","scheduled_job.count"],"sorts":["scheduled_job.count desc"],"limit":"24"}' | looker-cli api query run_inline_query json - | jq
  ```

- **Failing Schedules**:
  - **Total Count of Failed Jobs**:
    ```bash
    echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_job.count"],"filters":{"scheduled_job.status":"failure"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.id","scheduled_plan.name","scheduled_job.status","scheduled_job.status_detail"],"filters":{"scheduled_job.status":"failure"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```


- **Orphaned Schedules (Owner is Disabled)**:
  - **Total Count**:
    ```bash
    echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.count"],"filters":{"user.is_disabled":"Yes"}}' | looker-cli api query run_inline_query json - | jq
    ```
  - **Details**:
    ```bash
    echo '{"model":"system__activity","view":"scheduled_plan","fields":["scheduled_plan.id","scheduled_plan.name","user.name"],"filters":{"user.is_disabled":"Yes"},"limit":"50"}' | looker-cli api query run_inline_query json - | jq
    ```


> [!NOTE]
> **Definition-Based Analysis via CLI**: You can also use `looker-cli api scheduledplan all_scheduled_plans` to inspect schedule definitions directly. This is useful for analyzing `crontab` patterns to detect hotspots or checking `user_id` to identify potentially orphaned schedules (cross-reference with disabled users). However, to check **historical failures or execution history**, you MUST use the System Activity `scheduled_job` queries above.

## 📝 Reporting Guidelines & Bespoke Recommendations  

When compiling the audit report, ensure that **Recommendations & Best Practices** is **NOT generic**. It must be bespoke to the findings and provide specific examples or snippet code, and explit link to dashboards/ folder/ lookml files where relevant.

- **Report naming rule**: The report artifact MUST be named using the convention `audit_report_[instance_name]_[timestamp].md` (e.g., `audit_report_gcpl264_202607091530.md`). Sanitize the instance name to remove special characters and **ensure there are NO spaces in the file name** (use underscores `_` instead). Use a clean timestamp format.
- **Report Metadata**: At the top of the report, you **MUST** include key details:
  - **Timestamp**: The exact date and time when the audit was performed in a user-friendly format (e.g., `2026-07-09 5:30PM`).
  - **Looker Instance**: The URL of the Looker instance.
  - **Auditor**: The name of the AI tool and the model used.
- **Prioritize Findings (CRITICAL)**: Assign a priority (**High**, **Medium**, or **Low**) to each finding based on its impact on performance, stability, or governance.
  - 🔴 **High Priority**: Immediate impact on performance or stability. Examples: Failing PDTs, systemic query errors, extreme dashboard latency (> 30s), broken datagroups.
  - 🟡 **Medium Priority**: Moderate impact or future risks. Examples: Slow Explores (10-30s), Tile Bloat (> 25 tiles), Dynamic Field abuse, Merged Queries, Orphaned Schedules.
  - 🟢 **Low Priority**: Cleanup and hygiene. Examples: Inactive accounts, inactive content, "Test/Copy" files/dashboards, non-critical schedule hotspots.
- **Quantify Findings (CRITICAL)**: Do NOT use vague terms like "many" or "several". You **MUST** state the exact count of items found (e.g., "42 inactive accounts", "18 dashboards with 'test' in title").
- **Illustrate with Examples**: In the findings, provide specific examples of content names, user names, field names, or project names to make the issue concrete (e.g., "61 inactive accounts, such as `John Doe` and `Jane Smith`", or "18 test dashboards, including `[Test] Revenue Dashboard`").
- **Detail Schedule Hotspots**: When reporting schedule hotspots, specify the exact hour(s) and the volume of jobs (e.g., "Hotspot identified at **8:00 AM** with **150 scheduled jobs**").
- **Avoid Generic Statements**: Do not just say "Enforce Primary Keys". Instead, say "View `orders` in project `X` is missing a primary key. Add `primary_key: yes` to dimension `id`."
- **Mandatory Actionability for Every Finding**: Every finding or recommendation **MUST** be accompanied by at least one of the following:
  - An example **LookML code snippet** demonstrating the fix.
  - The exact **`looker-cli` command** (or inline query JSON) that can be run to identify the full, detailed list of items to review.
  - Specific instructions on how to replicate the query in **System Activity** (exact fields and filters) with URL link to the System Activity Explore in Looker instance.
  - Generic advice (e.g., "Optimize LookML") without these supporting details is **UNACCEPTABLE**.
- **Contextualize**: Link the recommendation to the specific metric or error found (e.g., "The explore `unoptimized_orders_simulation` is slow because of X. Optimize it by Y...").
- **Direct References**: You **MUST** generate explicit hyperlinks for all findings, recommendations, and LookML files mentioned in the report. Use the Looker instance URL base, file paths, and line numbers discovered during the audit to construct direct URL links to the Looker UI. Example:
  * **User-Defined Dashboard (UDD)**: `https://[instance-url]/dashboards/[dashboard_id]`
  * **LookML Dashboard**: `https://[instance-url]/dashboards/[model_name]::[dashboard_name]`
  * **LookML IDE File & Line**: `https://[instance-url]/projects/[project_id]/files/[file_path]#L[line_number]`
  * **System Activity Explore**: `https://[instance-url]/explore/system__activity/[view_name]`

## 🛡️ Best Practices & Gotchas

- **Piping JSON**: Always use `echo '...' | looker-cli ... json -` to pass inline JSON to `run_inline_query`. Do NOT pass the JSON string directly as an argument, or you will get a "file name too long" error.
- **Filter Wildcards**: Use `%` (SQL style) instead of `*` for string filters in `run_inline_query` on System Activity (e.g., `%error%`).
- **Holistic Review**: You must analyze the instance or repositories as a whole to provide a holistic review.
- **Anti-Hallucination Guardrail**: NEVER hallucinate or assume data. Always run the query first and report only the actual results. If no data matches, report that explicitly.

## 📚 References

- **Looker Performance Audit Guide**: [performance_audit_guide.md](references/performance_audit_guide.md)

