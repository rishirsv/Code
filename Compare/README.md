# Compare CLI

Interactive CLI for synthesizing GPT-5 custom instructions by rating OpenRouter prompt runs.

## Features
- Streams representative prompts across work, personal, fitness, and relationship domains.
- Captures per-prompt ratings and freeform feedback from the CLI.
- Synthesizes tone/structure/detail preferences into draft custom instructions for GPT-5.
- Generates Markdown session reports under `output/` for later review.

## Requirements
- Node.js >= 20 (tested with 24.10.0)
- npm >= 9
- OpenRouter API key with GPT-5 access

## Setup
```bash
npm install
```

## Environment
Set your OpenRouter key in a `.env` file (see `.env.example`):

```bash
cp .env.example .env
echo "OPENROUTER_API_KEY=sk-or-..." >> .env
```

## Usage
- `npm run dev` — start the interactive CLI with live TypeScript execution.
- `npm run build && npm start` — generate and run the bundled CLI entrypoint.

Session transcripts and synthesized instructions are written to `output/session-*.md`.
