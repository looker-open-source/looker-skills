include: "/views/refined/*.view.lkml"

# --------------------------------------------------------------------------
# Modular Explore (One Explore Per File Pattern)
# --------------------------------------------------------------------------
explore: orders {
  label: "Orders Analysis"
  description: "Core Explore for analyzing customer orders, transaction values, and user demographics."
  view_name: orders

  # Join users (Customer details) to the orders table
  join: users {
    type: left_outer
    relationship: many_to_one # Multiple orders belong to one user
    sql_on: ${orders.user_id} = ${users.id} ;;
  }
}
