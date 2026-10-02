# Snowflake to BigQuery Converter Skill

An automated SQL dialect migration skill for LookML projects powered by `looker-cli`. It audits entire Looker projects or targeted LookML files for Snowflake-specific SQL functions, operators, identifier quoting, and semi-structured data syntax, and proposes production-ready BigQuery Standard SQL equivalents.

Built to comply with the **Open Knowledge Format (OKF v0.1)**.

---

## ⚡ Prerequisites

To use this skill, `looker-cli` must be installed and authenticated to your Looker instance:

1. **Installation**: `looker-cli` must be available in your system `PATH`.
   - Follow: [Installing Looker CLI](https://github.com/looker-open-source/looker-skills/tree/main/skills/installing-looker-cli)
2. **Authentication**: Authenticate using OAuth PKCE (recommended) or API credentials.
   - Follow: [Authenticating Looker CLI](https://github.com/looker-open-source/looker-skills/tree/main/skills/authenticating-looker-cli)
3. **CLI Reference**:
   - Reference: [Using Looker CLI](https://github.com/looker-open-source/looker-skills/tree/main/skills/using-looker-cli)

---

## 🚀 How to Use

Invoke the skill by asking the agent to check or migrate your LookML code from Snowflake to BigQuery. You can audit an entire project or a specific file on any branch.

### Required Inputs
- **Looker Instance URL** (e.g., `https://mycompany.looker.com` or Looker Core URL)
- **Project Name** (e.g., `my_empty_project`)
- **Branch Name** (e.g., `master` or `main`)
- *(Optional)* **Target File** (e.g., `views/snowflake_test.view.lkml`)

### Example Prompts
```text
"Check project 'my_empty_project' in https://mycompany.looker.app on branch 'master' for Snowflake syntax and propose BigQuery equivalents."
"Migrate the view 'views/snowflake_test.view.lkml' in the 'my_empty_project' project on branch 'dev-branch' from Snowflake to BigQuery."
```

---

## 🧩 Custom Syntax Mappings (Pluggable Knowledge)

You can easily customize or extend the Snowflake-to-BigQuery translation patterns to match your organization's custom UDFs, macros, or naming conventions:
- Update [`references/syntax_transition.md`](./references/syntax_transition.md) or add your own `.md` reference files into the [`references/`](./references/) directory.
- The agent automatically incorporates any syntax rules in `references/` into its migration audit without requiring custom code or regex rules.

---

## 📂 Bundle Structure

```text
skills/snowflake-to-bigquery-converter/
├── readme.md           # This file
├── index.md            # OKF v0.1 root knowledge index
├── SKILL.md            # Main OKF howto migration procedure
└── references/         # Pluggable SQL dialect & syntax mapping guides
    └── syntax_transition.md
```
