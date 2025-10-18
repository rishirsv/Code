# PRD: Watchlater — MVP (no fallbacks)

## Background

Watchlater is a local‑first tool that converts a single YouTube URL into three tangible artifacts: (1) a free transcript (YouTube captions), (2) a model‑generated summary, and (3) a polished PDF. The ergonomics stay intentionally simple (one command, web + API duo, modular folders), while deliberately avoiding fallbacks such as yt‑dlp or Whisper to keep the MVP narrow, explainable, and easy to ship.

---

## Problem

People frequently “queue” long videos they don’t have time to watch. They want a fast way to scan the gist, file it away, and move on—without cloud sync, accounts, or vendor lock‑in. Current approaches either require paid APIs, fragile browser extensions, or heavy toolchains.

**Success snapshot (KPIs)**  
- **TTS**: Time‑to‑summary ≤ **20 s** for a 10–20 min English YouTube video with available captions on a typical laptop.  
- **Reliability**: **≥ 85%** success rate producing transcript → summary → PDF across a test set of public videos **with English captions**.  
- **Local artifacts**: 100% of outputs written to disk under `exports/` with predictable filenames.

---

## Objectives / Goals

**Goals**  
- Paste a YouTube URL → produce transcript (from YouTube timedtext), summary (via OpenRouter), and downloadable PDF—end‑to‑end in one click.
- Keep everything local‑first: JSON/VTT in `exports/transcripts/`, Markdown in `exports/summaries/`, PDF in `exports/pdf/`.
- Ship a minimal, understanable codebase (Node/Express, Vite/React/TS) with **one** `npm start` that runs both servers.
- Reuse the existing model selector and markdown → HTML → PDF pipeline to minimize new surface area.
- Provide a small, explicit API under `/api` (no versioning yet).

**Non‑goals (MVP)**  
- No audio download, Whisper speech‑to‑text, or yt‑dlp integrations.  
- No non‑YouTube sources.  
- No account system, cloud storage, or database.  
- No summary streaming UX; synchronous only.  
- No retries/fallbacks for missing captions by default (see “Future/Flags”).

---

## Key Features & Scope

### Feature 1 — Transcript Retrieval (YouTube timedtext)

**Description**: POST `/api/transcript` with `{ url, lang?: 'en' }`. Extract `videoId`, fetch `https://www.youtube.com/api/timedtext?...&fmt=vtt`, parse to `{start,dur,text}[]`, save raw `.vtt` and `.json` under `exports/transcripts/`.

**Goal**: Deterministic, free transcript retrieval for videos that already have captions.

**Use case**: “Paste URL and get a transcript excerpt instantly in the UI.”

**Additional details**:  
- Parse VTT cues into segments; store seconds as numbers.  
- Basic metadata fetch (title, channel) via HTML scrape.  
- Return shape: `{ videoId, title, channel }` 

---

### Feature 2 — Model Summary (OpenRouter)

**Description**: POST `/api/summary` with `{ url, modelId }`. Read prior transcript JSON, build prompt from `prompts/youtube-transcripts.md`, call OpenRouter chat completions, write `.md` to `exports/summaries/`.

**Goal**: Deterministic, model‑labeled Markdown summary using the shared model selector inputs.

**Use case**: “Choose model (e.g., GPT‑4o Mini, Claude 3.5 Sonnet), generate concise notes.”

**Additional details**:  
- Include `{ meta: { title, channel, generatedAt, modelId } }` in response.  
- Use env headers (`OPENROUTER_APP_URL`, `OPENROUTER_APP_TITLE`).  
- Non‑streaming for simplicity.

---

### Feature 3 — PDF Rendering

**Description**: POST `/api/pdf` with `{ videoId, markdown, meta }`. Use the shared `markdown-to-html.js` → `pdf-renderer.js` (Puppeteer) pipeline to render and save `exports/pdf/<videoId>-<title>.pdf`. Serve files statically at `/pdf/*`.

**Goal**: Attractive, predictable PDFs with the established base CSS.

**Use case**: “Download a shareable PDF with the summary and metadata.”

**Additional details**:  
- Return `{ filename, downloadUrl }`.  
- Graceful shutdown of the Puppeteer renderer on SIGINT.

---

### Feature 4 — Simple Web UI (Vite + React + TypeScript)

**Description**: Single page at `/` with: URL input, ModelSelector, transcript excerpt, raw Markdown display, and PDF download link. Ports: API `3001`, web `5173`. One command: `npm start`.

**Goal**: Familiar ergonomics and aesthetics that match the original experience.

**Use case**: “Paste → Summarize → Download,” minimal ceremony.

**Additional details**:  
- Reuse the existing model selector components and contexts.  
- Show first ~8 transcript segments as a preview.  
- Clear progress states: `Working…` for transcript, summary, pdf.

---

## Core UX Flow

1. User pastes a YouTube URL.  
2. Client POSTs `/api/transcript` → shows excerpt.  
3. Client POSTs `/api/summary` (with chosen `modelId`) → shows Markdown.  
4. Client POSTs `/api/pdf` → presents `Download PDF` link.

---

## API Endpoints (Contracts)

- **POST `/api/transcript`** → Body: `{ url: string, lang?: string }`  
  Response: `{ videoId, language, segments: [{start:number,dur:number,text:string}][], title, channel }` (no server paths).  
  Errors: `400 invalid url`, `404 captions missing/empty`, `5xx internal`.

- **POST `/api/summary`** → Body: `{ url: string, modelId: string }`  
  Response: `{ videoId, markdown, meta: { title, channel, generatedAt, modelId } }`.  
  Errors: `409 transcript missing`, `400/5xx` otherwise.

- **POST `/api/pdf`** → Body: `{ videoId: string, markdown: string, meta?: object }`  
  Response: `{ filename, downloadUrl }`.  
  Errors: `400 videoId/markdown required`, `5xx` otherwise.

- **GET `/api/health`** → `{ ok: true }`.

---

## Data & Storage

```
exports/
  transcripts/   # <videoId>.<lang>.vtt + <videoId>.<lang>.json
  summaries/     # <videoId>-<safe-title>.md
  pdf/           # <videoId>-<safe-title>.pdf
```
Filenames use a “safe title” sanitizer to avoid filesystem issues.

---

## Environment Variables

**Web**  
- `VITE_MODEL_OPTIONS` — CSV of `id|label` pairs.  
- `VITE_MODEL_DEFAULT` — default model id.

**Server**  
- `OPENROUTER_API_KEY` — required.  
- `OPENROUTER_APP_URL`, `OPENROUTER_APP_TITLE` — optional.  
- `PORT` (default `3001`), `ALLOWED_ORIGINS` (`http://localhost:5173`).

---

## Acceptance Criteria

- Paste a valid YouTube URL with English captions → receive transcript JSON and see an excerpt.  
- Choose a model and produce Markdown saved to `exports/summaries/`.  
- Generate a PDF and download it from `/pdf/...`.  
- `npm start` concurrently runs API (3001) and web (5173).  
- `GET /api/health` → `{ ok: true }`.  
- No usage of Supadata, yt‑dlp, or Whisper.

---

## Risks & Edge Cases

- **Captions missing** → 404 by design (no fallback).  
- **VTT variability** → different timestamp formats; ensure parser resiliency.  
- **OpenRouter errors** → 4xx/5xx handling, rate limits, malformed output.  
- **HTML/Markdown injection** → sanitize untrusted HTML, escape code blocks.  
- **Puppeteer resource usage** → manage Chromium download size, pool reuse, and shutdown.  
- **Filename length / OS limits** → truncate very long safe titles.

Mitigations appear in “Implementation Review & Recommended Changes.”

---

## Implementation Review & Recommended Changes (to ship a sturdier MVP)

**Correctness**
- **VTT regex**: current parser expects `HH:MM:SS.mmm` only; support `MM:SS.mmm` as well.  
  _Change_: Use a regex with optional hours and compute seconds accordingly.
- **`/api/transcript` response**: avoid leaking absolute server paths (`vttPath`, `jsonPath`) to clients.  
  _Change_: Remove from response; keep only metadata and segments.
- **Timedtext “auto captions”**: some videos require `kind=asr`.  
  _Change_: Gate a second request with `&kind=asr` behind a **feature flag** (`ALLOW_ASR=true`), default **off** to honor “no fallbacks.”

**DX & Build**
- **Testing**: swap Jest for **Vitest** for Vite/TS alignment (simpler ESM).  
  _Change_: `"test": "vitest"` and add `vitest` + `@vitest/coverage-v8`.
- **Types**: add `@types/react` and `@types/react-dom`.  
- **Live reload**: add `nodemon` or `tsx --watch` for the API during dev.  
- **Lints**: add minimal ESLint + Prettier configs; include `type: module` aware setup.

**Security & Robustness**
- **URL validation**: whitelist `youtube.com`/`youtu.be` hosts; reject others to avoid SSRF.  
- **Lang validation**: enforce `^[a-z]{2}(-[A-Z]{2})?$`.  
- **Timeouts**: add `AbortController` with 15–20 s timeouts for YouTube and OpenRouter fetches.  
- **Rate limiting**: light `express-rate-limit` default for `/api/*`.  
- **Markdown sanitization**: ensure the renderer strips dangerous HTML.

**Observability & Retention**
- **Request ids & structured logs** for each step.  
- **Retention policy**: optional env (e.g., `RETENTION_DAYS=30`) to prune `exports/` periodically.

All of the above keep the MVP simple while materially improving reliability and safety.

---


## Target Audience

Junior developers. Requirements are explicit, error paths are described, and contracts are copy‑pasteable.

---

## Notes for Next Step

Once approved, generate the implementation task list from this PRD using the project’s task generator guidelines.
