---
type: Reference
title: Data Agent Context
description: Building Context for BigQuery/Looker data sources, golden queries, streamed chat() calls, and stateful vs. stateless conversations.
tags: [conversational-analytics, data-agent, bigquery, looker]
timestamp: 2026-09-18T00:00:00Z
---

# Data Agent Context (BigQuery, Looker & Other Sources)

> This covers the **direct-API path** (calling `DataChatServiceClient`/`DataAgentServiceClient` yourself). If the project is using ADK instead, see `adk-integration.md` — the `DataAgent` creation steps below still apply (ADK's `DataAgentToolset` wraps the same resource), but the chat/streaming/conversation-state guidance below does not.

Use the `google-cloud-geminidataanalytics` Python package (`from google.cloud import geminidataanalytics`).

## BigQuery data sources

```python
from google.cloud import geminidataanalytics

bigquery_table_reference = geminidataanalytics.BigQueryTableReference()
bigquery_table_reference.project_id = "PROJECT_ID"
bigquery_table_reference.dataset_id = "DATASET_ID"
bigquery_table_reference.table_id = "TABLE_ID"

datasource_references = geminidataanalytics.DatasourceReferences()
datasource_references.bq.table_references = [bigquery_table_reference]
```

Golden queries for BigQuery use `example_queries` on the `Context`:

```python
example_query = geminidataanalytics.ExampleQuery()
example_query.natural_language_question = "Who are our top 10 customers by revenue?"
example_query.sql_query = "SELECT customer_id, SUM(revenue) ... ORDER BY 2 DESC LIMIT 10"
```

## Looker data sources

```python
looker_explore_reference = geminidataanalytics.LookerExploreReference()
looker_explore_reference.looker_instance_uri = LOOKER_INSTANCE
looker_explore_reference.lookml_model = LOOKER_MODEL
looker_explore_reference.explore = LOOKER_EXPLORE

datasource_references = geminidataanalytics.DatasourceReferences()
datasource_references.looker.explore_references = [looker_explore_reference]
```

**Looker authentication** — the `Credentials` proto has a single `oauth` kind with two mutually exclusive forms; pick one and read secrets from environment variables / Secret Manager, never hardcode:
- **Access token** (`OAuthCredentials.TokenBased`, short-lived, obtained via the caller's Looker session): `credentials.oauth.token.access_token = os.getenv("LOOKER_ACCESS_TOKEN")`.
- **Client ID/secret** (`OAuthCredentials.SecretBased`, a.k.a. "Looker API key" in Looker's own docs — it is the *same* field, not a separate mechanism): `credentials.oauth.secret.client_id` / `credentials.oauth.secret.client_secret`. Simplest for prototypes and what the official `ca-api-quickstarts` sample uses; prefer the access-token form for production service-to-service auth where the caller already holds a Looker session.

Set these on **`ChatRequest.credentials`** (top-level field on the chat request) — this is the current, non-deprecated location. `DataAgentContext.credentials` and `LookerExploreReferences.credentials` still exist but are marked deprecated in favor of `ChatRequest.credentials`; don't copy older samples that set credentials there.

If the Looker instance requires encryption-at-rest guarantees beyond Google-managed defaults, note that Looker data sources support **customer-managed encryption keys (CMEK)** — flag this during requirements gathering if the org has a CMEK policy.

Golden queries for Looker use `looker_golden_queries` (natural-language question + the corresponding Looker query) instead of `example_queries`.

## Context and system instructions

```python
context = geminidataanalytics.Context()
context.system_instruction = (
    "You are a data analyst for <company>. Always filter to the most recent "
    "complete quarter unless the user specifies otherwise. Define 'top performer' as ..."
)
context.datasource_references = datasource_references
context.example_queries = [example_query]  # BigQuery only
```

For a **persistent** agent, wrap this in `data_agent.data_analytics_agent.published_context` and create it once via `DataAgentServiceClient.create_data_agent()`; subsequent chat calls reference it by `data_agent_context` (agent name) instead of re-sending the full context.

**Sharing a persistent agent:** a `DataAgent` is a project/location-scoped resource, so grant other users or service accounts access with `DataAgentServiceClient.set_iam_policy()` (and inspect with `get_iam_policy()`) rather than sharing project-wide roles.

## Chat calls are streamed

`DataChatServiceClient.chat()` returns a stream of `Message` objects, not a single response. Each message carries a type such as `THOUGHT`, `PROGRESS`, or `FINAL_RESPONSE`, and may include structured data or a chart/visualization spec:

`ChatRequest.context_provider` is a `oneof` with four mutually exclusive branches: `inline_context` (full `Context`, no agent), `data_agent_context` (persistent agent, no managed conversation history), `conversation_reference` (persistent agent **and** managed history — see below), or `client_managed_resource_context` (caller tracks its own conversation/agent IDs). Pick exactly one:

```python
messages = [geminidataanalytics.Message()]
messages[0].user_message.text = user_text

request = geminidataanalytics.ChatRequest(
    parent=f"projects/{project_id}/locations/{location}",
    messages=messages,
    data_agent_context=data_agent_context,  # or inline_context=context
)

for response in data_chat_client.chat(request=request, timeout=300):
    forward_to_frontend(response)  # relay incrementally, e.g. via SSE/WebSocket
```

Because a single turn can take tens of seconds and arrives incrementally, the backend **must** relay the stream to the frontend as it arrives (Server-Sent Events or WebSocket) rather than buffering the whole response — see `backend-deployment.md`.

## Conversation state: stateful vs. stateless

This is **not** fully orthogonal to persistent vs. inline context: `ConversationReference.data_agent_context` is a required field, so managed history (stateful) can only be paired with a **persistent** `DataAgent` — there's no stateful-conversation-with-inline-context combination.

- **Stateful:** create a `Conversation` resource once (`DataChatServiceClient.create_conversation()`), then on every turn pass `ChatRequest.conversation_reference` with `.conversation` (the resource name) and `.data_agent_context.data_agent` (the persistent agent name). Google Cloud stores and replays prior turns server-side — simplest for a backend that just needs multi-turn follow-ups ("now break that down by region") without managing history itself. List/get/delete conversations via the same client to let users resume or clear past sessions.
- **Stateless:** don't set `conversation_reference` at all — the client resends the full turn history as a list of `Message` objects in `ChatRequest.messages` on every `chat()` call, alongside either `ChatRequest.data_agent_context` (persistent agent) or `ChatRequest.inline_context` (ad hoc context). Gives the backend full control (e.g. to prune, redact, or persist history in its own store) at the cost of managing it manually.

Default to stateful unless there's a specific reason to own history client-side (e.g. custom persistence, redaction before storage, or a stateless/serverless backend that shouldn't hold session affinity).

## Non-visualization data sources: the `QueryData` method (beta)

AlloyDB, Spanner (GoogleSQL), Cloud SQL, and Cloud SQL for PostgreSQL are **not** wired through `DataChatServiceClient.chat()` the way BigQuery/Looker/Looker Studio are. They use the separate, beta **`QueryData`** method instead, and it has real limitations to set expectations on up front:
- No chart/visualization generation — responses are text and structured data only.
- Treat it as a fit for direct NL-to-SQL query answers, not for the richer conversational-agent UX (`THOUGHT`/`PROGRESS` streaming, visualizations) described above.

If the user's primary source is one of these databases, confirm during requirements gathering that the reduced feature set is acceptable before scaffolding a full chat UI around it.
