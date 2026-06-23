---
name: express-server-setup
description: Use when editing apps/server — adding a route, middleware, webhook, or mount point, or wiring CORS, the auth handler, the tRPC adapter, or body parsing in uni-gpt. Read it before changing the server bootstrap so middleware order and body-parsing rules stay correct.
---

# apps/server bootstrap (Express 5 + tRPC + better-auth)

The HTTP entry. Thin: it mounts the better-auth node handler and the tRPC express adapter, then app routes. All real logic lives in `@uni-gpt/api` (procedures), `@uni-gpt/auth` (auth), `@uni-gpt/db`. Runs on `:3000`.

## Middleware order is load-bearing

```ts
const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,                       // cookies — required for sessions
}));

// Raw-body handlers FIRST. better-auth and tRPC read the raw request body
// themselves — NO global express.json() may run before them.
app.all("/api/auth{/*path}", toNodeHandler(auth));
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// JSON parser ONLY for routes added AFTER this line.
app.use(express.json());

app.get("/", (_req, res) => res.status(200).send("OK"));

// Terminal error handler — clean JSON, not an HTML stack trace.
app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
});

app.listen(3000, () => console.log("Server is running on http://localhost:3000"));
```

> 🔴 **The one rule that bites:** mount `/api/auth` and `/trpc` **before** `express.json()`. Both consume the raw body; a global JSON parser ahead of them breaks auth and tRPC. A future webhook/Inngest mount that needs raw body goes **before** the parser too (or brings its own body handling).

## What it imports

| From | What |
|---|---|
| `@uni-gpt/api/router` | `appRouter` (target path; uni-gpt's scaffold currently exports it from `@uni-gpt/api/routers/index` → migrate with [[api-folder-structure]]) |
| `@uni-gpt/api/context` | `createContext` (resolves the session) |
| `@uni-gpt/auth` | `auth` (the better-auth instance) → [[auth-setup]] |
| `@uni-gpt/env/server` | `env` (CORS_ORIGIN, etc.) |

CORS `credentials: true` + the web client sending `credentials: "include"` is what carries the session cookie. In dev the browser talks to same-origin paths proxied by Next rewrites, so `CORS_ORIGIN` is the web origin.

**Target hardening:** add `helmet()` and `app.set("trust proxy", 1)` after the raw-body mounts, and a graceful shutdown (`process.on("SIGINT"/"SIGTERM", ...)` that disconnects the DB before `process.exit()`). uni-gpt's scaffold doesn't have these yet.

## Scripts

| Script | Does |
|---|---|
| `pnpm dev:server` | `tsx watch src/index.ts` |
| `build` | `tsdown` → `dist/index.mjs` |
| `start` | `node dist/index.mjs` |

## Adding to the server

- **A tRPC procedure** → it's already exposed under `/trpc`; add it in `@uni-gpt/api` ([[api-folder-structure]]), not here.
- **A plain HTTP route** (health, simple webhook) → add **after** `express.json()`.
- **A raw-body webhook** (Polar/Stripe/Inngest) → mount **before** `express.json()`, with its own raw-body middleware.
- **New config** → read from `@uni-gpt/env/server`, never `process.env` directly.

## Common mistakes

- **`express.json()` before `/api/auth` or `/trpc`** — silently breaks both.
- **Missing `credentials: true`** on CORS (or `credentials: "include"` on the client) — no session cookie.
- **Business logic in `index.ts`** — it belongs in `@uni-gpt/api` controllers.
- **Reading `process.env`** instead of `@uni-gpt/env`.
