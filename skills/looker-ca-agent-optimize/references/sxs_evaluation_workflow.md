# Side-by-Side (SxS) Evaluation & Scorecard Workflow

This reference governs **Step 5 (Drafting & 2-Round SxS Self-Check)** and **Step 6 (Recommendations & SxS Scorecard)** of `looker-ca-agent-optimize`.

---

## 1. Cheapest-First Drafting Hierarchy (Step 5)

When synthesizing candidate improvements from Step 3 (Static Audit) and Step 4 (Trace Diagnosis), prioritize modifications from lowest token/maintenance cost to highest:

1. **Priority 1 — Prune & Simplify System Instructions (`context.instructions`):**
   - Remove redundant prose, duplicated field lists, or conflicting rules that inflate prompt tokens.
   - Restructure plain-text instructions into the 4-part XML/YAML template (`<role_and_tone>`, `<explore_and_filtering_rules>`, `<semantic_and_execution_rules>`, `<presentation_and_analysis_rules>`).
2. **Priority 2 — Agent Metadata & Explore Scoping Settings (`sources`, `code_interpreter`):**
   - Remove unused attached Explores in `sources` if the agent's scope only requires a subset.
   - Default to `"code_interpreter": false` when optimizing for `Latency` or standard BI Q&A.
3. **Priority 3 — Targeted System Instruction Additions:**
   - Add single-query consolidation rules (fixing Thought Loops), inlined categorical value mappings (fixing Field-Sampling Loops), conditional date-filter exceptions (fixing Data-Hunting Loops), Looker native `"-NULL"` string filter syntax, and Dashboard tile-to-measure mappings when `"category": "dashboard"`.
4. **Priority 4 — Golden Queries (`golden_query_ids` — Standalone Agents Only):**
   - Deduplicate or prune low-value golden queries to keep the total count strictly `< 20` (omit on Dashboard Agents).
   - Add 1–3 targeted golden queries (`<= 1` question per entry via `query_url` + `POST /api/4.0/golden_queries`, `<= 50%` overlap with the Eval Suite) for complex join or cohort patterns that failed in Step 4.
5. **Priority 5 — LookML Semantic Layer Metadata:**
   - Propose surgical, additive `description:`, `label:`, `primary_key: yes`, and verified-safe `hidden: yes` patches on `.view.lkml` / `.model.lkml` files (always targeting `views/refined/` when `+view_name` refinements exist).

---

## 2. Two-Round SxS Evaluation Protocol & Two-Step Cleanup (Temporary Agent Copy)

Because Looker API 4.0 does not expose a stateless draft-preview chat endpoint for modified agent configs, execute SxS validation safely without mutating the production agent:

1. **Create Temporary Draft Agent Copy (`[TMP-SXS-EVAL]`):**
   - Register any candidate golden queries (`query_url` + `create_golden_query -`) to obtain integer `golden_query_ids`, then clone the baseline agent via `POST /api/4.0/agents` (`create_agent -`) including mandatory `"name": "[TMP-SXS-EVAL] <Original Agent Name>"`, mandatory `"description"` (copied from baseline), mandatory `"sources"`, `"context": {"instructions": "..."}`, `"code_interpreter"`, and `"golden_query_ids"` (plus `"category": "dashboard"` if cloning a Dashboard Agent).
2. **Round 1 SxS Execution:**
   - Run all questions from the Eval Suite against the temporary agent copy (`create_conversation -` with mandatory `"name"` + `conversational_analytics_chat -` with mandatory `"user_message"`).
   - Compare **Round 1 Accuracy** and **Directional P50 / P90 Latency** against the Step 4 Baseline:
     - **Pass Criteria:** Target metric improves (e.g., Accuracy increases from `6/10` to `9/10` or P50/P90 Latency drops by `> 20%`) with **zero regressions** on previously passing questions -> Proceed to **Step 6**.
     - **Needs Refinement:** If any regression occurs or target questions still fail, inspect Round 1 reasoning traces and proceed to **Round 2**.
3. **Round 2 SxS Execution (Final Cap):**
   - Adjust draft instructions, `code_interpreter`, or golden queries based on Round 1 traces and re-run the Eval Suite.
   - Enforce the strict **2-round cap** (never run Round 3+): if Round 2 improves the target metric, proceed to **Step 6**; if no further net lift is achieved (e.g., due to an unjoined LookML view or missing underlying table), select the better-performing round, document the unresolvable root cause, and exit to **Step 6**.
4. **Mandatory Two-Step Cleanup:**
   - Immediately after evaluation, execute the two-step soft+hard delete (`update_conversation`/`update_agent` with `{"deleted": true}` followed by `delete_conversation`/`delete_agent`, and `delete_golden_query` for unretained golden queries) so zero test entries remain in the Looker UI `Recent` sidebar.

---

## 3. Step 6 Output Format: SxS Scorecard & Two Interactive Execution Plans

Always separate **Plan A (CA Agent Changes)** from **Plan B (Validated LookML Dev-Branch Changes)** before requesting user authorization:

### A. Verdict & Summary
- **Verdict:** `Improved` | `Partial Improvement` | `No Further Optimization Possible` *(state root cause & owner)* | `Audit Only`
- **Metric Trade-off Alert (if applicable):** If Accuracy improved while P50/P90 Latency increased (or vice versa), highlight the trade-off explicitly so the user can decide.

### B. SxS Performance Scorecard (`Optimize` Mode Only)

| Metric | Baseline (Current Agent) | Proposed (Best SxS Round) | Measured Delta / Lift |
| :--- | :--- | :--- | :--- |
| **Accuracy (Ground Truth Match)** | `X of N` (`XX%`) | `Y of N` (`YY%`) | `+Z` questions (`+ZZ%`) |
| **P50 Latency (Directional)** | `XX.Xs` | `YY.Ys` | `-ZZ%` |
| **P90 Latency (Directional)** | `XX.Xs` | `YY.Ys` | `-ZZ%` |
| **Reasoning Loop Failures** | `M` questions with loops | `K` questions with loops | `-L` loops eliminated |

### C. Plan A — CA Agent Configuration Plan (Target: Looker API 4.0 `PATCH /api/4.0/agents/{id}`)
*Where it applies:* Updates the CA Agent in Looker via API 4.0 after saving `/tmp/ca_agent_backup_<agent_id>_<timestamp>.json` (or inline snapshot). Leaves LookML untouched.

| ID | Change Summary | Component (`Instructions` / `Settings` / `Golden Queries`) | Expected Impact | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| `A1` | Restructure `context.instructions` into 4-part XML, use `"-NULL"` filter syntax, and inline categorical filter values | `Instructions` | Eliminates field-sampling and filter retry loops (`-35%` latency) | `Validated in SxS` / `Not validated in SxS` |
| `A2` | Set `code_interpreter: false` (or scope `sources`) in agent settings | `Settings` | Avoids `+15-20s` Python sub-agent overhead on standard queries | `Validated in SxS` / `Not validated in SxS` |
| `A3` | Register verified Golden Queries via `query_url` + `POST /api/4.0/golden_queries` (`< 20` cap, 1 question/entry, `<= 50%` overlap) | `Golden Queries` | Fixes multi-view join path selection | `Validated in SxS` / `Not validated in SxS` |

For each item (`A1..An`), display the complete **`Before -> After`** diff, root cause / trace evidence, and affected questions.

### D. Plan B — Validated LookML Dev-Branch Plan (Target: Looker `dev_mode` via MCP `update_project_file` + `validate_project`)
*Where it applies:* Validated in isolated Looker `dev_mode` (`{"devMode": true}`); never auto-committed to production.

| ID | Target LookML File & View | Change Summary | `[LookML Safety & Impact Check]` | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| `B1` | `views/refined/session_facts.view.lkml` (`+session_facts`) | Surgically add missing `description:` to `session_start` and `session_end` | **Safe (Additive metadata only):** Preserves all existing fields/comments in `+session_facts` refinement layer; zero impact on existing queries or dashboards. | `Not validated in SxS` *(Dev branch)* |

For each item (`B1..Bn`), display the exact surgical **`Before -> After`** LookML snippet diff and its **`[LookML Safety & Impact Check]`**.

### E. Interactive Authorization Menu (Portable Across CLI and MCP-Only Hosts)
Conclude Step 6 by presenting these 5 interactive choices:

1. **Option 1 — Execute Plan A Only:** Save rollback JSON (`/tmp/ca_agent_backup_<agent_id>_<timestamp>.json`) and apply `A1..An` to the CA Agent via Looker API 4.0, leaving LookML untouched.
2. **Option 2 — Execute Plan B Only in `dev_mode`:** Enable `dev_mode` (`{"devMode": true}`), read via `get_project_file`, apply surgical `B1..Bn` edits via `update_project_file`, verify `0` errors via `validate_project` (auto-reverting on any error), and export `/tmp/ca_lookml_patch_<agent_id>.diff` (or inline diff).
3. **Option 3 — Execute Both Plan A & Plan B:** Run `Plan A` and `Plan B` in parallel via subagents when supported by the host, or sequentially otherwise.
4. **Option 4 — Test Plan A First on a Temporary `[TMP-SXS-EVAL]` Agent:** Clone a temporary `[TMP-SXS-EVAL]` agent, run 3-5 test questions Side-by-Side, execute mandatory two-step cleanup (`{"deleted": true}` PATCH + DELETE), and return the live scorecard before modifying the real agent.
5. **Option 5 — Customize Subset or Export Inline Output Only:** Select specific items (`A1..An`, `B1..Bn`) or keep the printed JSON/diff output without calling write endpoints (default for MCP-only chat hosts without `looker-cli`).
