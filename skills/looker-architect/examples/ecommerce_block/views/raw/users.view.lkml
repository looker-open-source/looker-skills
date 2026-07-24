view: users {
  sql_table_name: @{DATASET_NAME}.users ;;

  # --------------------------------------------------------------------------
  # Raw Dimensions (1:1 Table Column Mapping)
  # --------------------------------------------------------------------------

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }

  dimension: first_name {
    type: string
    sql: ${TABLE}.first_name ;;
  }

  dimension: last_name {
    type: string
    sql: ${TABLE}.last_name ;;
  }

  dimension: email {
    type: string
    sql: ${TABLE}.email ;;
  }

  dimension: country {
    type: string
    sql: ${TABLE}.country ;;
  }

  dimension_group: created {
    type: time
    timeframes: [raw, time, date]
    sql: ${TABLE}.created_at ;;
  }
}
