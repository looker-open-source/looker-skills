# Create Looker Viz (Generator & Automation Toolkit)

The **Create Looker Viz** skill is an enterprise-grade architectural foundation and code-generation toolkit designed for Google's Gemini CLI and AI agent environments. Built to abstract away the quirks of the Looker Custom Visualizations API, it empowers the AI agent to instantly engineer, compile, and test fully compliant charts in either React/TypeScript or lightweight Vanilla JavaScript.

Whether you need a simple zero-dependency HTML table or a complex Apache ECharts dashboard component, this skill transforms your Gemini CLI agent into a Looker visualization expert.

---

## 1. Core Capabilities & Operating Modes

This skill provides a workflow, but adapts its generation based on your preferred technology stack:

### Mode A: React/TypeScript (Enterprise Grade)
Accelerate your development cycle by bootstrapping a 100% type-safe, modular React project. The agent leverages the local Python utility `create_looker_viz.py` to generate:
*   Pre-configured Vite build pipeline and `tsconfig.json`.
*   Strict TypeScript typings mapping to the Looker `queryResponse`.
*   A robust `useLookerData` React Hook to cleanly manage the Looker component lifecycle.
*   Interactive templates for Chart.js, ECharts, and native HTML tables.

### Mode B: Vanilla JavaScript (Lightweight & Zero-Dependency)
Generate lean, high-performance visualizations without the overhead of the React virtual DOM. The agent dynamically strips the boilerplate to provide:
*   A pure `main.js` Looker API wrapper (`looker.plugins.visualizations.add`).
*   A clean, React-free `package.json` and `vite.config.ts`.
*   Direct DOM manipulation templates ready for D3.js or native HTML APIs.

---

## 2. Advanced Feature Standards Enforced

This skill guarantees the implementation of strict Looker-specific best practices:

### A. Native Fidelity & CSP Security
Visualizations must feel like native Looker components while adhering to enterprise security constraints:
1.  **Content Security Policy (CSP):** The AI is strictly forbidden from using inline HTML event handlers (e.g., `onclick=...`). All events are bound programmatically.
2.  **Typography & Spacing:** Explicit enforcement of Looker's `Google Sans` fonts and standard grid margin spacing (e.g., 55px left, 40px bottom) to seamlessly blend into dashboards.
3.  **Localhost Font Checks:** Prevents 404 console errors during offline testing by wrapping font declarations in local environment checks.

### B. Interactive Drill Menus & Data Shapes
A chart is useless if it's not interactive. This skill enforces Looker's native interactivity:
1.  **Native Drill Passthrough:** Captures native DOM click events and correctly passes them back to the Looker API to trigger dashboard drill menus.
2.  **Reality Mapping:** The agent is instructed to ask for a representative Looker Explore URL or Query Slug to fetch the real data shape before writing any rendering logic.
3.  **Shape Validation:** Validates dimension and measure counts at runtime, using `this.addError()` to display native Looker error boundaries if a user configures the chart incorrectly.

---

## 3. Architectural Blueprint & Progressive Disclosure

To maximize the AI's token efficiency and maintainability, this skill is architected using Jetski's gold standards:

*   **The Brain (`SKILL.md`)**: The core YAML frontmatter and operational directives.
*   **The Engine (`scripts/create_looker_viz.py`)**: A 130-line CLI code generator that drives the interactive `viz-config.json` workflow.
*   **The Blueprints (`templates/`)**: 21 native code assets (`.tsx`, `.ts`, `.json`) offering full syntax highlighting for human maintainers.
*   **The Library (`references/`)**: Uses **Progressive Disclosure** via `file://` links to provide the AI with deep-dive Looker API documentation only when it encounters complex bugs.
*   **The Reference (`examples/`)**: A fully working, compiled Vanilla JS prototype that the AI can dynamically read to self-correct its own code.
