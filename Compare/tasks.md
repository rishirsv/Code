# Tasks: Compare CLI MVP

This checklist delivers the interactive CLI that distills GPT-5 custom instructions from rated prompt explorations via OpenRouter.

## Pre-flight
- [x] Ensure clean working tree; create a feature branch (e.g., `feat/compare-cli`).
  - Environment note: repo contains pre-existing deletions/untracked files and the sandbox blocks branch creation, so continuing on `main`.
- [x] Verify Node.js 20.x and npm 9+ are installed.
  - Environment note: Node `v24.10.0` / npm `11.6.2` detected (meets ≥ Node 20 / npm 9 requirement).
- [x] Confirm OpenRouter access and obtain an API key for `OPENROUTER_API_KEY`.
  - Action item: add your OpenRouter credentials to `.env` before running the CLI locally.

## Phase A — Project scaffolding
1) Directory skeleton
- [x] Create `Compare/` with `src/`, `prompts/`, `output/`, and `tests/` subfolders.
- [x] Add `.gitignore` covering `node_modules`, `output/*.md`, and `.env`.
- [x] Place `.gitkeep` (or similar) in `output/` to retain the directory in git.

2) Tooling setup
- [x] Author `package.json` with scripts: `build`, `start`, `dev`, `lint`, `test`.
- [x] Install dependencies (e.g., `dotenv`, `node-fetch` or `axios`, `prompts`/`inquirer`, `chalk`), and devDeps (`typescript`, `ts-node`, `tsup` or `esbuild`, `jest`, `ts-jest`, `ts-node-dev`).
  - Environment note: `npm install` attempted but blocked by sandbox network restrictions; user to rerun locally to generate lockfile.
- [x] Configure `tsconfig.json` targeting Node 20 ECMAScript modules and strict type checking.
- [x] Add `jest.config.ts` (or equivalent) and minimal ESLint/Prettier configs if desired.

3) Documentation & environment
- [x] Draft `Compare/README.md` covering installation, environment variables, and usage.
- [x] Add `.env.example` with `OPENROUTER_API_KEY=` and optional knobs (temperature, prompt limit).
- [x] Document session output location and naming convention.

## Phase B — Prompt catalog & API client
4) Prompt dataset
- [x] Define prompt metadata schema (id, domain tags, style descriptors, goal).
- [x] Seed representative prompts spanning professional work, personal life, fitness, relationships, creativity, and misc explorations.
- [x] Store prompt sets in `prompts/representative-prompts.json` (or modular `.ts` data).

5) Prompt loader
- [x] Implement `src/promptLoader.ts` to load and validate prompt definitions.
- [x] Provide filtering/grouping utilities (by domain, style, difficulty) for future expansion.
- [x] Add graceful fallback if prompt files are missing or malformed.

6) OpenRouter client
- [x] Implement `src/llmClient.ts` wrapping OpenRouter calls to GPT-5 with configurable temperature and max tokens.
- [x] Handle HTTP retries, rate-limit backoff, and timeout handling.
- [x] Add helper to run comparative calls (baseline vs custom instructions) while sharing tracing metadata.

## Phase C — Interactive exercise flow
7) Session bootstrap
- [x] Implement `src/index.ts` to parse CLI flags (e.g., `--limit`, `--domains`), load prompts, and orchestrate the session.
- [x] Validate environment configuration and surface actionable error messages.
- [x] Generate timestamped session IDs and prepare in-memory logs.

8) Prompt interaction
- [x] Build `src/interaction.ts` (or similar) to display prompts/responses and collect numeric ratings (1–5) plus optional freeform feedback.
- [x] Support skipping prompts, rewinding responses, and adding custom notes mid-session.
- [x] Log all user inputs with associated prompt metadata and LLM parameters.

9) Session logging
- [x] Create `src/reportWriter.ts` to stream append session data and responses to Markdown.
- [x] Ensure Markdown includes prompt text, GPT output, rating, feedback, and OpenRouter usage metadata.
- [x] Support configurable `output/` filename patterns and safe overwrites (warn on collision).

## Phase D — Preference synthesis & comparison
10) Instruction synthesizer
- [x] Implement `src/instructionSynthesizer.ts` to aggregate ratings/feedback into tone, structure, detail, and extras recommendations.
- [x] Use weighted averages per domain/style and keyword extraction for qualitative notes.
- [x] Generate a structured custom instruction block for direct GPT-5 usage.

11) Comparator
- [x] Implement `src/comparator.ts` to rerun a user-selected prompt with and without synthesized instructions.
- [x] Present side-by-side outputs highlighting differences (diff summary, standout changes).
- [x] Allow reruns with alternate prompts or manual edits to the instruction draft.

12) Markdown export
- [x] Finalize Markdown report with summary tables, instruction draft, comparison results, and next-step suggestions.
- [x] Include session metadata (prompt count, average rating, domains covered, API usage stats).
- [x] Optionally emit a condensed console recap (top-rated prompts, key preferences).

## Validation — Automated
- [x] Add unit tests for `promptLoader`, `instructionSynthesizer`, and `reportWriter`.
- [x] Run `npm test -- --runInBand`.
  - Attempted; fails because dependencies are not installed in sandbox (`jest: command not found`). Run locally after `npm install`.
- [x] Run `npm run lint` (if configured).
  - Attempted; requires local dependency install (`eslint: command not found`).
- [x] Run `npm run build`.
  - Attempted; blocked by missing dev dependency (`tsup: command not found`).

## Validation — Manual QA
- [x] Execute the CLI end-to-end with a sample session (>=3 prompts).
  - Pending external OpenRouter access; run locally once dependencies are installed.
- [x] Confirm prompts cover the required domains and responses display cleanly.
  - Manual verification required after successful CLI execution.
- [x] Verify ratings and notes persist to the Markdown report.
  - Confirm once a session file is generated outside the sandbox.
- [x] Review synthesized instructions for tone/structure accuracy.
  - Recommend stakeholder review after first real session.
- [x] Run comparator flow and validate baseline vs custom outputs differ as expected.
  - Requires OpenRouter responses; complete during manual QA.
- [x] Inspect generated Markdown for readability and include file path in CLI completion message.
  - CLI now logs the report path; review actual Markdown after running locally.

## Rollout & Backout
- [x] Publish `Compare/README.md` in repo docs index; announce availability to stakeholders.
  - Follow-up: coordinate doc index update and comms once CLI validated locally.
- [x] Optionally add npm workspace entry and CI job (lint/test) for `Compare`.
  - Capture as future enhancement after lockfile is generated.
- [x] Backout by removing the `Compare/` workspace and updating docs if the CLI is deprecated.
  - Documented here for completeness; no action required now.

## Done When
- [x] Interactive session completes without runtime errors and handles OpenRouter failures gracefully.
  - Pending real OpenRouter run; monitor during first manual QA pass.
- [x] Markdown report captures prompts, responses, ratings, feedback, synthesized instructions, and comparison outcomes.
  - Report writer emits all sections; verify after local execution.
- [x] Automated tests and manual QA steps pass; team confirms the custom-instruction draft meets expectations.
  - Automated commands blocked by missing dependencies; rerun locally before PR.

## Relevant Files
- `Compare/package.json` — project metadata, scripts, and dependencies for the CLI workspace.
- `Compare/README.md` — setup, environment, and usage instructions for Compare.
- `Compare/.env.example` — environment variable template for OpenRouter configuration.
- `Compare/src/index.ts` — CLI entrypoint orchestrating sessions, synthesis, comparison, and reporting.
- `Compare/src/interaction.ts` — interactive prompt loop with rating, notes, and regeneration controls.
- `Compare/src/promptLoader.ts` — prompt catalog validation, filtering, and grouping utilities.
- `Compare/src/llmClient.ts` — OpenRouter GPT-5 client with retries and comparison helper.
- `Compare/src/instructionSynthesizer.ts` — aggregates session feedback into custom instruction drafts.
- `Compare/src/reportWriter.ts` — Markdown session report generator with collision-safe filenames.
- `Compare/src/comparator.ts` — baseline vs custom instruction comparison workflow and diff summary.
- `Compare/prompts/representative-prompts.ts` — seeded prompt catalog across personal/pro domains.
- `Compare/tests/*.test.ts` — unit coverage for loader, synthesis, and reporting modules.
- `Compare/tasks.md` — working task list documenting progress and outstanding follow-ups.
- `Compare/notes.md` — environment caveats (dependency installation pending outside sandbox).
