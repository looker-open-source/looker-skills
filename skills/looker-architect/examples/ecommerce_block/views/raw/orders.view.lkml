view: orders {
  sql_table_name: @{DATASET_NAME}.orders ;;

  # --------------------------------------------------------------------------
  # Raw Dimensions (1:1 Table Column Mapping)
  # --------------------------------------------------------------------------

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }

  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }

  dimension: status {
    type: string
    sql: ${TABLE}.status ;;
  }

  dimension: sale_price {
    type: number
    sql: ${TABLE}.sale_price ;;
  }

  dimension_group: created {
    type: time
    timeframes: [raw, time, date]
    sql: ${TABLE}.created_at ;;
  }
}
