---
name: uni-gpt
description: Critical conventions and verified-API reference for building the uni-gpt AI chat app (this repo). Use when executing a plan/NN-*.md phase, or when adding/editing Mastra agents, better-auth config, Polar billing, Inngest jobs, the chat/RAG/browser features, Prisma schema, or env vars in uni-gpt — it carries the pinned versions, v1 API gotchas, and the mandatory Mastra supply-chain pin rule that old tutorials get wrong.
---

# uni-gpt build conventions

This repo is built phase-by-phase. **Before coding, read** the master spec `docs/superpowers/specs/2026-06-18-uni-gpt-design.md` (Appendix A = pinned versions + API gotchas) and the relevant `plan/NN-*.md`. Honor `CLAUDE.md` + `AGENTS.md`.

## 🔴 Mastra supply-chain (do this every time you install)
- Pin **exact** `@mastra/*` versions. Use `@mastra/core@1.43.0` — **NEVER `1.42.1`** (compromised 2026-06-17, `easy-day-js` dropper in 140+ `@mastra/*` pkgs).
- `pnpm install --ignore-scripts` for the first Mastra install, then audit. After ANY install: `grep -c easy-day-js pnpm-lock.yaml` must be `0`.
- Keep `minimumReleaseAge: 1440` + `blockExoticSubdeps: true` in `pnpm-workspace.yaml`.

## Mastra v1 (1.43.0) — APIs old tutorials get wrong
- Streaming: `agent.stream()` (V2/AI-SDK) and `agent.streamLegacy()`. **No `streamVNext`.**
- Get + call: `mastra.getAgentById('id').generate()/.stream()`. Agents need an **`id`**.
- Memory args: **nested** `{ memory: { thread, resource, options } }`. Flat `{ threadId, resourceId }` is `@deprecated`.
- Tools: `createTool({ id, description, inputSchema, outputSchema, execute })`; **`execute` receives input as the FIRST positional arg** (`async input => {}`), not `{ context }`.
- `model`: a string gateway id (`'openai/gpt-4o-mini'`) OR a raw AI-SDK `LanguageModelV2` instance (use the OpenRouter instance for one-key chat).
- MCP: `mcp.listTools()` / `listToolsets()` (not `getTools`).
- Embedded in Express: `new Mastra({...})` + call agents directly; no `mastra dev`/`build` needed. pgvector extension must pre-exist.

## Other pinned facts (see spec Appendix A for snippets)
- OpenRouter: `@openrouter/ai-sdk-provider@^2.9` on `ai@^6`; set `usage:{include:true}` to read `providerMetadata.openrouter.usage.cost` for credit debit; runtime model via `runtimeContext`; reasoning off by default.
- Embeddings: `text-embedding-3-small` (1536-dim) — OpenRouter doesn't serve embeddings.
- better-auth: bump to `1.6.19`; passkey/sso are **separate pkgs** `@better-auth/passkey` / `@better-auth/sso`; client method is `requestPasswordReset` (not `forgetPassword`); schema gen `npx auth@latest generate --adapter prisma` then reconcile into multi-file `prisma/schema/`.
- Polar: built-in `webhooks()` helper (avoid `@polar-sh/express` — express 4 only); renewal = `order.paid` with `billing_reason: subscription_cycle`.
- Inngest v4.6.0: `createFunction({ id, triggers: { event|cron } }, handler)` (triggers in config); runs on our own server.
- Browser: Playwright MCP local via `@mastra/mcp`; **SSRF allowlist + step/timeout caps + ephemeral profile**; page text is untrusted data.

## Hard rules
- User-data tRPC = `protectedProcedure` scoped to `ctx.session.user.id`. Never `publicProcedure` for user data.
- New env var → `packages/env/src/{server,web}.ts` zod + `.env`.
- `pnpm fix` before every commit. Run a task's **Verification gate** before claiming it done.
