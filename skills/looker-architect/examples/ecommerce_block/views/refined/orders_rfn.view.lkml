include: "/views/raw/orders.view.lkml"

view: +orders {

  # =========================================================================
  # 1. PERIOD OVER PERIOD LOGIC (BigQuery Dialect Example)
  # =========================================================================

  filter: pop_date_filter {
    view_label: "_PoP"
    label: "Comparison Date Filter"
    description: "Select the current date range to compare against the previous period."
    type: date
    default_value: "7 days"
  }

  parameter: pop_compare_to {
    view_label: "_PoP"
    label: "Compare To"
    description: "Select the offset interval for the previous period comparison."
    type: string
    allowed_value: { value: "Yesterday" }
    allowed_value: { value: "Week" }
    allowed_value: { value: "Month" }
    allowed_value: { value: "Year" }
    default_value: "Year"
  }

  dimension: pop_data_date {
    hidden: yes
    type: date
    sql: CAST(${TABLE}.created_at AS DATE) ;;
  }

  dimension_group: pop_filter_start {
    hidden: yes
    type: time
    timeframes: [raw, date]
    sql: CASE WHEN {% date_start pop_date_filter %} IS NULL THEN '1970-01-01' ELSE CAST({% date_start pop_date_filter %} AS DATE) END ;;
  }

  dimension_group: pop_filter_end {
    hidden: yes
    type: time
    timeframes: [raw, date]
    sql: CASE WHEN {% date_end pop_date_filter %} IS NULL THEN CURRENT_DATE ELSE CAST({% date_end pop_date_filter %} AS DATE) END ;;
  }

  dimension: pop_interval_days {
    hidden: yes
    type: number
    sql: DATE_DIFF(${pop_filter_end_date_date}, ${pop_filter_start_date_date}, DAY) ;;
  }

  dimension: pop_previous_start_date {
    hidden: yes
    type: date
    sql: 
      DATE_SUB(${pop_filter_start_date_date}, INTERVAL 
        {% if pop_compare_to._parameter_value == "'Yesterday'" %} 1 DAY
        {% elsif pop_compare_to._parameter_value == "'Week'" %} 1 WEEK
        {% elsif pop_compare_to._parameter_value == "'Month'" %} 1 MONTH
        {% elsif pop_compare_to._parameter_value == "'Year'" %} 1 YEAR
        {% else %} ${pop_interval_days} DAY
        {% endif %}
      ) ;;
  }

  dimension: pop_is_current_period {
    hidden: yes
    type: yesno
    sql: ${pop_data_date} > ${pop_filter_start_date_date} AND ${pop_data_date} <= ${pop_filter_end_date_date} ;;
  }

  dimension: pop_is_previous_period {
    hidden: yes
    type: yesno
    sql: ${pop_data_date} > ${pop_previous_start_date} AND ${pop_data_date} <= ${pop_filter_start_date_date} ;;
  }

  dimension: pop_period_group {
    view_label: "_PoP"
    label: "Comparison Period"
    description: "Categorizes dates into Selected Period, Previous Period, or Not in time period."
    type: string
    case: {
      when: {
        sql: ${pop_is_current_period} = true ;;
        label: "Selected Period"
      }
      when: {
        sql: ${pop_is_previous_period} = true ;;
        label: "Previous Period"
      }
      else: "Not in time period"
    }
  }

  # =========================================================================
  # 2. KEYS (Primary & Foreign Keys)
  # =========================================================================

  dimension: id {
    primary_key: yes
    type: number
    label: "Order ID"
    description: "Unique internal order identifier."
    group_label: "Identifiers"
    sql: ${TABLE}.id ;;
  }

  dimension: user_id {
    type: number
    label: "Customer ID"
    description: "Internal identifier of the purchasing customer."
    group_label: "Identifiers"
    sql: ${TABLE}.user_id ;;
  }

  # =========================================================================
  # 3. DIMENSIONS (Attributes)
  # =========================================================================

  dimension: status {
    type: string
    label: "Order Status"
    description: "The processing state of the order (e.g. Complete, Pending, Cancelled)."
    sql: ${TABLE}.status ;;
  }

  dimension: sale_price {
    type: number
    label: "Sale Price"
    description: "Gross transaction price of the order."
    value_format_name: usd
    sql: ${TABLE}.sale_price ;;
  }

  # =========================================================================
  # 4. MEASURES (Aggregations - Using _count/_total/_amount Suffixes)
  # =========================================================================

  measure: orders_count {
    type: count
    label: "Orders Count"
    description: "Total number of orders processed."
    group_label: "Counts"
    drill_fields: [detail*]
  }

  # Revenue Sum utilizing the SUBSTITUTION OPERATOR to inherit usd formatting & description
  measure: revenue_total {
    type: sum
    label: "Revenue Total"
    description: "Total gross revenue generated from orders."
    group_label: "Financial Metrics"
    sql: ${sale_price} ;; # INHERITS usd formatting and description
  }

  measure: revenue_average {
    type: average
    label: "Revenue Average"
    description: "Average transaction value per order."
    group_label: "Financial Metrics"
    sql: ${sale_price} ;; # INHERITS usd formatting and description
  }

  # Period-over-Period Scorecard Measures

  measure: orders_count_selected {
    view_label: "_PoP"
    label: "Orders Count (Selected Period)"
    description: "Total orders during the selected timeframe."
    type: count
    filters: [pop_period_group: "Selected Period"]
    sql: ${orders_count} ;;
  }

  measure: orders_count_previous {
    view_label: "_PoP"
    label: "Orders Count (Previous Period)"
    description: "Total orders during the previous comparison timeframe."
    type: count
    filters: [pop_period_group: "Previous Period"]
    sql: ${orders_count} ;;
  }

  # Percentage change using SAFE DIVISION to prevent SQL division-by-zero crashes
  measure: orders_count_pop_change {
    view_label: "_PoP"
    label: "Orders Count PoP % Change"
    description: "Percentage change in orders between selected and previous periods."
    type: number
    value_format_name: percent_1
    sql: 1.0 * (${orders_count_selected} - ${orders_count_previous}) / NULLIF(${orders_count_previous}, 0) ;;
    html:
      {% if value >= 0 %}
        <span style="color: #0F9D58;">▲ {{ rendered_value }}</span>
      {% else %}
        <span style="color: #DB4437;">▼ {{ rendered_value }}</span>
      {% endif %} ;;
  }

  # =========================================================================
  # 5. SETS (Drill Paths)
  # =========================================================================

  set: detail {
    fields: [
      id,
      status,
      sale_price
    ]
  }
}
