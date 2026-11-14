# CA Agent Reasoning-Trace & System Activity Diagnostics (`Advanced` / `Hard` Mode)

Load this reference **only in `Advanced` (`Hard` / `Optimize`) mode** during Step 4. Inspect historical `system__activity` records (`conversations_feedback` and `history`) and live CA chat traces (`systemMessage.text` where `textType == "THOUGHT"`, `systemMessage.data.generatedLookerQuery`, and tool logs) for each failing or slow eval question, map each issue to the 4 canonical root causes below, and apply the targeted fix in 4-part root-level YAML:

## 1. Thought Loops, Multi-Query Stacking & `code_interpreter` Overhead
- **Trace / Telemetry Symptoms:** Agent executes `3-6+` sequential Looker queries for one question, or `conversations_feedback` shows high `latency` / `answer_success = "Timeout"`. When `"code_interpreter": true` is enabled, `python_and_chart_agent` triggers on standard KPI/Top-N tables, adding **`+15s to +20s`** per turn and inflating token usage.
- **Fixes:**
  1. **`semantic_and_execution_rules:` (YAML):** Add a strict single-query consolidation rule retrieving all dimensions, measures, and period comparisons in one query.
  2. **Agent Setting:** Set `"code_interpreter": false` unless Python statistical modeling or forecasting is explicitly required.
  3. **Golden Queries (`golden_query_ids`):** Register `1-2` verified multi-field Golden Queries demonstrating the consolidated query pattern.

## 2. Field-Sampling Loops
- **Trace / Telemetry Symptoms:** Agent repeatedly runs `SELECT DISTINCT` or suggestion queries on categorical dimensions to map business terms (`"Enterprise"`, `"Paid"`, `"US"`) to exact database strings, adding `20s-40s` in `system__activity.history`.
- **Fixes:**
  1. **`explore_and_filtering_rules:` (YAML):** Inline verified canonical filter value mappings sampled during Step 2 and instruct the agent never to re-sample mapped fields.
  2. **Gate #2 LookML Offer / Handoff:** Offer to add valid categorical values to the dimension's LookML `description:` in Step 6.

## 3. Data-Hunting Loops & Literal `"not null"` Filter Retries
- **Trace / Telemetry Symptoms:**
  - **Narrow Guessed Date Window:** On an undated lifetime or specific entity/ID lookup, the agent applies a narrow default date filter returning `0 rows`, triggering `3-5` widening retries.
  - **Literal `"not null"` String Filter:** Filtering a `type: string` dimension by `"not null"` queries `= 'not null'` (`0 rows`), forcing retries.
- **Fixes:**
  1. **`explore_and_filtering_rules:` (YAML):** Apply default date windows (`"30 days ago for 30 days"`) **only** to undated general trend/Top-N questions (exempting dataset-overview, lifetime, and entity/ID lookups), and enforce Looker native `"-NULL"` (or `"-NULL,-EMPTY"`).

## 4. Semantic & Filter Ambiguity (Including `Thumbs down` & Eval `issue_description`)
- **Trace / Telemetry Symptoms:** Agent answers in 1 fast query, but numbers disagree with Ground Truth (or users leave `Rating = "Thumbs down"` / `comments` in `conversations_feedback`, or report an `issue_description` in the Text/CSV/Google Sheet Eval Suite) due to picking the wrong measure (e.g., local currency vs. USD, or `type: sum` density fraction vs. `type: average`), wrong date dimension, or wrong status code.
- **Fixes:**
  1. **`semantic_and_execution_rules:` (YAML):** Bind business terms explicitly to verified `view.field` names and real status/category values verified via live `query` in Step 2 (using natural `&`, `<`, `>` symbols and zero `&amp;` entities).
  2. **Gate #2 LookML Offer / Handoff:** Offer to add clear `description:` and `label:` metadata on the ambiguous LookML fields in Step 6.
