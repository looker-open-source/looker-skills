include: "/views/raw/users.view.lkml"

view: +users {

  # =========================================================================
  # 1. KEYS (Primary & Foreign Keys)
  # =========================================================================

  dimension: id {
    primary_key: yes
    type: number
    label: "User ID"
    description: "Unique internal user identifier."
    group_label: "Identifiers"
    sql: ${TABLE}.id ;;
  }

  # =========================================================================
  # 2. DIMENSIONS (Attributes)
  # =========================================================================

  dimension: full_name {
    type: string
    label: "Full Name"
    description: "Legal full name of the user."
    sql: CONCAT(${TABLE}.first_name, ' ', ${TABLE}.last_name) ;;
  }

  dimension: email {
    type: string
    label: "Email Address"
    description: "Primary contact email."
    sql: ${TABLE}.email ;;
  }

  dimension: country {
    type: string
    label: "Country"
    description: "Country of residence."
    group_label: "Geography"
    sql: ${TABLE}.country ;;
    
    # Custom drill-down utilizing the advanced visualization library constant
    link: {
      label: "🍩 Country User Distribution (Pie)"
      url: "@{DRILL_PIE_VIZ}{{ link }}&fields=users.full_name,orders.orders_count&f[users.country]={{ value | url_encode }}&sorts=orders.orders_count+desc&limit=10&toggle=vis"
    }
  }

  # =========================================================================
  # 3. MEASURES (Aggregations - Using _count/_total/_amount suffixes)
  # =========================================================================

  measure: users_count {
    type: count
    label: "Users Count"
    description: "Total number of registered users."
    group_label: "Counts"
    drill_fields: [detail*]
  }

  # =========================================================================
  # 4. SETS (Drill Paths)
  # =========================================================================

  set: detail {
    fields: [
      id,
      full_name,
      email,
      country
    ]
  }
}
