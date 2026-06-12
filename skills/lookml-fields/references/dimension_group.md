---
name: lookml-fields-dimension-group
description: Use this skill to create Dimension Groups (Time and Duration) and calculate date differences, datediff, or time elapsed between timestamps (e.g. days since signup, months between orders).
---

# Instructions

1.  **Type: Time**:
    - Creates a set of time-based dimensions (date, week, month, etc.) from a single timestamp.
    - Required: `timeframes` (list of frames to generate), `sql` (the timestamp column).
    - Optional: `datatype` (if not standard timestamp), `convert_tz` (timezone conversion).
2.  **Type: Duration (Date Diffs & Time Elapsed)**:
    - **CRITICAL RULE**: Whenever you see or need to create fields calculating time elapsed, date differences (like `DATEDIFF`, `DATE_DIFF`, `timestamp_diff`), or metrics like `month_since_signup` or `days_to_fulfill`, you **MUST** use a `dimension_group` of `type: duration`. **Do NOT** write a standard `dimension` with custom date diff SQL.
    - **Required Parameters**: `intervals` (list of intervals like `[day, week, month, year]`), `sql_start`, `sql_end`.
    - **Generated Fields**: According to Looker's official specification, Looker prepends the **plural version** of each interval name to your dimension group name (`${[plural_interval]_[dimension_group_name]}`). For example, if your `dimension_group` is named `since_signup` with `intervals: [day, month, year]`, Looker generates three distinct, referenceable dimension fields:
      - `${days_since_signup}` (calculates exact days elapsed)
      - `${months_since_signup}` (calculates complete months elapsed)
      - `${years_since_signup}` (calculates complete years elapsed)
3.  **Datatype Parameter**:
    - **When to use**: Use `datatype` when your database column is _not_ a standard `timestamp` (YYYY-MM-DD HH:MM:SS).
    - **Common Options**:
      - `timestamp` (Default): Standard datetime/timestamp column.
      - `date`: Date-only string (e.g., '2023-01-01').
      - `epoch`: Integer unix timestamp.
      - `yyyymmdd`: Integer date format.
4.  **Datatype: Date**:
    - **Usage**: Explicitly set `datatype: date` if the source column has no time component.
    - **Differences**:
      - **Timezones**: No timezone conversion is performed.
      - **Timeframes**: restricted to date-level grains.
    - **Allowed Timeframes**: `[date, week, month, quarter, year]`.
    - **Disallowed**: `[time, hour, minute, second]`.
5.  **Best Practices**:
    - **Common Timeframes**: `[raw, time, date, week, month, quarter, year]`.
    - **Extended Timeframes**: `[hour_of_day, day_of_week, day_of_month, month_name, week_of_year]`.
    - **Naming**: The dimension names will be `group_name_timeframe` (e.g., `created_date`).
6.  **Labeling & Naming Strategy**:
    - **Time Dimension Groups**: Looker combines the `dimension_group` name with the `timeframe` to generate the field name (`name_timeframe`) and the UI label ("Name Timeframe").
      - **Best Practice**: Remove suffixes like `_at`, `_timestamp`, or `_date` from the dimension group name to avoid redundant labels.
      - _Bad_: `dimension_group: created_at` generates `created_at_date` -> Label: **"Created At Date"**.
      - _Good_: `dimension_group: created` generates `created_date` -> Label: **"Created Date"**.
    - **Duration Dimension Groups**: Looker generates field names by prepending the pluralized interval (e.g., `${days_since_signup}`, `${months_since_signup}`, `${years_since_signup}`) and creates intuitive UI labels like **"Days Since Signup"**, **"Months Since Signup"**, **"Years Since Signup"**.
      - **Best Practice**: Use clean action/event names like `since_signup` or descriptive nouns like `processing_time`. **Never** include the word `duration` in the dimension group name, as it creates repetitive UI labels (e.g., "Days Duration Since Signup").
7.  **Default Timeframes**:
    - **What are they?**: If `timeframes` is omitted, Looker generates `[date, week, month, year]` (and `time` for timestamps).
    - **Crucial Missing Item**: The `raw` timeframe is **NOT** included by default. Failing to include `raw` prevents efficient joins on the underlying column.
    - **Best Practice**: Never rely on defaults. Explicitly define `timeframes: [raw, time, date, week, month, quarter, year]` to ensure full utility.
8.  **Handling Date Strings**:
    - **The Issue**: Databases often store dates as strings (e.g., `'2023-01-01'`) for various reasons.
    - **Why It Matters**: Looker's timeframes (month, week, quarter) rely on date/timestamp functions to truncate and group data. These functions fail on strings.
    - **The Fix**: You **must** cast the string to a date or timestamp in the `sql` parameter.
      - _Example_: `sql: CAST(${TABLE}.date_string AS DATE) ;;`
      - _Example (BigQuery)_: `sql: PARSE_DATE('%Y-%m-%d', ${TABLE}.date_string) ;;`

9.  **Replacing Custom Date Diff SQL**:
    - **The Issue**: AI assistants or developers often write manual `dimension` fields like `dimension: month_since_signup { sql: DATEDIFF(month, ${signup_date}, ${current_date}) ;; }`.
    - **The Fix**: Always refactor manual `DATEDIFF`/`DATE_DIFF` dimensions into a `dimension_group` of `type: duration`. This ensures multi-interval discoverability and avoids dialect-specific SQL functions.

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

## Duration Dimension Group (Months / Days Since Signup)

```lookml
# Replaces manual date diff dimensions like 'month_since_signup' or 'days_since_signup'
dimension_group: since_signup {
  type: duration
  intervals: [day, week, month, quarter, year]
  sql_start: ${users.signup_raw} ;;
  sql_end: ${orders.created_raw} ;;
}
```

## Duration Dimension Group (Days / Hours Between Processing)

```lookml
dimension_group: processing_time {
  type: duration
  intervals: [hour, day, week]
  sql_start: ${created_raw} ;;
  sql_end: ${completed_raw} ;;
}
```

## Duration Dimension Group (Customer Age)

```lookml
dimension_group: customer_age {
  type: duration
  intervals: [month, year]
  sql_start: ${birth_raw} ;;
  sql_end: CURRENT_TIMESTAMP() ;;
}
```
