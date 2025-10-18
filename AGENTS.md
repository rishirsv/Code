# Repository Guidelines

## Project Structure & Module Organization

```text
.
├── personal-capital/   # Apps Script + Python finance toolkit
├── watch-later/         # React + Vite frontend, Node/Express backend
├── substack-to-markdown/  # Substack export utilities (placeholder)
└── prompts/            # Prompt workflows and documentation helpers
```

Each app maintains its own README and docs. Work inside the target folder; avoid cross‑project changes unless intentional.

## Build, Test, and Development Commands

- watch-later
  - Install: `cd watch-later && npm ci`
  - Run API: `npm run server` (port 3001)
  - Run Web: `npm run dev` (port 5173)
  - Tests: `npm test`
- Personal Capital
  - Deploy: `cd personal-capital && clasp login && clasp push`
  - Optional Python utilities: `python3 process_net_worth.py`

Tip: Quote paths that include spaces, e.g., `cd personal-capital`.

## Workflow

Use prompt‑driven flow for changes:
1) Create a PRD (prompts/create-prd.md). Save under `<app>/docs/PRDs/`.
2) Generate tasks (prompts/create-tasks.md). Save under `<app>/docs/tasks/`.
3) Execute using prompts/process-task-list.md and validate locally.

Bug fix
- Reproduce first; add a failing test when feasible.
- Branch `fix/<issue#>-<slug>`; make the minimal change.
- Commit `fix(scope): one‑line summary`.
- Prove the fix (test or clear steps) before opening PR.
- Confirm before: deletions >20 lines or any dependency changes.

Refactor
- Improve structure/readability without changing behavior.
- No public API or type signature changes.
- Commit as `refactor(scope): …` and run tests before/after.

## Coding Style & Naming Conventions

- Follow per‑project configs (e.g., `watch-later/eslint.config.js`).
- Naming: directories `kebab-case`, React components `PascalCase`, variables/functions `camelCase`.
- Secrets: never commit keys; use env files (e.g., `watch-later/.env`).

## Testing Guidelines

- watch-later: Jest + ts‑jest in `tests/`; name files `*.test.ts`. Run `npm test`.
- Personal Capital: validate flows in Google Sheets UI; attach steps and screenshots.

## Commit & Pull Request Guidelines

- Conventional Commits encouraged: `feat`, `fix`, `refactor`, `docs`, etc.
- PRs: link issues, summarize changes, risks, and rollback. Add screenshots for UI changes.


### Naming Policy
- Top-level directories: kebab-case (e.g., `personal-capital`, `watch-later`).
- Files: kebab-case for assets and docs; language-idiomatic for code (e.g., React components in `PascalCase.tsx`).
- Avoid spaces in any file or folder names.
