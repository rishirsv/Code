# Code Monorepo

Monorepo containing several independent projects and a shared prompts library. Each application ships with its own README and setup; this top‑level document gives a high‑level map, common workflows, and contributor guidance.

## Projects

- Personal Capital (`personal-capital/`)
  - Google Sheets + Apps Script toolkit for CSV imports, rule‑based categorization, and financial insights. Includes optional Python scripts for portfolio digests. See `personal-capital/README.md`.

- WatchLater (`watch-later/`)
  - Local‑first YouTube summarizer: React + Vite frontend with a lightweight Node/Express backend for transcripts, storage, and PDF export. See `watch-later/README.md`.

- Substack2Markdown (`substack-to-markdown/`)
  - Placeholder for Substack export utilities. Project‑specific docs will live inside this folder when implemented.

- Prompts (`prompts/`)
  - Curated prompt library and working instructions for planning, tasking, and documentation. See `prompts/create-docs.md`, `prompts/create-prd.md`, `prompts/create-tasks.md`, and `prompts/process-task-list.md`.

## Repository Structure

```text
.
├── personal-capital/         # Google Apps Script + Python utilities
├── watch-later/               # Node/Express + React app
├── substack-to-markdown/        # (placeholder)
└── prompts/                  # Prompt templates and workflows
```

## Getting Started

Prerequisites vary by project; start in the project’s own README. At a glance:

- Node.js 20+ and npm 10+ for JavaScript/TypeScript apps (e.g., `watch-later/`).
- CLASP (`@google/clasp`) for Apps Script deployment (in `personal-capital/`).
- Python 3.10+ if you plan to run optional digest scripts in `personal-capital/`.

Examples:

- WatchLater
  - `cd WatchLater && npm ci && npm run server` (API)
  - In a second terminal: `cd WatchLater && npm run dev` (web)

- Personal Capital
  - `cd personal-capital && clasp login && clasp push`
  - Open the target Google Sheet and use the added menu.

## Development Workflow

This repo includes prompt‑driven workflows for planning and execution (see `prompts/`). Recommended flow for new features:

1) Draft a PRD using `prompts/create-prd.md` and save it under the app’s `docs/`.
2) Break the PRD into tasks with `prompts/create-tasks.md` and stage them in `docs/tasks/`.
3) Execute tasks methodically using `prompts/process-task-list.md`, validating each step with the app’s local tooling/tests.

Bug fixes and refactors can follow the guidance embedded in the prompts (e.g., minimal diffs, prove the fix, and keep public APIs stable).

## Testing

- Run tests from within each project. For example, `watch-later/` uses Jest: `cd WatchLater && npm test`.
- Some projects emphasize manual verification (e.g., Apps Script interactions in `personal-capital/`). Where present, follow the project’s `docs/TEST_INSTRUCTIONS.md` or README guidance.

## Conventions

- Path handling: some directories include spaces (e.g., `personal-capital/`). Quote paths in shells: `cd personal-capital`.
- Commit style: prefer concise, meaningful messages. Conventional Commits are encouraged (e.g., `feat(watchlater): add PDF export` or `fix(personal-capital): handle AMEX date format`).
- Secrets: never commit API keys. Use environment files (e.g., `watch-later/.env`) and provider‑specific auth flows (e.g., `clasp login`).

## Where To Go Next

- Explore a project folder and read its local README for setup and usage.
- Browse `prompts/` to leverage the PRD/task workflows and documentation helpers like `create-docs.md`.
