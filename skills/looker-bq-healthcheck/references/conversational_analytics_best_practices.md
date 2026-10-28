---
type: Reference
title: LookML Best Practices for Conversational Analytics & Gemini Data Agents
description: Authoritative Google Cloud guide for preparing LookML models, Explores, and Data Agent instructions for Conversational Analytics and Gemini in Looker.
tags: [looker, conversational-analytics, gemini, genai, semantic-modeling, data-agents, lookml]
status: stable
generated: { by: looker_healthcheck_agent/v0.2, at: "2026-08-24T16:20:00Z" }
verified: { by: "human:sampitcher", at: "2026-08-24T16:20:00Z" }
sources:
  - id: google-cloud-ca-docs
    resource: https://docs.cloud.google.com/looker/docs/conversational-analytics-looker-best-practices
    title: Best Practices for Configuring Conversational Analytics in Looker
  - id: lookml-modeling-guidelines
    resource: https://github.com/looker-open-source/looker-skills/tree/main/skills/lookml-modeling-guidelines
    title: LookML Modeling Guidelines
---

# LookML Best Practices for Conversational Analytics & Gemini Data Agents

**Conversational Analytics in Looker** uses Gemini for Google Cloud to interpret natural language business questions directly from Looker's semantic layer (LookML).

The accuracy, reliability, and latency of AI-generated responses depend directly on the hygiene of the underlying LookML model, field metadata, and Explore architecture.

---

## 🏛️ 1. The 3 Pillars of AI-Ready LookML

```
                       CONVERSATIONAL ANALYTICS INPUT ARCHITECTURE
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
[1. LOOKML METADATA & SCHEMA]      [2. VALUE SAMPLING & FILTERS]       [3. AGENT INSTRUCTIONS]
• Human labels (no tech shorthand)  • suggestions: [...] list          • Domain-focused (<= 5 Explores)
• Clear descriptions & synonyms     • suggest_dimension optimization    • YAML/Markdown formatting
• hidden: yes on technical IDs      • Centralized dimensions/measures   • Verified Query pairs
```

---

## 🛠️ 2. LookML Field-Level Optimization Checklist

| LookML Issue | Impact on AI / Gemini | Prescribed Solution |
| :--- | :--- | :--- |
| **Naming Conflicts & Shorthand** | Gemini selects wrong dimensions (e.g. selecting `amt_usd_curr` instead of `order_amount_usd`). | Apply clear `label: "Order Amount (USD)"` and add `synonyms: ["sales", "revenue", "turnover"]`. |
| **Missing Descriptions** | Gemini cannot disambiguate metrics with similar business names. | Add `description: "Gross revenue generated before tax and discounts applied."`. |
| **Field Bloat (Raw IDs & FKs)** | Clutters prompt context window and causes Gemini to hallucinate aggregations on foreign keys. | Set `hidden: yes` on all primary keys, foreign keys (`user_id`, `session_id`), and technical surrogate keys. |
| **Uncached Value Sampling** | High warehouse latency when users ask for specific entity names in natural language. | Hardcode known categories with `suggestions: ["Pending", "Shipped", "Delivered"]` or specify `suggest_dimension:` / `suggest_explore:`. |
| **Dashboard-Level Custom Fields** | Custom calculations created in UI are invisible to Conversational Analytics. | Centralize all business calculations as native LookML dimensions and measures. |
| **Data Quality Variations** | Case mismatches (`complete`, `Complete`, `COMPLETE`) cause query filter failures. | Standardize strings in SQL definition: `sql: UPPER(${TABLE}.status) ;;`. |

---

## 📝 3. Production LookML Pattern (Conversational Analytics Ready)

```lookml
view: orders {
  sql_table_name: `<project_id>.<dataset_id>.orders` ;;

  # 1. Primary key marked and hidden from end-user NL search
  dimension: order_id {
    primary_key: yes
    type: number
    hidden: yes
    sql: ${TABLE}.order_id ;;
  }

  # 2. Intuitive label, rich description, and synonyms for Gemini mapping
  dimension: status {
    type: string
    label: "Order Status"
    description: "Current lifecycle state of the order: Placed, Processing, Shipped, Cancelled, or Returned."
    synonyms: ["state", "order condition", "fulfillment status"]
    suggestions: ["Placed", "Processing", "Shipped", "Cancelled", "Returned"]
    sql: UPPER(${TABLE}.status) ;;
  }

  # 3. High-quality measure with value formatting
  measure: total_revenue {
    type: sum
    label: "Total Revenue"
    description: "Sum of sale prices for completed and shipped orders in USD."
    synonyms: ["sales", "gross sales", "turnover", "gross merchandise value"]
    value_format_name: usd
    sql: ${TABLE}.sale_price ;;
  }
}
```

---

## 🤖 4. Data Agent Design & Instruction Best Practices

### A. Domain Specialization (The $\le 5$ Explores Rule)
* **Never** build a single monolithic agent to answer all corporate questions.
* **Build focused agents**: e.g., "Revenue & Orders Agent" (Orders + Products), "Marketing & Campaign Agent" (Ad Events + Web Traffic).

### B. Structured YAML / Markdown Instructions Template
```yaml
# Role & Persona
role: "E-Commerce Revenue & Sales Performance Specialist"
tone: "Concise, authoritative, and data-driven"

# Business Acronyms & Terminology Mapping
terms:
  LY: "Last Year (same period 12 months prior)"
  EOP: "End of Period (last calendar day of selected window)"
  MoM: "Month over Month growth percentage"
  GMV: "Gross Merchandise Value (orders.total_revenue)"

# Default Disambiguation Behavior
defaults:
  date_filter: "If no time period is specified, default to order_items.created_date in 'last 12 months'"
  status_filter: "When users ask about revenue or sales, apply filter orders.status = 'COMPLETED'"
  product_grouping: "When asked to group by product without specifying, group by products.category"

# Follow-Up Proactive Prompting
follow_up:
  - "Offer 2 relevant follow-up questions exploring product categories or return rates."
```

---

## ⚖️ 5. Where to Add Context: LookML vs. Agent Instructions

| Context Type | Where to Add | Why |
| :--- | :---: | :--- |
| **Field Definitions & Formulas** | **LookML** | Single source of truth across Dashboards, Explores, and Gemini. |
| **Synonyms & Labels** | **LookML** | Ensures field mapping works across all connected AI agents. |
| **Suggestions & Value Sampling** | **LookML** | Minimizes database load and accelerates fuzzy token search. |
| **User Role & Business Strategy** | **Agent Instructions** | Tailors responses to executive vs analyst persona. |
| **Default Filtering Rules** | **Agent Instructions** | Resolves conversational ambiguity (e.g. default date ranges). |
| **Follow-Up Suggestions** | **Agent Instructions** | Guides the next logical step in business analysis. |
