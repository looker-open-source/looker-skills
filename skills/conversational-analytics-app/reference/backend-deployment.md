---
type: Reference
title: Backend Deployment (Cloud Run)
description: Cloud Run deployment steps, secrets/IAM, and cost controls for the direct-API backend.
tags: [conversational-analytics, cloud-run, deployment, iam]
timestamp: 2026-09-18T00:00:00Z
---

# Backend Development & Deployment (Cloud Run)

> This covers the **direct-API path** (a hand-written FastAPI backend). If the project is using ADK instead, see `adk-integration.md` — deployment goes through `adk deploy cloud_run` and ADK's own `get_fast_api_app()`, not `templates/Dockerfile` + `templates/backend_sse_relay.py`.

- Listen on the port from the `PORT` environment variable (default 8080).
- Include a `Dockerfile` that containerizes the backend — see `templates/Dockerfile` for a starting point.
- Propagate the Conversational Analytics stream to the client incrementally (SSE endpoint or WebSocket) instead of collecting it into one JSON response — Cloud Run supports long-lived HTTP connections but has a request timeout (default 300s, configurable up to 60 minutes); set `--timeout` accordingly for long-running chats. See `templates/backend_sse_relay.py` for a minimal working relay.
- Deploy with `gcloud`:
  ```bash
  gcloud run deploy <service-name> \
    --source . \
    --region <region> \
    --timeout 300 \
    --allow-unauthenticated   # omit / replace with --no-allow-unauthenticated + IAM/IAP if auth is required
  ```
- **Secrets & config:** store API keys, Looker credentials, and other secrets in Google Cloud Secret Manager, mount them as env vars or volumes, and grant the Cloud Run service account `roles/secretmanager.secretAccessor` plus whatever IAM roles the data source requires (e.g. `roles/bigquery.dataViewer`, `roles/bigquery.jobUser`). Never commit secrets or `.env` files to git.
- **Least privilege:** grant the Cloud Run service account only the roles needed for the specific datasets/explores in scope — avoid project-wide `roles/bigquery.admin` or similar broad grants. If you add feedback capture (`reference/feedback-capture.md`), that's a separate `roles/bigquery.dataEditor` grant scoped to the feedback dataset, nothing broader.
- **Cost controls:** for BigQuery-backed agents, set spending limits (custom quotas or `maximum_bytes_billed`) at the project, user, and/or per-query level — a conversational agent can generate exploratory queries a human wouldn't, and an unbounded scan on a large table is easy to trigger by accident.
