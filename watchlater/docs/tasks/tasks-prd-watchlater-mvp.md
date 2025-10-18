## Relevant Files

- `package.json` - Define scripts for running API and web servers together with `npm start`.
- `server/index.ts` - Express bootstrap, middleware, and health endpoint wiring.
- `server/routes/transcript.ts` - Handle `/api/transcript` requests and orchestrate transcript retrieval.
- `server/routes/summary.ts` - Handle `/api/summary` requests, load transcripts, and trigger OpenRouter calls.
- `server/routes/pdf.ts` - Handle `/api/pdf` requests and stream rendered PDFs back to the client.
- `server/services/youtube-timedtext.ts` - Fetch and parse YouTube timedtext feeds into JSON/VTT artifacts.
- `server/services/openrouter-client.ts` - Wrap OpenRouter chat completion calls and shared prompt formatting.
- `server/services/pdf-renderer.ts` - Convert Markdown → HTML → PDF using Puppeteer, manage lifecycle.
- `server/utils/file-storage.ts` - Ensure export directories exist, sanitize filenames, and persist artifacts.
- `server/tests/transcript.test.ts` - Unit/integration coverage for transcript retrieval logic and error modes.
- `server/tests/summary.test.ts` - Verify summary generation flows, transcript prerequisites, and OpenRouter errors.
- `server/tests/pdf.test.ts` - Exercise PDF rendering pipeline and failure handling.
- `web/src/App.tsx` - Single-page UI shell with URL input, progress states, and result panes.
- `web/src/components/TranscriptPreview.tsx` - Render first transcript segments and metadata.
- `web/src/components/SummaryPanel.tsx` - Display Markdown summary, model selector, and PDF download link.
- `web/src/hooks/useApi.ts` - Shared fetch helpers for transcript/summary/pdf requests and status management.
- `web/src/tests/App.test.tsx` - Validate the end-to-end happy path and major error surfaces in the UI.
- `exports/` - Local filesystem outputs for transcripts, summaries, and PDFs (ensure created on startup).

### Notes

- Group backend tests under `server/tests/` and frontend tests under `web/src/tests/`; run with `npm test`.
- Use `.env` / `.env.local` for sensitive values (`OPENROUTER_API_KEY`, `VITE_MODEL_OPTIONS`, etc.).
- Prefer async/await with explicit error mapping so API responses align with the PRD contracts (`400`, `404`, `409`, `5xx` cases).

## Tasks

- [ ] 1.0 Establish project scaffolding and shared tooling
  - [ ] 1.1 Configure `package.json` workspaces or scripts so `npm start` concurrently launches API (`3001`) and web (`5173`), plus a unified `npm test`.
  - [ ] 1.2 Initialize TypeScript, ESLint, and ts-node/ts-jest configs for both server and web packages.
  - [ ] 1.3 Set up `.env` loading for server and web, documenting required variables in `README.md`.
  - [ ] 1.4 Create `exports/` subdirectories (`transcripts`, `summaries`, `pdf`) and ensure they are ignored by git but created at runtime.

- [ ] 2.0 Implement transcript retrieval pipeline (`/api/transcript`)
  - [ ] 2.1 Add route/controller that validates the YouTube URL and optional language before processing.
  - [ ] 2.2 Extract `videoId` and fetch timedtext VTT (`fmt=vtt`) with sensible timeouts, handling YouTube error responses.
  - [ ] 2.3 Parse VTT cues into `{ start, dur, text }` JSON and persist both `.vtt` and `.json` under `exports/transcripts/`.
  - [ ] 2.4 Scrape video metadata (title, channel) and return the response payload specified in the PRD.
  - [ ] 2.5 Write tests covering success, invalid URL (`400`), and missing captions (`404`) scenarios.

- [ ] 3.0 Implement summary generation pipeline (`/api/summary`)
  - [ ] 3.1 Reuse transcript JSON to build the prompt defined in `prompts/youtube-transcripts.md`, including model selection inputs.
  - [ ] 3.2 Create an OpenRouter client that uses env-provided headers (`OPENROUTER_APP_URL`, `OPENROUTER_APP_TITLE`) and handles errors gracefully.
  - [ ] 3.3 Persist the Markdown summary with sanitized filename under `exports/summaries/` and return `{ videoId, markdown, meta }`.
  - [ ] 3.4 Enforce preconditions (404/409 when transcript missing) and add unit/integration coverage for happy and failure paths.

- [ ] 4.0 Implement PDF rendering pipeline (`/api/pdf`)
  - [ ] 4.1 Adapt existing Markdown → HTML → PDF utilities into a `server/services/pdf-renderer.ts` module with graceful startup/shutdown.
  - [ ] 4.2 Expose `/api/pdf` route that validates required fields, generates the PDF, saves under `exports/pdf/`, and responds with filename + download URL.
  - [ ] 4.3 Serve the `exports/pdf/` directory statically and ensure Puppeteer teardown on SIGINT.
  - [ ] 4.4 Add tests for successful renders and error handling when Markdown or `videoId` is missing.

- [ ] 5.0 Build MVP React UI workflow
  - [ ] 5.1 Implement the landing page with URL input, model selector, and action buttons that call API endpoints in sequence.
  - [ ] 5.2 Show progress states (“Working…”) and error messages for each stage (transcript, summary, PDF).
  - [ ] 5.3 Render transcript excerpts, Markdown summary, and a PDF download link once available.
  - [ ] 5.4 Write component-level tests (or RTL tests) covering the happy path and notable error flows.

- [ ] 6.0 QA, polish, and documentation
  - [ ] 6.1 Add logging and metrics hooks (e.g., request duration, errors) to aid debugging without external services.
  - [ ] 6.2 Document setup, environment variables, and usage steps in `README.md`, including sample commands and troubleshooting notes.
  - [ ] 6.3 Dry-run the end-to-end flow with sample captioned videos, capturing results and verifying KPIs (time-to-summary, success rate).
  - [ ] 6.4 Track open follow-up items (future fallbacks, retries) in `docs/` for post-MVP planning.
