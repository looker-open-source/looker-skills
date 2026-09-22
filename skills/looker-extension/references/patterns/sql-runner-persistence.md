# SQL Runner Persistence Pattern (Backend-less)

This reference documents the pattern for persisting data (like user feedback or state) directly to a database via Looker's SQL Runner APIs, without requiring a custom backend service.

## Concept

Looker Extensions can execute arbitrary SQL (if granted entitlements) using the `create_sql_query` and `run_sql_query` core API methods. This allows the extension to treat a database (like BigQuery) as a persistence layer directly from the frontend.

## Required Entitlements

In `manifest.lkml`, you must request:

```lookml
entitlements: {
  core_api_methods: [
    "create_sql_query",
    "run_sql_query"
  ]
}
```

## Implementation Steps

### 1. Define the SQL Connection
You need to know the name of the Looker connection you are targeting.

### 2. Create and Run SQL

Here is a typical pattern in TypeScript/JavaScript:

```typescript
import { useExtensionContext } from '@looker/extension-sdk-react'

// Inside your component
const { coreSDK } = useExtensionContext()

const persistData = async (data: any) => {
  const connectionName = 'your_connection_name'
  const sql = `
    INSERT INTO \`your_project.your_dataset.your_table\` (id, data, timestamp)
    VALUES ('${data.id}', '${data.content}', CURRENT_TIMESTAMP())
  `

  try {
    // Step 1: Create the SQL Query object
    const sqlQuery = await coreSDK.ok(
      coreSDK.create_sql_query({
        connection_name: connectionName,
        sql: sql
      })
    )

    // Step 2: Run the SQL Query
    // Tip: Use 'csv' format for DML operations to avoid empty JSON issues
    const result = await coreSDK.ok(
      coreSDK.run_sql_query(sqlQuery.slug!, 'csv')
    )
    
    console.log('Data persisted successfully', result)
  } catch (error) {
    console.error('Failed to persist data', error)
  }
}
```

## ⚠️ Gotchas & Best Practices

*   **DML Response Format**: For `INSERT` or `UPDATE` queries, Looker's API might return an empty response or fail to parse as JSON if you request `json` format. Using `csv` or `txt` format for execution usually avoids this.
*   **SQL Injection**: Be extremely careful with string interpolation in SQL queries. Since this runs in the frontend, user input should be sanitized or validated before being included in the SQL string.
*   **Dataset Permissions**: The database user associated with the Looker connection must have write permissions to the target table.
*   **Scratch Schema**: It is often best practice to use Looker's scratch schema (e.g., `looker_scratch`) for this type of persistence to avoid cluttering production datasets.
