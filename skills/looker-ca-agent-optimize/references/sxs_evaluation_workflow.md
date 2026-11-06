# `Soft` vs. `Hard` Optimization Modes, SxS Protocol & Executive Summary

This reference defines the **`Soft` vs. `Hard` Optimization Modes**, the drafting hierarchy, the `Hard`-mode Side-by-Side (SxS) protocol, and the concise Step 6 Executive Summary + Optional Yes/No LookML Offer for `looker-ca-agent-optimize`.

---

## 1. `Soft` vs. `Hard` Optimization Modes (Step 1 — Human Gate #1)

Unless the user already explicitly stated `"Soft"` or `"Hard"` in their prompt, **always pause at Step 1 (Gate #1)** to ask which optimization depth they prefer (defaulting to **`Soft`** as the recommended first choice):

| Mode | Positioning for the User | What Happens Under the Hood | Token Cost & Speed |
| :--- | :--- | :--- | :--- |
| **`Soft` *(Default — Recommended)*** | **Fast Static Tune-Up:** Quickly upgrades the agent's description, instructions, speed settings, and sample questions without running live chat tests. | Inspects the agent config, core `.lkml` model/views, Explore metadata, and 1-2 live data-profiling queries (`0` CA chat tokens), validates any updated Golden Queries via `query` -> `query_url`, backs up the original agent, and applies the upgrade directly. | **`0` live CA tokens** (`~2-3 min`) |
| **`Hard`** | **Deep Live Benchmark & Trace Optimization:** Tests real questions against the agent, analyzes how it thinks, validates improvements Side-by-Side on a safe clone, and applies the winning version. | Runs Step 3 static checks **plus** live baseline chat traces (`3-5` eval questions; if the user didn't provide questions, offer to auto-generate 3-4 realistic questions from the Explore or accept theirs), tests fixes on `[TMP-SXS-EVAL]`, runs two-step cleanup, backs up the original agent, and applies the winning upgrade. | **Consumes live CA tokens** (`~5-8 min`) |

---

## 2. Cheapest-First Upgrade Hierarchy (Steps 3 & 4)

Synthesize improvements internally in this priority order:
1. **Refine Description & Structure System Instructions (`context.instructions`):** Upgrade plain-text or bloated prompts into clean 4-part XML/YAML (`<= 4,800` chars), inline real categorical filter values, enforce Looker native `"-NULL"` and valid `"30 days ago for 30 days"` syntax, disambiguate metrics using `.lkml` SQL formulas, and add single-query consolidation rules.
2. **Optimize Latency & Source Settings (`code_interpreter`, `sources`):** Turn off unnecessary `"code_interpreter": true` (`-15s to -20s` per query on standard BI Q&A) and prune unused noisy Explores.
3. **Repair or Curate Golden Queries (`Standalone` Only):** Fix broken/zero-row Golden Queries and add 1-3 high-value `query`-verified Golden Queries (`< 20` total cap, `<= 50%` overlap with `Hard`-mode eval questions; omit on Dashboard Agents).
4. **Note Optional LookML Metadata Gaps (Saved for Step 6 Yes/No Offer):** Track important exposed fields missing `description:` or clear `label:` without touching `.lkml` files during Steps 3-5.
5. **Already-Compliant Agent Early Exit (`Soft` Mode):** If `Soft` mode finds zero configuration or instruction gaps on the agent, report concisely that the agent already follows all best practices without making unnecessary API writes (and mention `Hard` mode if the user wants live trace benchmarking).

---

## 3. Step 6: Concise Executive Summary & Gate #2 Optional LookML Offer *(Yes / No)*

Keep the Step 6 user response **clear, executive-friendly, and free of technical walls** (`~10-15` lines; never use `"Plan A"` / `"Plan B"` labels, 5-option technical menus, or dump raw `Before -> After` XML code diffs unless the user asks):

### Part 1 — Confirm the Optimized Agent
- **Agent Optimized:** Bold Agent Name, Agent ID (`<id>`), mode executed (`Soft` or `Hard`), and confirmation that a full backup was saved to `/tmp/ca_agent_backup_<id>_<ts>.json` (mentioning you can restore the previous version in one step anytime).
- **What Was Improved (Plain Business Language):** 3-4 concise bullets explaining what changed and why it helps users (for example: *"Clarified USD revenue vs. local currency"*, *"Turned off unnecessary Python processing to speed up answers by ~15-20 seconds"*, *"Updated 3 verified sample questions"*).
- **Live Benchmark Result (`Hard` Mode Only):** Include a compact 3-row **Before vs. After** summary table showing **Accuracy** and **Response Speed (P50/P90)**, flagging an explicit **Metric Trade-off Alert** whenever one metric improves while another degrades (e.g., Accuracy rises while P90 Latency increases) and noting any unjoined-view LookML root cause if the strict 2-round SxS cap is reached.

### Part 2 — Gate #2: Simple Yes / No Question for Optional LookML Improvements
- Right at the end, if Step 2 identified exposed LookML fields missing `description:` or clear `label:` metadata, ask **one simple Yes / No question** in plain language (naming 2-4 example fields, with zero raw `.lkml` code blocks):
  > *"I also spotted a few missing descriptions and labels in LookML (for example: `...`). Would you like me to fix those in Looker development mode as well? (**Yes / No**)"*
- **If the user answers No:** Acknowledge briefly and finish.
- **If the user answers Yes:** Enable `dev_mode` (`{"devMode": true}`), read target `.view.lkml` files via `get_project_file` (targeting `views/refined/` when refinements exist), apply surgical additive `description:` / `label:` edits via `update_project_file`, verify **`0` errors** via `validate_project` (auto-reverting on any error), save `/tmp/ca_lookml_patch_<id>.diff`, and confirm concisely that the updates are validated on their development branch.
