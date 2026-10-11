# Suggesting Business Metrics on Fact Tables

Read a fact table's actual shape and propose metrics a business user would recognize, without inventing anything the data does not support and without writing anything until the user confirms.

## Ground every suggestion in two things

1.  **What the columns actually contain**, not what a generic fact table usually has.
2.  **The business context** from the dbt exposure, or the user's own explanation.

With neither, do not suggest metrics. Ask what the table represents.

## Pattern: per-stage timestamp columns

Funnel and pipeline facts often carry one timestamp per stage:

```yaml
columns:
  - name: entered_prospecting_at
  - name: entered_qualification_at
  - name: entered_proposal_at
  - name: entered_closed_won_at
  - name: entered_closed_lost_at
```

This supports:

-   **Stage duration**: time between consecutive non-null stage timestamps.
-   **Stage-to-stage conversion**: records reaching stage Y divided by records reaching stage X, for adjacent stages.
-   **Win rate**: closed-won divided by (closed-won + closed-lost).

Propose only stages that exist as columns. Do not assume a generic funnel.

### LookML for these suggestions

Durations are a `dimension_group` of `type: duration`, never a hand-written date-diff `dimension` or a raw timestamp subtraction (see [lookml-fields dimension_group](../../lookml-fields/references/dimension_group.md)). Measures then aggregate the generated fields:

```lookml
dimension_group: qualification_to_proposal {
  type: duration
  intervals: [day, week]
  sql_start: ${entered_qualification_raw} ;;
  sql_end: ${entered_proposal_raw} ;;
  description: "Time between entering qualification and entering proposal."
}

measure: avg_days_qualification_to_proposal {
  type: average
  sql: ${days_qualification_to_proposal} ;;
  value_format_name: decimal_1
  description: "Average days from qualification to proposal."
}

measure: count_entered_qualification {
  type: count
  filters: [entered_qualification_date: "NOT NULL"]
  description: "Opportunities that reached qualification."
}

measure: count_entered_proposal {
  type: count
  filters: [entered_proposal_date: "NOT NULL"]
  description: "Opportunities that reached proposal."
}

measure: qualification_to_proposal_rate {
  type: number
  sql: 1.0 * ${count_entered_proposal} / NULLIF(${count_entered_qualification}, 0) ;;
  value_format_name: percent_1
  description: "Share of opportunities that reached proposal among those that reached qualification."
}
```

## Other shapes worth recognizing

-   **A single `status` or `stage` column with no stage timestamps**: supports a count-by-status breakdown, not duration or conversion. There is no time dimension to compute a rate from.
-   **An amount column alongside a status column**: supports weighted or open-pipeline metrics, only if the exposure or user confirms that is how the business values open pipeline. Do not assume every amount column is summed for every status.
-   **A boolean flag** (`is_converted`, `is_churned`): supports a simple rate measure (flagged count over total count). Low risk, no invented logic.
-   **Periodic snapshot or history tables** (one row per entity per day): a `sum` over all rows double-counts. Suggest metrics filtered to one snapshot date (for example the latest) or distinct counts, and confirm the grain with the user. Look for domain filters in the existing Looker project (such as `amount > 0` for open pipeline) rather than inventing them.
-   **Event-level facts with a repeated grain per entity** (one row per page view): be cautious proposing conversion on the fact itself. The right fix is often a different grain, which belongs in a dbt model. If the fix needs new dbt logic, say so and stop. That is out of scope.

## How to present suggestions

-   List each metric with the business question it answers, the columns it uses, and the `measure:` you would write.
-   Write nothing into the view until the user picks which to keep.
-   If a metric would be meaningfully more reliable computed once in dbt than on every query, say so.
-   Suggested measures follow the same rules as any measure: `description`, `value_format_name`, and the `count_` / `total_` / `avg_` naming.
