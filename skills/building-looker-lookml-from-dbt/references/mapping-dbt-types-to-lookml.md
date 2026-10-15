# Mapping dbt Column Types to LookML

Translate a column's warehouse type into a LookML field. Follow the data types the project declares: the `data_type` in the model's YAML, then the manifest, catalog or warehouse (`dbt show --select <model> --limit 1`, `information_schema`). If the project declares none, infer the type from the column's nature (name, usage in the SQL, values) and flag it for the user to confirm.

## General mapping

Dbt YAML often carries the warehouse's long type names. Treat `character varying` as `varchar`, `timestamp without time zone` as `timestamp`, `timestamp with time zone` as `timestamptz`, and `double precision`, `numeric(p,s)` and `decimal(p,s)` as their base types.

| Source type | LookML | Notes |
| :--- | :--- | :--- |
| `varchar`, `text`, `string`, `char` | `dimension`, `type: string` | Default case |
| `boolean`, `bool` | `dimension`, `type: yesno` | LookML has no `boolean` type |
| `integer`, `bigint`, `smallint`, `int` | `dimension`, `type: number` | Add `value_format_name` only for currency or percent measures |
| `decimal`, `numeric`, `float`, `double precision`, `real` | `dimension`, `type: number` | Use `value_format_name` when the description implies currency or percent |
| `date` | `dimension_group`, `type: time`, `datatype: date` | `timeframes: [raw, date, week, month, quarter, year]` |
| `timestamp`, `timestamptz`, `datetime` | `dimension_group`, `type: time` | `timeframes: [raw, time, date, week, month, quarter, year]`. Use `datatype: epoch` for unix time stored as an integer |
| `json`, `jsonb`, `variant`, `object`, `struct` | `string` (usually) | Flag for manual review. Semi-structured columns usually need per-key dimensions; do not dump the whole blob into one dimension without asking |
| `array`, `list` | Flag for manual review | No native LookML array type. Needs an upstream unnest in dbt or an explicit decision |

## Warehouse-specific types

| Warehouse | Type | LookML | Notes |
| :--- | :--- | :--- | :--- |
| Redshift | `super` | Flag for manual review | Same reasoning as JSON |
| Redshift | `geometry`, `geography` | Flag for manual review | Extract lat/lon as `number` dimensions upstream in dbt, then map those |
| Redshift | `varchar(n)` | `string` | Length is not reflected in LookML |
| Redshift | `timestamptz` | `dimension_group` (`type: time`) | Note timezone handling in the `description` |
| BigQuery | `INT64`, `FLOAT64`, `NUMERIC`, `BIGNUMERIC` | `number` | |
| BigQuery | `BOOL` | `yesno` | |
| BigQuery | `TIMESTAMP`, `DATETIME`, `DATE` | `dimension_group` | `DATETIME` has no timezone; set `datatype: datetime` |
| BigQuery | `STRUCT`, `ARRAY`, `GEOGRAPHY` | Flag for manual review | |
| Snowflake | `NUMBER`, `FLOAT` | `number` | |
| Snowflake | `TIMESTAMP_NTZ`, `TIMESTAMP_LTZ`, `TIMESTAMP_TZ` | `dimension_group` | Note timezone handling in the `description` |
| Snowflake | `VARIANT`, `OBJECT`, `ARRAY` | Flag for manual review | |

## Dimension groups

-   A raw date or timestamp column is never a standalone `dimension`. Wrap it in a `dimension_group` so Looker generates the `_date`, `_week`, `_month` variants.
-   Always list `timeframes` explicitly. Looker's default omits `raw`, which blocks efficient joins and downstream references like `${created_raw}`.
-   Name the group after the column with `_at`, `_timestamp` or `_date` stripped (`created_at` -> `dimension_group: created`) so labels read "Created Date", not "Created At Date". Set `sql: ${TABLE}.created_at ;;`.
-   If a date is stored as a string, cast it in `sql` (`CAST(${TABLE}.col AS DATE)`); timeframes fail on strings.
-   Keep `is_*` and `has_*` boolean names as they are.
-   Follow the target project's timezone convention. If existing views convert timestamps in `sql` (for example `convert_timezone(...)` on Redshift) or set `convert_tz: no` on date groups, do the same.
-   A string column that holds a period (`2026-Q1`) stays a `string` dimension. Offer a hidden sort dimension with `order_by_field` if the existing views use that pattern.

## When `meta.looker` is present

```yaml
columns:
  - name: order_status
    data_type: varchar
    meta:
      looker:
        value_format_name: id
        hidden: true
```

Apply every key under `meta.looker` onto the generated field, overriding the table above. The block exists so analytics engineers can correct what inference gets wrong. Never override it with an inferred default.
