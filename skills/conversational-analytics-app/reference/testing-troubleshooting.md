---
type: Reference
title: Testing & Troubleshooting
description: Local testing, smoke tests, and common failure modes for the Conversational Analytics API.
tags: [conversational-analytics, testing, troubleshooting]
timestamp: 2026-09-18T00:00:00Z
---

# Testing & Local Development

- Run the backend locally with Application Default Credentials (`gcloud auth application-default login`) before deploying, and verify against a low-cost/sandboxed dataset.
- Use `templates/smoke_test.py` (or adapt it) to send one chat turn and confirm a `FINAL_RESPONSE` is received, so regressions in datasource config or auth are caught before deployment.
- If a persistent `DataAgent` is used, note its resource name/ID somewhere in the repo (e.g. `README` or `.env.example`) so it doesn't need to be recreated by hand each time.

# Troubleshooting

- **Cloud Run logs:**
  ```bash
  gcloud run services logs tail <service-name> --region <region>
  ```
- **Auth errors:** confirm Application Default Credentials (local) or the Cloud Run service account (deployed) has the IAM roles needed for both the Conversational Analytics API and the underlying data source (BigQuery/Looker).
- **Looker auth failures:** verify the access token or OAuth client credentials haven't expired and that `LOOKER_ACCESS_TOKEN` (or equivalent secret) is actually injected into the running container, not just set locally.
- **Timeouts / truncated responses:** check the Cloud Run `--timeout` setting and any frontend/proxy timeout — long analytical queries can exceed default limits.
- **Quota errors:** the Conversational Analytics API and underlying BigQuery jobs are subject to project quotas; check Cloud Console quota pages if requests are being rejected under load.
- **Output correctness:** this is early-stage technology — generated SQL/analysis can be wrong even when the response looks confident. Surface generated SQL to users (don't hide it) and encourage spot-checking results against a trusted source before they're used for a decision; don't present agent output as ground truth.
