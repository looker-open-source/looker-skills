include: "/explores/orders.explore.lkml"

# --------------------------------------------------------------------------
# Data Integrity Unit Test
# --------------------------------------------------------------------------
test: orders_pk_is_unique {
  explore_source: orders {
    column: id { field: orders.id }
    column: orders_count { field: orders.orders_count }

    # Limit scan to optimize database query performance during validation
    filters: {
      field: orders.created_date
      value: "last 7 days"
    }
  }

  assert: pk_uniqueness_verified {
    expression: ${orders.orders_count} = 1 ;;
    description: "Verifies that the primary key does not duplicate due to incorrect join cardinality."
  }
}
