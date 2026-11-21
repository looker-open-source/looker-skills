---
type: Reference
title: Frontend UX Components
description: Chat UI components, data table & CSV export, Vega-Lite chart rendering, and status indicators.
tags: [conversational-analytics, frontend, ux, react]
timestamp: 2026-09-18T00:00:00Z
---

# Frontend Development

- Configure the frontend to call the Cloud Run backend's streaming endpoint and render messages incrementally as they arrive (e.g. show `THOUGHT`/`PROGRESS` as a "thinking..." indicator, then replace with `FINAL_RESPONSE` content, tables, and charts). See `templates/frontend_chat.jsx` for a minimal working example.
- Implement robust error handling and loading states — AI processing and analytics queries can take several seconds to over a minute, and the connection can drop mid-stream.
- Preserve a `conversation_id`/session reference across turns so multi-turn context (e.g. "now break that down by region") is maintained, if the backend uses stateful conversations.
- **CORS:** ensure the backend explicitly allows the frontend's origin.

## Core chat components (input and thread)

- **Input area**: a (usually multiline) text field for the user's natural-language question.
- **Send button**: triggers the call to the API's `chat` method.
- **Message thread**: a scrollable history — user messages typically right-aligned, agent messages left-aligned, rendering plain or formatted text.
- **Session management (sidebar)**: if using stateful conversations, a list of past conversations plus a "New conversation" button to reset context.

## Analytics-specific components (crucial for this API)

The API returns structured data and charts, not just text — the UI must interpret them:

- **Markdown renderer**: the agent's text explanations often include Markdown (lists, bold) and must be formatted properly.
- **Data table & CSV export**: query results come back as tabular data (a `DataMessage` with `result.formattedData` + `result.schema.fields` — see `api-quirks-and-events.md` for the verified shape); use a grid component with pagination or scrolling, and pair it with a "Download CSV" button — this is usually the first thing users ask for once they see a table. Generate the CSV client-side from the same `formattedData` already in the stream (no extra backend round-trip needed): use `schema.fields[].displayName` for column headers (raw field names are often dotted source ids like `transactions.hash`), escape commas/quotes/newlines per field, and prefix the file with a UTF-8 BOM (`﻿`) so Excel opens accented characters correctly. See `templates/frontend_data_table.jsx`.
- **Vega-Lite renderer** (most important): the API generates visualizations as Vega-Lite JSON. Embed a library (`vega-embed` or a framework-specific wrapper) to turn that JSON into an interactive chart.
- **Transparency/debug drawer** (optional but recommended): a "view query" toggle for technical users to inspect the generated SQL or Python.

## Status indicators and UX

Since the API can run heavy queries, handling wait states well matters:

- **"Thinking" indicator**: shows the agent is generating SQL, processing data, or running code.
- **Stop-generation button**: lets the user cancel a long-running request.
- **Streaming updates**: render the message incrementally (typewriter effect) as the stream arrives, rather than waiting for the full response.
- **Error banner**: surface parsing errors, timeouts, or data-access refusals cleanly.
