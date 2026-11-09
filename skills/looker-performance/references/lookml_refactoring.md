# LookML Refactoring & Modeling Optimization Manual

This reference handbook details the standards for refactoring LookML views, explores, joins, and dimensions to optimize SQL compilation, maximize query execution speed, and protect database indexes.

---

## 1. Explore Governance & Join Pruning

How you configure your Explores directly dictates how many tables the database must scan. Large, bloated Explores are a primary cause of high database costs and slow load times.

### A. The Join Pruning Mechanism
Looker's SQL generator is designed with **Join Pruning** capability. If a user queries fields from only `orders` and `users`, Looker will *prune* (exclude) the `products` table from the generated SQL, even if `products` is joined in the Explore definition.

> [!IMPORTANT]
> **Avoid the Giant Explore Anti-Pattern**: Do not join 15-20 tables in a single, massive Explore (e.g., a "Master Customer Explore") just to provide a single entry point. Even with join pruning, massive Explores:
> 1.  Saturate Looker's internal compilation memory, resulting in slow metadata loads.
> 2.  Confuse business users with hundreds of irrelevant fields.
> 3.  Increase the risk of unintended Cartesian products and circular join paths.
> 
> **Standard**: Break massive Explores into small, highly targeted, modular Explores centered around a specific business process (e.g., `orders.explore.lkml`, `inventory.explore.lkml`). Use Looker's `extends` or isolated explore files to maintain modularity.

### B. Controlling Join Paths with `required_joins`
If a join path is mathematically dependent on an intermediate table (e.g., joining `orders` to `categories` requires joining through `products` first), and the user only selects a field from `categories`, Looker might fail to join the intermediate `products` table, resulting in a SQL compile crash.

*   **Standard**: Use `required_joins` on the leaf-node join to force Looker to include the intermediate tables in the join path:
    ```lookml
    explore: orders {
      join: products {
        type: left_outer
        sql_on: ${orders.product_id} = ${products.id} ;;
        relationship: many_to_one
      }
      
      join: categories {
        type: left_outer
        sql_on: ${products.category_id} = ${categories.id} ;;
        relationship: many_to_one
        # Forces Looker to include the products join whenever categories are queried
        required_joins: [products] 
      }
    }
    ```

---

## 2. Writing Index-Friendly, SARGable Dimensions

When users apply filters to a dashboard, Looker injects the dimension's `sql:` definition directly into the SQL `WHERE` clause. If your LookML dimension contains SQL functions applied directly to database columns, it renders the query **Non-SARGable** (Search Argumentable), breaking database indexes and forcing slow full table scans.

### Non-SARGable vs. SARGable Standards:

| Inefficient (Non-SARGable) | Efficient (SARGable) | Rationale & Fix |
| :--- | :--- | :--- |
| `sql: LOWER(${TABLE}.email) ;;` | `sql: ${TABLE}.lowercase_email ;;` | **Avoid functions on columns**. Ingest the email as lowercase in the ETL/PDT, apply an index, and read it directly. |
| `sql: CAST(${TABLE}.id AS STRING) ;;` | `sql: ${TABLE}.id ;;` | **Type casting breaks indexes**. Ensure database schemas match so you can join and filter on identical datatypes without casting. |
| `sql: TRIM(${TABLE}.status) ;;` | `sql: ${TABLE}.status ;;` | **Avoid string trimming on-the-fly**. Clean and trim strings during database ingestion or inside a materialized PDT. |
| `sql: DATE_DIFF(CURRENT_DATE(), ${TABLE}.created_at, DAY) ;;` | `sql: ${TABLE}.created_at ;;` | **Avoid math on columns in WHERE**. Filter on the raw datetime column directly and let the database index work. |

#### Example of Index-Friendly LookML:
```lookml
# INCORRECT: Forces database to run LOWER() on every row, bypassing indexes
dimension: user_email_search_slow {
  type: string
  sql: LOWER(${TABLE}.email) ;;
}

# CORRECT: Reads a pre-computed, indexed column directly from the database
dimension: user_email_search_fast {
  type: string
  sql: ${TABLE}.lowercase_email ;; # Pre-computed in ETL/PDT
}
```

---

## 3. Outlawing Heavy Liquid Loops in SQL

Using Liquid templates to loop over values inside a dimension's `sql:` parameter creates massive, deeply nested SQL compilation outputs that degrade database performance.

> [!CAUTION]
> **The Case-When Loop Anti-Pattern**: Loop statements like `{% for item in list %} WHEN ... {% endfor %}` compile into massive SQL `CASE WHEN` statements with hundreds of lines. This slows down Looker's internal compiler and increases database query parsing overhead.
> 
> **Standard**: Never use Liquid loops to compile static database mappings. Instead, join the mapping table directly in the Explore using a clean `many_to_one` relationship, offloading the join to the database engine.

#### INCORRECT:
```lookml
dimension: category_mapping_slow {
  type: string
  sql: 
    CASE
      {% for category in category_list %}
        WHEN ${TABLE}.category_id = {{ category.id }} THEN '{{ category.name }}'
      {% endfor %}
      ELSE 'Other'
    END ;;
}
```

#### CORRECT:
```lookml
# Join the physical mapping table in the Explore instead of hardcoding loops
explore: products {
  join: categories {
    type: left_outer
    sql_on: ${products.category_id} = ${categories.id} ;;
    relationship: many_to_one
  }
}
```

---

## 4. Eliminating Redundant Calculations
*   **Offload Heavy Regex**: If a dimension performs complex regex extraction or substring splitting (`REGEXP_EXTRACT`, `SUBSTR`), and is frequently used for grouping or filtering, **materialize the field**.
*   **ETL Materialization**: Move the regex extraction to your dbt/ETL pipeline, or materialize it inside an **Incremental PDT** with proper partitions and clustering, turning an on-the-fly calculation into a fast index read.
