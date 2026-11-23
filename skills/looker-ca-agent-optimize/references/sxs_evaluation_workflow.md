# `Audit` vs. `Optimize` Modes, Cheapest-First Hierarchy & Gate #2 Recommendations

## 1. Mode Selection & Cheapest-First Drafting Hierarchy *(Steps 1, 3 & 4 — Lines 1-16)*

At **Step 1 (Gate #1)**, if the target agent or mode is missing, pause with zero tool calls and ask the user to choose:
- **`Audit` *(Default — Recommended; aliases: `Fast`, `Soft`)*:** Zero live CA chat tokens (`~2-3 min`). Checks caller permissions, `system__activity` telemetry, YAML instructions, `code_interpreter`, Golden Queries, `.lkml` logic, and 1-2 data samples against best practices, marks findings `"Not validated"`, and presents ranked recommendations at Gate #2 for approval before applying.
- **`Optimize` *(aliases: `Advanced`, `Hard`)*:** Uses live CA chat tokens (`2` eval runs, `~5-8 min`). Runs all `Audit` checks plus live baseline vs. `[TMP-SXS-EVAL]` draft clone evaluation across `3-5` questions (from user Text/CSV/Google Sheets Eval Suite, `system__activity` failures, or Explore) and presents the SxS scorecard at Gate #2 for approval before applying.

### Cheapest-First Drafting Hierarchy (Synthesize in Priority Order)
1. **Prune/Simplify & Structure 4-Part Root-Level YAML Instructions (`context.instructions`):** Convert plain-text, bloated, or XML/`&amp;`-escaped prompts into **4-part root-level YAML** (`3,200-4,200` chars target, `<= 4,800` cap, natural `&`/`<`/`>` symbols, zero XML tags or `&amp;` entities). Resolve `Thumbs down` / `Timeout` / `issue_description` pain points, inline verified categorical filter values, enforce Looker native `"-NULL"` and `"30 days ago for 30 days"`, disambiguate measures using `.lkml` SQL formulas, and add single-query consolidation rules.
2. **Optimize Metadata & Latency Settings (`code_interpreter`, `sources`):** Disable unnecessary `"code_interpreter": true` (`-15s to -20s` per turn on standard BI Q&A) and prune unused noisy Explores.
3. **Repair or Curate Golden Queries (`Standalone` Only):** Fix broken/0-row Golden Queries (`update_golden_query`) and draft `1-3` `query`-verified Golden Queries (`create_golden_query`, `< 20` cap, `<= 50%` overlap with eval questions; omit on Dashboard Agents).
4. **Track LookML Metadata Gaps for Gate #2:** Record exposed fields missing `description:`, clear `label:`, or `primary_key: yes` without editing `.lkml` files during Steps 2-4.
5. **No-Gaps Early Exit (`Audit` Mode):** If `Audit` (`Fast`/`Soft`) finds zero gaps, exit with: *"No best-practice gaps found. Run `Optimize` (`Advanced`) to analyze live CA agent behavior."*

---

## 2. Step 5: Recommendations, SxS Scorecard & Gate #2 Approval *(Lines 18-27)*

Keep the Step 5 (Gate #2) response concise and executive-friendly (`~10-15` lines; zero `"Plan A / Plan B"` menus or raw `Before -> After` YAML/`.lkml` code walls unless requested):
- **Header & Verdict:** State **Agent Name**, **Agent ID (`<id>`)**, **Mode (`Audit`/`Fast` or `Optimize`/`Advanced`)**, **Verdict** (**`Improved`** | **`Partial`** | **`No further optimization`** | **`Audit only`**), and confirmation of `/tmp/ca_agent_backup_<id>_<ts>.json`.
- **Ranked Changes Table:** Present a compact table with columns **`#` | `Change (Before -> After & Why)` | `Type` | `Expected Impact` | `Measured in SxS`** (in `Audit`/`Fast` mode, mark `Measured in SxS` as **`Not validated`**; in `Optimize`/`Advanced` mode, report the **bundle-measured** SxS result while labeling per-change impact as **expected**).
- **System Activity Telemetry Status:** State which historical `Thumbs down` / `Timeout` / slow query patterns are addressed, note if `system__activity` had `0` prior rows, or show the 1-line Admin (`see_system_activity`) tip on `403`.
- **SxS Scorecard (`Optimize` / `Advanced` Mode Only):** Show a 3-row **Baseline vs. Proposed** table for **Accuracy (count, e.g., `5 of 5`)** and **Response Speed (directional P50/P90 latency)**. Flag an explicit **Metric Trade-off Alert** if one metric improved while another degraded (letting the user decide), and if 2 SxS rounds failed to improve a question (`Partial` verdict), show the better round, still-failing question, and likely LookML/unjoined-view cause.
- **Gate #2 Approval Prompt (Agent Config + Role-Aware LookML Offer):**
  - If `can.update == false` (**Viewer**): state that the report is in **Read-Only Mode (`Audit only`)** to share with the agent owner/Admin.
  - If `can.update == true`: ask the user to **Approve all changes (or select `#1..#N`, or keep printed output only)** to apply them to the live CA agent—and if Step 2 spotted LookML gaps (or `is_lookml == true`), combine with **one simple Yes / No question** to export/apply the LookML patch in `dev_mode` when `has_develop_permission == true` (or provide a copy-ready **Note for Your LookML Developer** when `has_develop_permission == false`).
