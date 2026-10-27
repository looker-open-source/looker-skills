---
name: conversational-analytics-app
description: >-
  Use this skill when the user requests to create, deploy, or manage a conversational analytics application featuring a backend on Google Cloud Run and a web frontend.
type: Agent Skill
title: Conversational Analytics App Guide
tags: [cloud-run, conversational-ai, jetski, python, frontend]
timestamp: 2026-09-15T00:00:00Z
---

# Conversational Analytics Application Guide

This skill provides instructions and best practices for building a conversational analytics application with a backend deployed on Google Cloud Run and a frontend. The AI service to use is the **Conversational Analytics API**: `geminidataanalytics.googleapis.com` ([overview](https://docs.cloud.google.com/gemini/data-agents/conversational-analytics-api/overview)).

## 0. Requirements Gathering & Scaffolding Preferences

Before writing any code, ask the user to clarify:

- **Tech stack**
  1. Frontend framework: React + Vite, Next.js, Streamlit, or other?
  2. Backend language/framework: Python (FastAPI/Flask) or Node.js (Express)?
  3. **Backend integration approach**: call the Conversational Analytics API directly, or through Google's **Agent Development Kit (ADK)**? This changes the backend implementation, deployment tooling, and the frontend's streaming contract — confirm it before scaffolding anything. See `reference/adk-integration.md`.
  4. Authentication: Google Cloud IAP, Firebase Auth, or public/unauthenticated?
  5. GCP project ID and region.
- **Data agent context**
  1. Primary data source: BigQuery, Looker, or Looker Studio (full agent API, with visualizations) — or AlloyDB, Spanner, or Cloud SQL (the separate `QueryData` method, beta, **no visualization support**)? This choice changes the implementation path, so confirm it before scaffolding — see `reference/data-agent-context.md`.
  2. Specific tables, views, or Looker explores the agent should connect to.
  3. Business definitions and **golden queries** the agent should know, plus whether a semantic layer (LookML, or structured YAML metadata for BigQuery-only) already exists — semantic layers meaningfully improve query accuracy and are worth building if the agent will run non-trivial queries.
  4. Default behaviors/filters the agent must always apply (e.g. "filter to the most recent quarter").
- **Persistence model**: does the app need a reusable `DataAgent` resource (context published once, referenced by ID), or is stateless inline context per request sufficient? This affects whether `DataAgentServiceClient` is needed in addition to `DataChatServiceClient` — see `reference/data-agent-context.md`.
- **Feedback capture**: does the app need a 5-star + comment control on responses? Cheap to add and a good default to recommend — it's the main signal for improving golden queries and `system_instruction` later. See `reference/feedback-capture.md`.
- **Scaffolding location**: ask whether generated files should go into a `bundle/` directory (untracked by git) or elsewhere. Do not scaffold into the root workspace without confirming the location first.

## 1. Architecture Overview

- **Backend:** A containerized service (Python/FastAPI or Flask, or Node.js/Express) exposing a REST API that wraps the Conversational Analytics API and streams responses back to the frontend. This is the **direct-API path**; the alternative is wrapping the API in Google's **ADK** instead, which comes with its own FastAPI scaffolding, CLI, and deployment flow — see `reference/adk-integration.md` for the fork and don't mix guidance from both paths.
- **Frontend:** A web app (React or Next.js) providing the chat UI and rendering the agent's text, generated SQL, tables, and charts.
- **Deployment:** The backend runs on Google Cloud Run for serverless autoscaling; the frontend can be static-hosted (Firebase Hosting, Cloud Storage + CDN) or served by the same container.
- **Streamlit is the exception to the above split:** it's a single Python process that is both UI and API caller in the same request/rerun cycle — there's no separate REST backend, no SSE/WebSocket relay, and no CORS to configure. This is exactly what the official `ca-api-quickstarts` sample does, and it's explicitly **local-only** (no Cloud Run deployment). Only follow the Cloud Run and streaming guidance below when the frontend is React/Next.js with its own backend process.
- **Data agent:** Either a **persistent `DataAgent`** resource (context authored once via `DataAgentServiceClient`, then referenced by ID on every chat call) or **stateless inline context** (the full `Context` object sent on every `chat()` call). Prefer a persistent agent when context (golden queries, business definitions) is stable and reused across users; use inline context for quick prototypes or per-user/per-session customization.
- **Conversation state:** chats can be **stateful** — Cloud manages turn history in a persistent `Conversation` resource, referenced across requests — or **stateless** — the client resends prior turns with every request. Not fully independent of the choice above: stateful history can only be paired with a persistent agent, not inline context. See `reference/data-agent-context.md`.

## 2. Reference Files

Load these as needed rather than all at once — each covers one part of the build:

- [`reference/data-agent-context.md`](reference/data-agent-context.md) — building `Context` for BigQuery/Looker, golden queries, streamed `chat()` calls, stateful vs. stateless conversations, the `QueryData` beta method for AlloyDB/Spanner/Cloud SQL.
- [`reference/backend-deployment.md`](reference/backend-deployment.md) — Cloud Run deployment, secrets/IAM, cost controls.
- [`reference/frontend-ux.md`](reference/frontend-ux.md) — chat UI components, data table/Vega-Lite rendering, status indicators.
- [`reference/testing-troubleshooting.md`](reference/testing-troubleshooting.md) — local testing, smoke tests, and common failure modes.
- [`reference/api-quirks-and-events.md`](reference/api-quirks-and-events.md) — protobuf enum serialization gotchas, LRO handling, and the full stream `Message` event type reference.
- [`reference/feedback-capture.md`](reference/feedback-capture.md) — 5-star + comment feedback control: UI, turn correlation, and BigQuery storage.
- [`reference/adk-integration.md`](reference/adk-integration.md) — direct API vs. Agent Development Kit (ADK): tradeoffs, `DataAgentToolset` wiring, `adk deploy cloud_run`, and how it changes the frontend streaming contract.

## 3. Templates

[`templates/`](templates/) has starting points to adapt (not generate from scratch):

- `Dockerfile`, `requirements.txt` — Cloud Run container for a Python backend.
- `backend.env.example`, `frontend.env.example` — every env var the templates below read, with what each does and where it's documented in more detail.
- `backend_sse_relay.py` — FastAPI `/chat` endpoint relaying the Conversational Analytics stream over SSE, plus `/feedback` for star-rating capture.
- `frontend_chat.jsx` — minimal React component consuming that SSE endpoint, with the feedback control and data table wired in.
- `frontend_feedback.jsx` — the 5-star + comment feedback control on its own; see `reference/feedback-capture.md`.
- `frontend_data_table.jsx` — renders a `DataMessage` result as a table with a "Download CSV" button; see `reference/frontend-ux.md`.
- `smoke_test.py` — sends one chat turn and verifies a `FINAL_RESPONSE` comes back; see `reference/testing-troubleshooting.md`.
