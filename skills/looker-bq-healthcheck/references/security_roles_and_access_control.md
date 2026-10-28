---
type: Reference
title: Security Review, Roles, Permissions & Access Control Guide
description: Diagnostic protocols for auditing user roles, group hierarchies (GBAC), license allocations, and LookML access grants.
tags: [looker, security, gbac, access-grants, user-attributes]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-20T12:00:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-20T14:00:00Z" }
sources:
  - id: access-grants
    resource: /skills/vendor/looker-skills/skills/lookml-access-grants/SKILL.md
    title: LookML Access Grants
---

# Security Review, Roles, Permissions & Access Control Playbook

This reference document defines the diagnostic protocols and remediation workflows for auditing Looker user roles, group hierarchies, license allocations, and LookML access grants.

---

## 🔍 Part 1: How to Review & Diagnose Security Posture

### 1. Group-Based Access Control (GBAC) Hierarchy

```
                  GROUP-BASED ACCESS CONTROL (GBAC) HIERARCHY
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ SAML / Okta / Azure AD IdP Groups                                         │
 │ (e.g. 'Looker-Finance-Explorers', 'Looker-Engineering-Developers')        │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │ (Auto-Synchronized via SAML/SSO)
                                       ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Looker Mirror Groups                                                      │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │ (Role Bound Strictly to Group)
                                       ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Looker Role = [ Permission Set ] + [ Model Set ]                          │
 │ (e.g. 'Finance Explorer' = 'Explore + See SQL' + 'Finance Models')        │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Diagnostic Telemetry Queries (System Activity)

#### A. Audit Direct User Role Assignments (Anti-Pattern)
Identifies individual users who have been granted roles directly rather than inheriting them from groups:
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": [
    "user.id",
    "user.name",
    "user.email",
    "role.name"
  ],
  "filters": {
    "role.embed": "No",
    "user.is_disabled": "No"
  },
  "limit": "50"
}
```

#### B. Orphaned & Empty Groups (0 Users)
```json
{
  "model": "system__activity",
  "view": "group",
  "fields": [
    "group.id",
    "group.name",
    "user.count"
  ],
  "filters": {
    "user.count": "0"
  },
  "limit": "25"
}
```

#### C. Inactive Developer License Proliferation
Locates users assigned expensive Developer licenses who have not logged into Looker for $>90$ days:
```json
{
  "model": "system__activity",
  "view": "user",
  "fields": [
    "user.id",
    "user.name",
    "user_facts.last_ui_login_date"
  ],
  "filters": {
    "user.is_disabled": "No",
    "permission_set.permissions": "%develop%"
  },
  "sorts": ["user_facts.last_ui_login_date asc"],
  "limit": "50"
}
```

---

## 🛠️ Part 2: How to Rectify & Enforce Access Control

### Remediation Protocol 1: Enforce Group-Based Access Control (GBAC)
1. **Unassign Direct Roles**:
   * In **Admin** $\rightarrow$ **Users**, remove directly assigned roles from individual user accounts.
2. **Assign Roles Strictly to Groups**:
   * In **Admin** $\rightarrow$ **Groups**, bind roles (Permission Set + Model Set) to IdP-mirrored groups.

---

### Remediation Protocol 2: Implement Row/Column Level Access Grants
Protect sensitive dimensions or views using native LookML `access_grant:` definitions:

```lookml
# models/ecommerce.model.lkml

# 1. Define Access Grant linked to user attribute
access_grant: can_see_executive_financials {
  user_attribute: department
  allowed_values: [ "executive", "finance", "legal" ]
}

# 2. Restrict sensitive dimensions in view
view: orders {
  dimension: gross_margin {
    type: number
    sql: ${TABLE}.gross_margin ;;
    required_access_grants: [can_see_executive_financials]
    value_format_name: usd
  }
}
```

---

### Remediation Protocol 3: Reclaim Inactive Developer Licenses
* Reassign inactive developer accounts ($>90$ days inactive) to standard Viewer / Explorer permission sets in **Admin** $\rightarrow$ **Users** to free up developer license seats.
