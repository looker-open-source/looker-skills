# Reference: Looker Performance Audit

Conduct Looker audit by leveraging the System Activity dashboards and Explores to make observations and provide recommendations against Looker’s best practices. Prioritise cost impact, isolate issues and clean up the bloat. Health check or similar review should be performed every 12 months, covering:

1. Query performance
2. Content performance
3. LookML review
4. User activity
5. PDTs and Schedules

The Looker query execution lifecycle is divided into four distinct, sequential phases that track the journey of a query from LookML compilation to final browser rendering:

| Execution Phase | Core Actions & Purpose | Where to Optimize |
| :--- | :--- | :--- |
| **1. Preprocessing / Initialization (Pre)** | Looker loads the semantic model, validates the LookML structure, and compiles the semantic definitions into raw SQL. | **Semantic Layer & Files:** Explicitly include necessary views instead of using wildcards (include: "*.view"), and adopt a clean, modular project structure to speed up compiler times. |
| **2. Connection Handling (Queued)** | The compiled query waits in Looker's internal queue for a database connection thread to open, then retrieves credentials to establish the connection. | **Concurrency & Cache:** Keep dashboards below the recommended 25-tile threshold. Optimise shared cache e.g. avoid applying dynamic user attributes to raw JDBC connection strings, which breaks the cache pool per user. |
| **3. Main Query Execution (SQL Running)** | The database warehouse (such as BigQuery or Redshift) executes the SQL, builds any required Persistent Derived Tables (PDTs), and returns results. | **Database Performance:** Materialize data upstream during ETL/ELT where relevant, apply partition and clustering keys to PDTs, and configure Aggregate Awareness. |
| **4. Post-Processing (Post)** | Looker formats the raw database results in-memory, processes custom calculations, and streams the finished data to the user's browser. | **Client-Side Overhead:** Minimize client-side browser calculations. Move table calculations, custom fields, and browser-side "Merged Queries" into native LookML dimensions and SQL-level joins. |

## Analyse Dashboard and Looks Performance

- **Identify the slowest dashboards**: find dashboards and looks run in the past 30 days where the total loading time for dashboards is >30 seconds, flag for critical review. If 10-30 seconds, flag as needing review - at risk of users abandoning dashboards.

*(Use `SKILL.md` for actionable CLI commands to check this)*

- **Heavy Dashboards:** use Dashboard System Activity Explore to check “Heavy Dashboards” (dashboard with more than 25 tiles). Flag in the report for review.
- **Refresh interval:** check for dashboards with auto refresh on and review the refresh interval is no shorter than ETL process update interval. If a short interval is set e.g. minutes or seconds, immediately flag in the report.
- **Dynamic Fields or merge queries:** check for dashboards with merge queries, or dynamic fields (Custom Fields or Table Calculations). 
  1. If >3 tiles (dashboard elements) using dynamic fields, the logic is too complex and should be pushed to LookML or derived tables.
  2. If >10 dynamic fields per dashboard, indicates there are too many un-governed logic used in the dashboard and is “hacky”
  3. If row limit >2000 + dynamic field used, flag as a high risk for browser lag.
  4. If using merge queries, flag to refactor LookML model to join natively in SQL

*(Use `SKILL.md` for actionable CLI commands to check merged queries)*

## Analyse Query Performance

- Using system activity explore, filter for queries with user sources: Explores, Dashboards and Looks, if **query execution time is >10 seconds over the past 30 days**.
  - **Find the query slug:** Using History Explore, identify the **exact slug** for the slow query and use the Query Performance Metrics explore to find the underlying BigQuery Job ID
  - **Run Job Inspection:** Load the **Job ID** into the Looker Job Inspection block and analyze the stages. E.g. Stage SO2: Input executing a massive LEFT JOIN triggering GB of Shuffle Spilled Bytes and causing long wait time.

- **Recommendations:**
  - **Joins:** 
    - Refactor data joins into a granular many_to_one orientation (Looker can run simpler and faster native SQL without leveraging Symmetric Aggregates).
    - Avoid full outer join as this forces Looker to scan both entire tables and ignores partition and cluster pruning on both sides of the join.
  - **Aggregation:**
    - Implement **Aggregate Awareness** to build database roll-ups for high-volume tiles e.g. raw records to the daily or hourly granularity.
  - **Manipulation in Primary key:** Check for any dynamic function e.g. ROW_NUMBER() or concatenation in primary keys defined directly in LookML views - this forces Looker to execute manipulation on every single row inside subqueries. Recommend using base database joins instead (in upstream ETL pipeline) or inside a Persistent Derived Table. 
  - **Filtering Data:** Check for SQL antipatterns e.g. using LIKE operator instead of a direct equal operator. The wildcard forces the database to read through every record to perform regex-style string evaluation, instead of leveraging fast lookup in the clustered or partition block.
  - **Dropdown filter suggestion:** For high-volume columns (e.g. user_id, transaction_id, etc), set suggest_persist_for: "24 hours" or entirely disable suggestions using suggestable: no on the dimension to present running heavy SELECT DISTINCT on high-cardinality columns

## LookML Code review

- Best practices to review:
  - **Refinements Over Extends:** Minimize the use of extends which creates duplicate objects, drives LookML model bloat, and slows down the LookML Validator. Prioritize LookML refinements to adapt Views and Explores cleanly in-place.
  - **Strict Include Rules:** Avoid using wildcard “include” statements (e.g., include: "*.view") in model files. Explicitly define only the view files needed for the explores in that model to decrease validation and pre-query processing times.
  - **Enforce Primary Key:** Require a defined primary key (primary_key: yes) on every view and derived table. Lack of primary keys throws validation errors, disrupts symmetric aggregation, and produces mathematically incorrect calculations.
  - **DRY Field Substitution Syntax:** Avoid referencing raw database columns (e.g., ${TABLE}.column) inside measure calculations. Enforce LookML substitution syntax (${field_name}) to maintain query reusability and trace dependencies.
  - **Drill Field with Set:** Ensure View files leverage set definitions for drill fields to provide clean, structured, and repeatable drilling paths across measures

## Review PDT & Datagroups

- Identify failed PDTs - fix or delete if not being used
- Identify failed datagroups - fix or delete if not being used
- Review PDT event log and align caching policies (datagroups) strictly with upstream ELT/ETL pipelines to stop users from continuously hitting the raw database tables unnecessarily.

- **Recommendations:**
  - Ensure that Persistent Derived Tables (PDTs) explicitly declare partition and cluster keys (partition_keys and cluster_keys) that map directly to the underlying physical table structures of the data warehouse.
  - Use **Incremental PDTs** where applicable to reduce build times and database load for large datasets.
  - Avoid building PDT with liquid - derived tables with liquid should NOT be persisted as this can cause unmanageable table variations in the database. Instead, push the dynamic liquid out of the PDT and apply in the View or Explore level.
  - If data is loaded less frequently than every hour, implement event-based datagroups that trigger builds when new data is available.
  - If end-users are not querying “real-time” data, consider reducing the refresh frequency of your PDTs and staggering their builds throughout the day. 
  - Scan the database connection settings to ensure PDTs leverage warehouse partitioning or clustering.

*(Use `SKILL.md` for actionable CLI commands to review failed PDTs and datagroups)*

## Analyse Cache Efficiency

- **Breakdown of cache hits versus live database queries:** healthy baseline target for daily ETL-driven dashboards is 80% or higher (near-real-time dashboard target is lower i.e. 20-50% cache ratio). If cache ratio is below 50%, it is usually a sign that caching configurations are too aggressive, or filter options (like relative now dates) are breaking cache reuse. Review the LookML model for missing datagroups.

### Best Practices to Maximize Cache Efficiency

- **Use Datagroups Instead of persist_for:** Instead of hardcoding a time limit like persist_for: "2 hours", rely on **Datagroups** tied to a sql_trigger (e.g., checking the max timestamp of your underlying table). This clears the cache *only* when new data arrives, guaranteeing users get cached speed without seeing stale data.
- **Share Cache via Shared Authentication:** If your Looker connection is configured with *User-Specific Attributes* (OAuth/User-level scoping), Looker isolates the cache per individual user. For general-purpose dashboards, using a shared database service account allows User B to instantly benefit from the cached query generated by User A.
- **Implement Persistent Derived Tables (PDTs):** For heavy calculations, materialize the logic in the database using PDTs triggered by the same Datagroup. This transfers the query workload from the live dashboard load time onto an automated background schedule.
- **Reduce Dashboard Tile Density:** Dashboards with 25 or more tiles trigger substantial parallel database requests simultaneously. Restructuring dense dashboards across multiple tabs or utilizing cross-filtering keeps query sizes lean and highly cacheable.

*(Use `SKILL.md` for actionable CLI commands to check cache efficiency)*

## Audit user & content activity

Review Scheduled Plan System Activity Explore:

- **Inactive users:** 
  - Purge inactive accounts and contents. Identify any dashboards that have not been queried in 30 days, archive them.
- **Schedules:**
  - Check for scheduled job count and scheduled plan count across hours of day to identify if there is any hotspot with peak activity (e.g. midnight or 6-9am)
  - Find any orphaned schedules without owners, or failing scheduleles causing unnecessary drain on GKE memory and cluster resources
- **Unused Dashboard and Looks:**
  - Clean up and deprecate dashboard and looks that haven’t been used in the last 90 days
  - Identify any contents with “test”, “copy” or “draft” in the title and review if they need to be deleted.
  - Personal folder housekeeping - keep a personal folder for the development/ sandbox exploration stage only. Use a shared folder for production stages that should be managed by BI team. Schedule contents for deletion if not being used.

*(See `SKILL.md` for actionable queries to identify unused content)*

## 🛡️ Remediation Workflow (Next Steps)

1.  **Identify**: Use System Activity (via `SKILL.md` queries) to detect antipatterns (e.g., Slow Queries, Heavy Dashboards).
2.  **Isolate**: Use Query Metrics or Job Inspection to find the root cause (e.g., Missing Index, Bad Join).
3.  **Refactor**: Apply best practices (e.g., convert to derived table, apply Aggregate Awareness).
4.  **Validate**: Re-run the audit queries to confirm improvement.

## 📚 Official References

For deeper dives, refer to the following documentation:
- [Optimize Looker Server Performance](https://docs.cloud.google.com/looker/docs/best-practices/how-to-optimize-looker-server-performance)
- [Caching and Datagroups](https://docs.cloud.google.com/looker/docs/caching-and-datagroups)
- [Derived Tables (PDTs)](https://docs.cloud.google.com/looker/docs/derived-tables)
- [Incremental PDTs](https://docs.cloud.google.com/looker/docs/incremental-pdts)
- [Aggregate Awareness](https://docs.cloud.google.com/looker/docs/aggregate_awareness)
- [Optimize Database Setup for Looker](https://discuss.google.dev/t/best-practice-optimize-database-setup-for-reading-data/119153)
