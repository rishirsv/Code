# Project Plan — Reesh MCP

## 1. Background & Intent

We are shipping a tiny personal MCP server that exposes personal finance and fitness data as MCP tools so modern MCP clients (e.g., ChatGPT in Developer Mode) can call them. To keep this a learning build and get fast feedback, we will:

- Skip auth.
- Focus on Streamable HTTP (`POST /mcp`).
- Stand up one end-to-end vertical slice.
- Include an easy deployment path to Cloudflare (remote MCP) because ChatGPT Developer Mode currently connects only to remote MCP servers.

### Data Sources

- **Finance (Google Sheets)** — read-only ranges/values for balances and transactions via a Service Account (`spreadsheets.values.get`) returning normalized shapes tailored to the finance tools.
- **Fitness (Hevy REST API)** — fetch recent workouts and personal records (PRs) using a Hevy API token. The Hevy API is a Hevy Pro feature; the service exposes official docs and developer settings for key generation.

## 2. Goals

### Core

- Minimal remote MCP server reachable via Streamable HTTP at a single endpoint (`POST /mcp`). Default to JSON responses; SSE is optional later.
- Provide two strict tool families:
  - `hevy_get_recent_workouts`, `hevy_get_prs`
  - `sheets_get_range`, `finance_get_balances`, `finance_get_transactions`
- Ensure Cloudflare-friendly deployment so ChatGPT Developer Mode can access it remotely, plus ship a simple local dev server.
- Keep dependencies thin, maintain a clear file tree, support one-command tests, and write a concise README (Run / Test / Deploy).

### Non-goals (Learning Slice)

- No OAuth/PKCE, secrets UI, write tools, legacy SSE compatibility, or rate limiting.
- Treat the above as backlog aligned with the “strip it down” instruction.

## 3. Users & Stories

- **Builder / Learner**
  - “I can run it locally, hit `/mcp`, and get JSON back from a tool call.”
  - “I can deploy to Cloudflare, paste the public URL into ChatGPT Developer Mode, and run the tools.”
- **MCP Client (ChatGPT Developer Mode)**
  - “I can discover tools via `tools/list` and call them with validated parameters.”

## 4. Functional Scope (Tools)

- `sheets_get_range` → `{ values: string[][], range }`
- `finance_get_balances` → `{ accounts: { name, balance, currency? }[] }`
- `finance_get_transactions` → `{ transactions: { date, description, amount, category? }[] }`
- `hevy_get_recent_workouts` → `{ workouts: { id, date, durationMin?, exercises: { name, sets: [{ reps?, weight? }] }[] }[] }`
- `hevy_get_prs` → `{ prs: { exercise, bestWeight?, bestReps?, date? }[] }`

## 5. Transport

- Target Streamable HTTP only: single `/mcp` endpoint accepting JSON-RPC 2.0 requests and returning JSON (default) with optional SSE later.
- Reference the Model Context Protocol spec for endpoint shape, Accept headers, and optional session handling (kept minimal here).

## 6. Authentication

- None for this learning slice. Protect upstream calls with environment tokens only:
  - `HEVY_API_TOKEN` (optional; when absent, serve mock data to keep tests working).
  - `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SHEETS_ID` (optional; mock spreadsheet ranges otherwise).

## 7. Session Management

- Not required yet. Do not mint `Mcp-Session-Id`. Resumability is deferred.

## 8. Error Strategy

- Use JSON-RPC protocol errors for schema issues or unknown tools.
- Return structured tool-level errors for upstream failures (“tool execution error” with helpful messages).

## 9. Observability

- Console logs with request IDs and minimal timing logs around adapters.
- Structured logging is backlog.

## 10. Risks & Mitigations

- **Hevy API availability / token scope** — mitigate with local mock data and explicit environment checks.
- **Google Sheets auth friction** — use a Service Account with read-only scopes, document setup, and mock when env vars are missing.
- **Transport mismatch** — adhere strictly to Streamable HTTP spec; add SSE later if needed.
- **ChatGPT Developer Mode remote-only constraint** — highlight requirement in README and ensure Cloudflare deployment path.

## 11. Acceptance Criteria

- `POST /mcp` successfully handles `initialize`, `tools/list`, and `tools/call` for `hevy_get_recent_workouts` (mocked) returning HTTP 200 and JSON responses.
- Deploy to Cloudflare Workers with a public URL serving `/mcp`.
- README includes a runbook for adding the connector in ChatGPT Developer Mode and executing a tool call.

## 12. Minimal Slice Delivery

### Proposed File Tree

```
mcp-personal/
├─ src/
│  ├─ server.ts
│  ├─ index.ts
│  ├─ transports/http.ts
│  ├─ tools/
│  │  ├─ hevy.ts
│  │  ├─ sheets.ts
│  │  └─ finance.ts
│  ├─ adapters/
│  │  ├─ hevy-client.ts
│  │  └─ sheets-client.ts
│  ├─ util/normalize.ts
│  └─ config.ts
├─ tests/
│  ├─ http.mcp.test.ts
│  ├─ hevy.tool.test.ts
│  └─ sheets.tool.test.ts
├─ samples/
│  ├─ hevy-sample.json
│  └─ sheets-sample.json
├─ public/authorize.html         # placeholder, future auth work
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ .env.example
├─ README.md
└─ cf-worker/worker.ts           # Cloudflare Worker entry for remote MCP
```

### `package.json` (excerpt)

```json
{
  "name": "mcp-personal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --env-file=.env.local --watch ./dist/server.js",
    "build": "tsc -p tsconfig.json",
    "start": "node --env-file=.env.local ./dist/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.1",
    "express": "^4.19.2",
    "zod": "^3.23.8",
    "google-auth-library": "^9.14.1",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.10",
    "supertest": "^7.0.0",
    "typescript": "^5.6.3",
    "vitest": "^2.0.5"
  }
}
```

The implementation follows the TypeScript SDK’s Streamable HTTP transport example (Express + `StreamableHTTPServerTransport`).

### `src/index.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerHevyTools } from "./tools/hevy.js";
import { registerSheetsTools } from "./tools/sheets.js";
import { registerFinanceTools } from "./tools/finance.js";

export function makeServer() {
  const server = new McpServer({
    name: "personal-mcp",
    version: "0.1.0"
  });

  registerHevyTools(server, { z });
  registerSheetsTools(server, { z });
  registerFinanceTools(server, { z });

  server.setInstructions("Personal MCP: finance from Google Sheets; fitness from Hevy.");
  return server;
}
```

### `src/transports/http.ts`

```ts
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { makeServer } from "../index.js";

export function makeHttpApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const server = makeServer();

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true
    });

    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}
```

### `src/server.ts`

```ts
import { makeHttpApp } from "./transports/http.js";

const port = Number(process.env.PORT || 8787);
makeHttpApp().listen(port, () =>
  console.log(`MCP server: http://localhost:${port}/mcp`)
);
```

### `src/tools/hevy.ts`

Defines `hevy_get_recent_workouts` and `hevy_get_prs`, delegating to adapter functions and returning both text and structured content.

### `src/adapters/hevy-client.ts`

- Defaults to `https://api.hevyapp.com`.
- Reads `HEVY_API_TOKEN`; returns sample data when missing to keep development smooth.
- Fetches workouts and PRs, normalizing shapes, handling partial responses, and falling back gracefully on errors.

### `src/tools/sheets.ts`

- Registers `sheets_get_range` using the `getRange` adapter.
- Supports optional `sheetId` override and `valueRenderOption`.

### `src/tools/finance.ts`

- Implements `finance_get_balances` and `finance_get_transactions` using `getRange`.
- Applies simple normalization (drop headers, map rows, optional filtering by `since`).

### `src/adapters/sheets-client.ts`

- Uses `google-auth-library` with Service Account credentials to call `spreadsheets.values.get`.
- Returns mock samples when environment variables are missing or API calls fail.

### Cloudflare Worker (optional)

`cf-worker/worker.ts` mounts the MCP server using Cloudflare’s Agents SDK for Streamable HTTP (`/mcp`) with a future option for SSE (`/sse`).

## 13. Tests

- `tests/http.mcp.test.ts` — integration flow validating JSON-RPC (`initialize`, `tools/list`, `tools/call` on `hevy_get_recent_workouts`).
- `tests/hevy.tool.test.ts` — ensures Hevy adapter returns sample data without a token.
- `tests/sheets.tool.test.ts` — ensures Sheets adapter returns mock balances range.

## 14. README Highlights

- **Run** — copy `.env.example` → `.env.local`, set optional env vars, install dependencies, build, start, and connect via MCP Inspector.
- **Test** — run `npm run build` then `npm test`.
- **Deploy** — document Cloudflare Workers deployment (template path and manual mount) plus ChatGPT Developer Mode connector setup.
- **Setup** — detail Google Sheets and Hevy configuration, including mock-mode behavior.

## 15. Validation Checklist

Commands:

```bash
npm install
npm run build
npm start

curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"clientInfo":{"name":"curl"},"protocolVersion":"2025-03-26"}}' \
  http://localhost:8787/mcp | jq

curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  http://localhost:8787/mcp | jq

curl -s -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hevy_get_recent_workouts","arguments":{"limit":1}}}' \
  http://localhost:8787/mcp | jq
```

Manual verification:

- `GET /healthz` returns `{ ok: true }`.
- MCP Inspector connects to `http://localhost:8787/mcp` and lists/calls tools.
- Cloudflare Worker deployment responds at `/mcp`.
- ChatGPT Developer Mode connector executes tool calls against the remote endpoint.

## 16. Next Steps (Backlog)

- Add SSE compatibility (`/sse`) for older clients.
- Introduce OAuth/token scopes once we move past the learning build.
- Add session storage (e.g., Redis, Workers KV) for resumability.
- Configure CI (typecheck, tests, Wrangler deploy).
- Implement rate limiting, structured logs, and richer docs (client examples, screenshots).

## 17. References

- Model Context Protocol — Streamable HTTP and session guidance.
- TypeScript SDK examples (Express + Streamable HTTP).
- ChatGPT Developer Mode’s remote-only MCP support.
- Cloudflare remote MCP routing (`serve('/mcp')`, `serveSSE('/sse')`).
- Hevy API docs and access model.
- Google Sheets values API and `valueRenderOption` usage.

## 18. `.env.example` (excerpt)

```
PORT=8787

# Google Sheets (optional; mock data served when unset)
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...","client_id":"..."}

# Hevy (optional; mock data served when unset)
HEVY_API_TOKEN=your-hevy-token
HEVY_BASE_URL=https://api.hevyapp.com
```
