---
type: Reference
title: Spectacles & Looker Content Validator CI/CD Setup Guide
description: Implementation guide for automated LookML syntax and Content Validation in continuous integration pipelines.
tags: [spectacles, ci-cd, github-actions, content-validator]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: spectacles-repo
    resource: "https://github.com/spectacles-ci/spectacles"
    title: Spectacles CI Documentation
    author: "team:spectacles"
---

# Spectacles & Looker Content Validator CI/CD Setup

This reference guide details how to implement automated LookML syntax and Content Validation in continuous integration pipelines.

---

## 1. CI/CD Pipeline Architecture

```
                  ┌─────────────────────────────────────┐
                  │    Git Pull Request Created / Pushed │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │  Step 1: LookML Compiler Validation │
                  │  `looker-cli project validate`      │
                  └──────────────────┬──────────────────┘
                                     │ (Passes Syntax)
                                     ▼
                  ┌─────────────────────────────────────┐
                  │  Step 2: Content Validator Scan     │
                  │  (Compares branch vs production)    │
                  └──────────────────┬──────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼ (0 Broken Tiles)                              ▼ (Errors Found)
    ┌───────────────────────────────┐              ┌─────────────────────────────────┐
    │ ✅ PR Check Passed (Mergeable)│              │ ❌ PR Blocked: Broken Dashboards│
    └───────────────────────────────┘              └─────────────────────────────────┘
```

---

## 2. CLI Validation Workflow

### Step 1: Validate LookML Project
```bash
looker-cli project validate <project_id> --verify-ssl=false
```

### Step 2: Run Instance Content Validation
```bash
looker-cli api content_validator run_content_validation --verify-ssl=false
```

### Step 3: Inspect Broken Dashboard Elements
The Content Validator API returns an array of broken items. Each item includes:
- `dashboard.id` and `dashboard.title`
- `dashboard_element.id` and `dashboard_element.title`
- `error_type` (e.g. `unknown_field`, `filter_expression_error`)
- `message` (e.g. `Field 'users.legacy_status' no longer exists`)
