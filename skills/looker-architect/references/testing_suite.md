# LookML Testing Suite (Data Integrity & Quality Assurance)

LookML unit tests (`test` parameters) are critical for maintaining data trust. They run automated queries against your database to verify that your semantic model behaves as expected and that the underlying data conforms to your business assumptions. 

This reference details the enterprise standards for writing robust LookML tests to prevent compilation errors and query regressions before deploying to production.

---

## 1. Quality Standards

*   **Location**: Define tests in the `tests/` directory (e.g., `tests/[explore_name].test.lkml`).
*   **One Suite Per Explore**: Each file should contain *all* the test definitions for a specific Explore.
*   **Naming Convention**: Match the Explore name exactly: `tests/[explore_name].test.lkml`.
*   **Model Inclusion**: Ensure all test files are included in the model file: `include: "/tests/*.test.lkml"`.
*   **Performance Optimization**: Use filters (e.g., `last 7 days` or `yesterday`) in `explore_source` definitions to limit the query scan size on massive tables, unless verifying full historical data is strictly required.

---

## 2. Core Test Configurations

Every LookML test consists of an `explore_source` query (defining the test dataset) and one or more `assert` blocks (defining the logical checks).

```lookml
test: [test_name] {
  explore_source: [explore_name] {
    column: [column_name] { field: [view_name].[field_name] }
    filters: {
      field: [view_name].[field_name]
      value: "[filter_value]"
    }
  }

  assert: [assertion_name] {
    expression: ${[view_name].[field_name]} [operator] [expected_value] ;;
    description: "Explanation of what this assertion validates."
  }
}
```

---

## 3. Mandatory Test Scenarios

### Scenario A: Primary Key Uniqueness (The Anti-Fanout Shield)
This is the most critical test. It verifies that Primary Keys remain unique after joins. This serves as the primary defense against "fanout" errors caused by incorrect `one_to_many` join relationships in Explores.

```lookml
test: orders_pk_is_unique {
  explore_source: orders {
    column: order_id { field: orders.order_id }
    column: order_items_count { field: orders.order_items_count }
    
    # Limit to recent data to optimize query costs on large datasets
    filters: {
      field: orders.created_date
      value: "last 7 days"
    }
  }

  assert: pk_uniqueness_verified {
    expression: ${orders.order_items_count} = 1 ;;
    description: "Verifies that the primary key is unique and does not duplicate due to incorrect joins."
  }
}
```

### Scenario B: Composite Primary Key Validation
If a raw database table lacks a single-column unique ID, you **MUST** synthesize a composite primary key in the refined view using a concatenation function (e.g., `CONCAT`) and write a test to validate its uniqueness.

**views/refined/sessions_rfn.view.lkml**:
```lookml
view: +sessions {
  dimension: session_event_pk {
    primary_key: yes
    hidden: yes
    type: string
    sql: CONCAT(${TABLE}.session_id, '|', ${TABLE}.event_id) ;;
  }
}
```

**tests/sessions.test.lkml**:
```lookml
test: sessions_pk_is_unique {
  explore_source: sessions {
    column: session_event_pk { field: sessions.session_event_pk }
    column: session_event_count { field: sessions.session_event_count }
    
    filters: {
      field: sessions.created_date
      value: "yesterday"
    }
  }

  assert: composite_pk_uniqueness_verified {
    expression: ${sessions.session_event_count} = 1 ;;
    description: "Ensures the synthesized composite primary key is unique."
  }
}
```

### Scenario C: Business Logic & Boundary Tests
Ensure that calculations behave as expected (e.g., gross margin is never greater than total revenue, active users always have contact emails, or dates are in the past).

```lookml
test: margin_is_mathematically_valid {
  explore_source: orders {
    column: revenue_total { field: orders.revenue_total }
    column: gross_margin_total { field: orders.gross_margin_total }
    
    filters: {
      field: orders.created_date
      value: "yesterday"
    }
  }
  
  assert: margin_does_not_exceed_revenue {
    expression: ${orders.gross_margin_total} <= ${orders.revenue_total} ;;
    description: "Asserts that gross margin never exceeds total revenue."
  }
}
```

---

## 4. Quality Assurance Checklist
- [ ] Tests are saved in the `tests/` directory with the `.test.lkml` extension.
- [ ] Every Explore in the project has a corresponding test suite validating its primary key uniqueness.
- [ ] Large tables use filters (e.g., `last 7 days`) to optimize database scan costs.
- [ ] Assertions use the substitution operator `${field_name}` to maintain semantic integrity.
- [ ] All test configurations are written in English.
- [ ] Model file includes the tests: `include: "/tests/*.test.lkml"`.
