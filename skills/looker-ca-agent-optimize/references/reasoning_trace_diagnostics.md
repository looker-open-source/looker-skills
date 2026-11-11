# CA Agent Reasoning-Trace & System Activity Diagnostics (`Advanced` / `Hard` Mode)

During **Step 2 (`system__activity` Telemetry)** and **Step 4 (`Advanced` / `Hard` Mode — Live Trace & Side-by-Side Optimization)**, inspect historical `system__activity` records (`conversations_feedback` and `history`) and live Conversational Analytics (CA) response traces (`thoughts`, generated Looker queries, and tool invocation logs) for every failing or slow question. Classify each issue internally into the canonical root causes below and apply the corresponding fix in human-readable YAML (summarizing findings to the user in plain, jargon-free business language in Step 6).

---

## 1. Thought Loops, Multi-Query Stacking & Unnecessary `code_interpreter` Overhead

### Symptoms in Reasoning Trace or `system__activity`
- The CA Agent executes 3 to 6+ sequential Looker queries for a single user question instead of retrieving the answer in one consolidated query, or `system__activity.conversations_feedback` shows high end-to-end `latency` / `Timeout` (`answer_success = "Timeout"`).
- **Unnecessary Python Sub-Agent Overhead (`python_and_chart_agent`):** When `"code_interpreter": true` is enabled on the agent, the trace invokes `python_and_chart_agent` even on simple KPI or Top-N tables, adding **`+15s to +20s`** of latency per turn and inflating output token consumption in `system__activity`.

### Targeted Fixes
1. **System Instructions (`semantic_and_execution_rules:` in YAML):** Add a strict single-query consolidation rule instructing the agent to retrieve all required dimensions, measures, and filters in one query.
2. **Agent Settings (`code_interpreter: false`):** Set `"code_interpreter": false` for standard BI Q&A unless Python statistical modeling or forecasting is explicitly required.
3. **Golden Queries (`golden_query_ids`):** Register 1-2 verified multi-field Golden Queries demonstrating the combined query pattern.

---

## 2. Field-Sampling Loops

### Symptoms in Reasoning Trace or `system__activity`
- The CA Agent repeatedly runs `SELECT DISTINCT` or suggestion queries on categorical dimensions to map a user's business term (e.g., `"Enterprise"`, `"Paid"`, `"US"`) to an exact database string, adding `20s-40s` of latency in `system__activity.history`.

### Targeted Fixes
1. **System Instructions (`explore_and_filtering_rules:` in YAML):** Inline verified canonical filter value mappings sampled during Step 2 and instruct the agent not to re-sample mapped fields.
2. **Optional LookML Offer / Developer Handoff (Step 6 Gate #2):** Offer to enrich the dimension's `description:` in LookML `dev_mode` (or include it in the Developer Handoff note if the caller lacks `develop` permission).

---

## 3. Data-Hunting Loops & Literal `"not null"` Filter Retries

### Symptoms in Reasoning Trace or `system__activity`
- **Guessed Narrow Date Windows:** On an undated lifetime or entity lookup question, the CA Agent applies a narrow default date filter that returns `0 rows`, triggering 3-5 retry queries.
- **Literal `"not null"` Filter Mismatch:** Filtering a string dimension by `"not null"` searches for literal text `'not null'` (`0 rows`), forcing retries.

### Targeted Fixes
1. **System Instructions (`explore_and_filtering_rules:` in YAML):** Apply default date windows ONLY to undated general trend/Top-N questions (exempting dataset-overview, lifetime, and specific entity lookups), and always use Looker native `"-NULL"` (and `"-EMPTY"`) syntax.

---

## 4. Semantic & Filter Ambiguity (Including User `Thumbs down` Feedback)

### Symptoms in Reasoning Trace or `system__activity`
- The CA Agent answers quickly in 1 query, but numbers disagree with Ground Truth (or users leave `Rating = "Thumbs down"` and `comments` in `system__activity.conversations_feedback`, or report an `issue_description` in a supplied Text/CSV/Google Sheet Eval Suite) because it picked the wrong LookML measure (e.g., unnormalized local currency instead of USD), wrong date field, or wrong status value (e.g., filtering `status = "ERROR"` when error events actually store `status = "OK"`).

### Targeted Fixes
1. **System Instructions (`semantic_and_execution_rules:` in YAML):** Explicitly bind business terms to verified `view.field` names and real status/category values verified via live `query` in Step 2 (using natural `&`, `<`, `>` symbols and never `&amp;` entities).
2. **Optional LookML Offer / Developer Handoff (Step 6 Gate #2):** Offer to add clear `description:` and `label:` metadata on ambiguous fields in LookML `dev_mode` (or provide a copy-ready Developer Handoff summary for non-developers).
