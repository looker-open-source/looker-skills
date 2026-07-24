connection: "@{CONNECTION_NAME}"

# Include refined views (which include raw views automatically)
include: "/views/refined/*.view.lkml"

# Include explores, dashboards, and tests
include: "/explores/*.explore.lkml"
include: "/dashboards/*.dashboard.lookml"
include: "/tests/*.test.lkml"

# --------------------------------------------------------------------------
# Caching Policy (ETL-Triggered Datagroup)
# --------------------------------------------------------------------------
datagroup: ecommerce_etl {
  description: "Triggers when the maximum order creation timestamp changes."
  sql_trigger: SELECT MAX(created_at) FROM @{DATASET_NAME}.orders ;;
  max_cache_age: "24 hours"
}

persist_with: ecommerce_etl
