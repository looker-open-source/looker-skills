---
type: Reference
title: Feedback Capture
description: 5-star + comment feedback control - UI, turn correlation, and BigQuery storage.
tags: [conversational-analytics, feedback, bigquery]
timestamp: 2026-09-18T00:00:00Z
---

# User Feedback Capture (star rating + comment)

A lightweight feedback control on each agent response is the cheapest signal you have for improving `system_instruction` and golden queries over time (see `data-agent-context.md`) — treat it as a standard component, not an afterthought.

## UI

- **5-star rating**: five clickable stars under each `FINAL_RESPONSE`. Filling a star submits immediately — don't gate it behind a separate "submit" button, most users won't take a second step.
- **Optional comment field**: a text input that appears once a rating is given (or stays visible but collapsed), for free-text detail ("wrong region filter", "chart type didn't fit the data"). Submit on blur or on an explicit small "send" affordance next to it — don't require it.
- **Non-blocking**: feedback submission is fire-and-forget. Never block or error out the chat UI if the feedback call fails; log it client-side and move on.
- **One rating per response**: once submitted, replace the stars with a static "Thanks!" or the chosen rating (disabled) rather than allowing silent re-submission — simpler to reason about than upsert semantics on both ends.

See `templates/frontend_feedback.jsx` for a minimal implementation, wired into `templates/frontend_chat.jsx`.

## Correlating feedback with a turn

**Don't rely on the API's own `messageId`** to key feedback — in testing it was consistently returned as an empty string (`""`) on both `THOUGHT` and `FINAL_RESPONSE` messages. Instead, generate a client-side turn id the moment the user sends a message (`crypto.randomUUID()`), keep it attached to that turn's rendered messages in frontend state, and send it with the feedback payload. This is simpler anyway: it doesn't depend on an API field that may change behavior across versions.

Send at least: `session_id` (or `conversation` resource name if available), `turn_id`, the user's question text, the agent's final answer text, `rating` (1-5), and `comment` (nullable).

## Storing feedback

Write feedback to **BigQuery** — it makes joining feedback against golden-query coverage or usage analysis trivial later, and is the default this skill's templates use.

Create the table once (BigQuery doesn't auto-create tables on insert):

```sql
CREATE TABLE `PROJECT_ID.analytics.feedback` (
  session_id STRING,
  turn_id STRING,
  question STRING,
  answer STRING,
  rating INTEGER,
  comment STRING,
  created_at TIMESTAMP
);
```

Then stream rows in from the backend with `insert_rows_json` — see `templates/backend_sse_relay.py` for the full `POST /feedback` endpoint.

**IAM:** grant the Cloud Run service account `roles/bigquery.dataEditor`, scoped to the dataset (not project-wide) — streaming inserts via `insert_rows_json` only need write access to the table, no `jobUser` role required. See the least-privilege note in `backend-deployment.md`.

**If the app's data source isn't BigQuery** (e.g. Looker-only) and standing up a dataset just for feedback feels like overkill, Firestore is a lower-setup alternative — schemaless, no table to create ahead of time, `roles/datastore.user` instead.
