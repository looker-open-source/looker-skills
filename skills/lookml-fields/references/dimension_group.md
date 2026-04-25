---
name: lookml-fields-dimension-group
description: Use this skill to create Dimension Groups (Time and Duration).
---

# Instructions

1.  **Type: Time**:
    *   Creates a set of time-based dimensions (date, week, month, etc.) from a single timestamp.
    *   Required: `timeframes` (list of frames to generate), `sql` (the timestamp column).
    *   Optional: `datatype` (if not standard timestamp), `convert_tz` (timezone conversion).
2.  **Type: Duration**:
    *   Calculates the time between two timestamps.
    *   Required: `intervals` (day, week, etc.), `sql_start`, `sql_end`.
3.  **Datatype Parameter**:
    *   **When to use**: Use `datatype` when your database column is *not* a standard `timestamp` (YYYY-MM-DD HH:MM:SS).
    *   **Common Options**:
        *   `timestamp` (Default): Standard datetime/timestamp column.
        *   `date`: Date-only string (e.g., '2023-01-01').
        *   `epoch`: Integer unix timestamp.
        *   `yyyymmdd`: Integer date format.
4.  **Datatype: Date**:
    *   **Usage**: Explicitly set `datatype: date` if the source column has no time component.
    *   **Differences**:
        *   **Timezones**: No timezone conversion is performed.
        *   **Timeframes**: restricted to date-level grains.
    *   **Allowed Timeframes**: `[date, week, month, quarter, year]`.
    *   **Disallowed**: `[time, hour, minute, second]`.
5.  **Best Practices**:
    *   **Common Timeframes**: `[raw, time, date, week, month, quarter, year]`.
    *   **Extended Timeframes**: `[hour_of_day, day_of_week, day_of_month, month_name, week_of_year]`.
    *   **Naming**: The dimension names will be `group_name_timeframe` (e.g., `created_date`).
6.  **Labeling & Naming Strategy**:
    *   **How it works**: Looker combines the `dimension_group` name with the `timeframe` to generate the field name (`name_timeframe`) and the UI label ("Name Timeframe").
    *   **Best Practice**: Remove suffixes like `_at`, `_timestamp`, or `_date` from the dimension group name to avoid redundant labels.
        *   *Bad*: `dimension_group: created_at` generates `created_at_date` -> Label: **"Created At Date"**.
        *   *Good*: `dimension_group: created` generates `created_date` -> Label: **"Created Date"**.
        *   *Good*: `dimension_group: order` generates `order_date` -> Label: **"Order Date"**.
7.  **Default Timeframes**:
    *   **What are they?**: If `timeframes` is omitted, Looker generates `[date, week, month, year]` (and `time` for timestamps).
    *   **Crucial Missing Item**: The `raw` timeframe is **NOT** included by default. Failing to include `raw` prevents efficient joins on the underlying column.
    *   **Best Practice**: Never rely on defaults. Explicitly define `timeframes: [raw, time, date, week, month, quarter, year]` to ensure full utility.
8.  **Handling Date Strings**:
    *   **The Issue**: Databases often store dates as strings (e.g., `'2023-01-01'`) for various reasons.
    *   **Why It Matters**: Looker's timeframes (month, week, quarter) rely on date/timestamp functions to truncate and group data. These functions fail on strings.
    *   **The Fix**: You **must** cast the string to a date or timestamp in the `sql` parameter.
        *   *Example*: `sql: CAST(${TABLE}.date_string AS DATE) ;;`
        *   *Example (BigQuery)*: `sql: PARSE_DATE('%Y-%m-%d', ${TABLE}.date_string) ;;`

# Examples

## Basic Time Dimension Group

```lookml
dimension_group: created {
  type: time
  timeframes: [
    raw,
    time,
    date,
    week,
    month,
    quarter,
    year
  ]
  sql: ${TABLE}.created_at ;;
}
```

## Duration Dimension Group

```lookml
dimension_group: duration_since_signup {
  type: duration
  intervals: [day, week, month]
  sql_start: ${signup_raw} ;;
  sql_end: ${orders.created_raw} ;;
}
```
