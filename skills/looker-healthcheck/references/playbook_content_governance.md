# Content Governance, Dashboard Density & Schedule Staggering Playbook

This master playbook defines the operational procedures, diagnostic thresholds, and remediation workflows for eliminating stale content, deconstructing monolithic dashboards, staggering scheduled deliveries, and purging dead code using `looker-cli health vacuum`.

> [!TIP]
> For executing the operational audit checklist queries (tile bloat, auto-refresh, dynamic fields, merged queries, inactive accounts/content, and failing schedules), consult [`system_activity_queries.md`](system_activity_queries.md). This playbook provides the deep architectural standards and remediation patterns.

---

## 1. The 3-Stage Content Deprecation Funnel

To avoid breaking downstream business reports or deleting content required for historical audits, follow this structured deprecation lifecycle:

```
                     CONTENT LIFECYCLE & DEPRECATION FUNNEL
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │ Stage 1: Identification   │ Stage 2: Soft Deprecation │ Stage 3: Permanent Purge  │
 ├───────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • 90-day System Activity  │ • Move Dashboards to Trash│ • Hard delete after 30d   │
 │ • looker-cli vacuum scan  │ • Mark Explores hidden:yes│ • Remove LookML fields    │
 │ • Schedule Failure Scans  │ • Disable Zombie Schedules│ • Reassign owner to SvcAcct│
 └───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## 2. Dead LookML Code Pruning (`looker-cli health vacuum`)

Scan models and explores for unused joins, fields, and explores across the last 90 days:

```bash
# 1. Identify 0-query explores across models
looker-cli health vacuum models --timeframe=90

# 2. Identify 0-query dimensions, measures, and joins within a specific explore
looker-cli health vacuum explores --model=<model_name> --explore=<explore_name> --timeframe=90
```

Refer to [looker_cli_health_and_vacuum.md](looker_cli_health_and_vacuum.md) for the complete safe pruning rules (protecting join foreign keys and measure dependencies).

---

## 3. Dashboard Density & Tile Bloat Remediation

### The >25 Query Tile Rule
A dashboard's query load is measured by its **Total Query Tiles** (excluding static markdown text cards):
$$\text{Total Query Tiles} = \text{dashboard\_element.count} - \text{dashboard\_element.count\_text}$$

* **Healthy (1 – 15 tiles)**: Fast frontend rendering (<3s), no worker queue delays.
* **Warning (16 – 25 tiles)**: Approaches browser thread limits; potential connection pool contention.
* **Critical (> 25 tiles)**: Breaches per-user query concurrency limits; causes `per_user_throttler` queuing and database pool exhaustion.

### Remediation Protocols for Large Dashboards:
1. **Implement Dashboard Tabs**:
   * Group related KPI tiles into visual tabs (e.g. "Executive Overview", "Marketing Performance", "Regional Breakdown").
   * Looker only executes queries on the active tab upon initial page load, deferring background queries for other tabs until clicked.
2. **Deconstruct into Modular Summary Dashboards**:
   * Retain 10–12 high-level KPI tiles on the primary dashboard.
   * Provide **HTML Drill Links** on dimensions/measures linking to specialized child dashboards:
     ```lookml
     dimension: region {
       type: string
       sql: ${TABLE}.region ;;
       link: {
         label: "🔍 Open Regional Deep-Dive Dashboard"
         url: "/dashboards/245?Region={{ value | url_encode }}"
       }
     }
     ```
3. **Auto-Refresh Rate Clamping**:
   * Refresh intervals $< 15\text{ minutes}$ drain warehouse budgets and saturate connection pools.
   * Increase refresh intervals to $\ge 30\text{ minutes}$ or tie tile caches to upstream ETL datagroups.

---

## 4. 10-Point Forensic Single Dashboard Checklist

When auditing a mission-critical slow dashboard, evaluate against these 10 architectural criteria:

| # | Forensic Dimension | Target Best Practice | Optimization Trigger |
| :-: | :--- | :--- | :--- |
| **1** | **Total Query Tiles** | $\le 25\text{ query tiles}$ | $> 25$ (Deconstruct into tabs / child dashboards) |
| **2** | **Run on Load** | Disabled if mandatory filters exist | Enabled when required filters are unset |
| **3** | **Date Filters** | Mandatory for time-series fact explores | Missing (Forces unbounded full-history scan) |
| **4** | **Max Row Limits** | $\le 10$ for KPI single-value / gauge cards | 5,000 limit left on single-value tile |
| **5** | **Auto-Refresh Interval** | Off (or $\ge 30\text{ mins}$ for TV displays) | $< 15\text{ mins}$ (Saturates connection pool) |
| **6** | **Merged Query Tiles** | 0 (Native LookML joins) | $\ge 1$ (In-memory merge lag & JVM RAM bloat) |
| **7** | **Formatted Pivots** | Low cardinality only | High cardinality pivots executing in browser RAM |
| **8** | **Dynamic Fields** | $\le 2$ custom calculations per tile | $> 2$ dynamic fields (Push down to LookML) |
| **9** | **Explores Utilized** | Scoped lightweight views | Heavy transaction explores lacking rollups |
| **10** | **Total Runtime** | $< 5.0\text{ seconds}$ | $> 10.0\text{s}$ (Tile bottleneck or warehouse scan) |

---

## 5. Eliminating Merged Queries

Looker Merged Queries perform **in-memory client-side joins in the Looker JVM**:
1. Spawns $N$ parallel sub-queries to the database warehouse, saturating user connection caps.
2. Downloads raw result sets (up to 5,000 rows each) over the network into Looker JVM memory.
3. Joins datasets in Looker RAM using single-threaded workers, spiking CPU and risking Out-Of-Memory (OOM) crashes.

### Refactoring Pattern: Native LookML Join
Replace the merged query tile with a native LookML explore join:
```lookml
explore: orders {
  join: marketing_ad_spend {
    type: left_outer
    relationship: many_to_one
    sql_on: ${orders.created_date} = ${marketing_ad_spend.date}
        AND ${orders.campaign_id} = ${marketing_ad_spend.campaign_id} ;;
  }
}
```

---

## 6. Scheduled Delivery Staggering & Zombie Crons

### Resolving Top-of-Hour (`:00`) Schedule Stacking
Over 80% of business schedules default to `:00` (e.g. `08:00 AM`, `09:00 AM`). When dozens of schedules fire at the same minute, they exhaust renderer threads and database connection pools.

* **Stagger Schedules to Off-Peak Windows**:
  * Executive Reports: `08:07 AM` (`7 8 * * *`)
  * Operational Digests: `08:22 AM` (`22 8 * * *`)
  * Data Syncs: `08:37 AM` (`37 8 * * *`)
  * Automated Alerts: `08:52 AM` (`52 8 * * *`)

### Purging Zombie Schedules
Active scheduled deliveries owned by users whose accounts are disabled or who have not logged in for $>90$ days waste warehouse compute. Reassign critical corporate schedules to a dedicated Service Account and delete unneeded orphaned plans.
