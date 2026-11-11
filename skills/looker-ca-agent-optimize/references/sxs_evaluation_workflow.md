# `Fast` vs. `Advanced` Optimization Modes, SxS Protocol & Executive Summary

This reference defines the **`Fast` (`Soft`) vs. `Advanced` (`Hard`) Optimization Modes**, the drafting hierarchy, the `Advanced`-mode Side-by-Side (SxS) protocol, and the concise Step 6 Executive Summary + Optional LookML Offer / Developer Handoff for `looker-ca-agent-optimize`.

---

## 1. `Fast` vs. `Advanced` Optimization Modes (Step 1 — Human Gate #1)

Unless the user already explicitly stated `"Fast"`/`"Soft"` or `"Advanced"`/`"Hard"` in their prompt, **always pause at Step 1 (Gate #1)** to ask which optimization depth they prefer (defaulting to **`Fast`** as the recommended first choice, while accepting `"Soft"` and `"Hard"` seamlessly as aliases):

| Mode | Positioning for the User | What Happens Under the Hood | Token Cost & Speed |
| :--- | :--- | :--- | :--- |
| **`Fast` *(Default — Recommended; alias: `Soft`)*** | **Fast Static & Telemetry Tune-Up:** Quickly upgrades the agent's description, human-readable YAML instructions, speed settings, and sample questions without running live chat tests. | Checks caller permissions (`can.update`, `see_system_activity`, `develop`), queries `system__activity` (`conversations_feedback` & `history`) when Admin access is available, inspects core `.lkml` model/views, Explore metadata, and 1-2 live data-profiling queries (`0` CA chat tokens), validates updated Golden Queries via `query` -> `query_url`, backs up the original agent, and applies the upgrade directly. | **`0` live CA tokens** (`~2-3 min`) |
| **`Advanced` *(alias: `Hard`)*** | **Deep Live Benchmark & Trace Optimization:** Tests real questions against the agent (from your Text/CSV/Google Sheet Eval Suite, `system__activity` failures, or Explore), analyzes reasoning traces, validates fixes Side-by-Side on a safe clone, and applies the winning version. | Runs Step 3 static + `system__activity` checks **plus** live baseline chat traces (`3-5` eval questions from user Text/CSV/Sheets or auto-generated), tests fixes on an isolated `[TMP-SXS-EVAL]` clone, runs two-step cleanup, backs up the original agent, and applies the winning upgrade. | **Consumes live CA tokens** (`~5-8 min`) |

---

## 2. Cheapest-First Upgrade Hierarchy (Steps 3 & 4)

Synthesize improvements internally in this priority order:
1. **Refine Description & Structure System Instructions (`context.instructions` in Human-Readable YAML):** Upgrade plain-text, bloated, or XML/`&amp;`-escaped prompts into clean **4-part human-readable YAML** (`<= 4,800` chars, using natural `&`, `<`, `>` symbols and zero `&amp;` or XML tags), address any `Thumbs down` / `Timeout` / `issue_description` pain points from `system__activity` or the user's Eval Suite, inline real categorical filter values, enforce Looker native `"-NULL"` and valid `"30 days ago for 30 days"` syntax, disambiguate metrics using `.lkml` SQL formulas, and add single-query consolidation rules.
2. **Optimize Latency & Source Settings (`code_interpreter`, `sources`):** Turn off unnecessary `"code_interpreter": true` (`-15s to -20s` per query on standard BI Q&A) and prune unused noisy Explores.
3. **Repair or Curate Golden Queries (`Standalone` Only):** Fix broken/zero-row Golden Queries in place (`update_golden_query`) and add 1-3 high-value `query`-verified Golden Queries (`create_golden_query`, `< 20` total cap, `<= 50%` overlap with `Advanced`-mode eval questions; omit on Dashboard Agents).
4. **Note Optional LookML Metadata Gaps (Saved for Step 6 Gate #2):** Track important exposed fields missing `description:` or clear `label:` without touching `.lkml` files during Steps 3-5.
5. **Already-Compliant Agent Early Exit (`Fast` Mode):** If `Fast` mode finds zero configuration, telemetry, or instruction gaps on the agent, report concisely that the agent already follows all best practices without making unnecessary API writes (and mention `Advanced` mode if the user wants live trace benchmarking).

---

## 3. Step 6: Concise Executive Summary & Gate #2 LookML Offer / Developer Handoff

Keep the Step 6 user response **clear, executive-friendly, and free of technical walls** (`~10-15` lines; never use `"Plan A"` / `"Plan B"` labels, 5-option technical menus, or dump raw `Before -> After` YAML/XML code diffs unless the user asks):

### Part 1 — Confirm the Optimized Agent & System Activity Status
- **Agent Optimized:** Bold Agent Name, Agent ID (`<id>`), mode executed (`Fast` or `Advanced`), and confirmation that a full backup was saved to `/tmp/ca_agent_backup_<id>_<ts>.json` (or state clearly if run in **Read-Only Viewer Mode** when `can.update == false`).
- **What Was Improved (Plain Business Language):** 3-4 concise bullets explaining what changed and why it helps users (e.g., *"Converted instructions to clean human-readable YAML without `&amp;` entities"*, *"Clarified USD revenue vs. local currency"*, *"Turned off unnecessary Python processing to speed up answers by ~15-20 seconds"*).
- **System Activity Telemetry Summary:**
  - If `system__activity` returned feedback/history rows: briefly state which real user `Thumbs down`, `Timeout`, or slow query patterns were resolved.
  - If `system__activity` returned `0` rows (new agent/instance): briefly note that `system__activity` had no prior failure records yet.
  - If `system__activity` was inaccessible (`403` non-Admin): include a 1-line tip noting that running with Admin (`see_system_activity`) permissions unlocks historical user feedback and timeout diagnostics.
- **Live Benchmark Result (`Advanced` / `Hard` Mode Only):** Include a compact 3-row **Before vs. After** summary table showing **Accuracy** and **Response Speed (P50/P90)**, flagging an explicit **Metric Trade-off Alert** whenever one metric improves while another degrades (e.g., Accuracy rises while P90 Latency increases) and noting any unjoined-view LookML root cause if the strict 2-round SxS cap is reached.

### Part 2 — Gate #2: LookML Improvements (Developer `Yes / No` vs. Non-Developer Handoff)
Right at the end, if Step 2 identified exposed LookML fields missing `description:` or clear `label:` metadata:
- **If the caller HAS LookML `develop` permission (`has_develop_permission == true`, the default unless `get_project_files` explicitly returned `403`):** End Step 6 with **only** one simple **Yes / No question** in plain language (naming 2-4 example fields, with zero raw `.lkml` code blocks and without appending a developer handoff note):
  > *"I also spotted a few missing descriptions and labels in LookML (for example: `...`). Would you like me to fix those in Looker development mode as well? (**Yes / No**)"*
  Only if the user answers **Yes**, enable `dev_mode` (`{"devMode": true}`), read target `.view.lkml` files via `get_project_file` (targeting `views/refined/` when present), apply surgical additive `description:` / `label:` edits via `update_project_file`, verify **`0` errors** via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<id>.diff`, and confirm concisely.
- **Only if the caller explicitly LACKS LookML `develop` permission (`has_develop_permission == false` / `get_project_files` returned `403`):** Do **not** offer `dev_mode`; instead, replace the Yes/No question with a concise, copy-ready **Note for Your LookML Developer** listing the suggested `description:` / `label:` improvements so the user can email or message them directly to their LookML developer.
