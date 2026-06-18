# CLAUDE.md — uni-gpt

AI chat app (ChatGPT/Claude clone). Showcase project demonstrating full-stack + AI engineering. Built **phase-by-phase**; keep cost minimal; production-ready.

## Read these first
- **Master spec:** `docs/superpowers/specs/2026-06-18-uni-gpt-design.md` — architecture, data model, and **Appendix A** (pinned versions + API gotchas). Source of truth.
- **Plan:** `plan/README.md` → `plan/NN-*.md` (one phase per fresh session, in order).

## Stack
Monorepo (pnpm workspaces + Turborepo). **Web** Next.js 16 / React 19 (:3001) · **Server** Express 5 + tRPC (:3000) · Prisma 7 + Postgres (+pgvector) · better-auth · Polar (sandbox) · **Mastra v1 embedded** · OpenRouter (chat) + OpenAI (embeddings) · Resend · Inngest · Cloudflare R2.

## Commands
- Dev: `pnpm dev` (both) · `pnpm dev:web` · `pnpm dev:server`
- DB: `pnpm db:generate` · `pnpm db:push` · `pnpm db:studio` · `pnpm -F @uni-gpt/db db:setup` (enables pgvector)
- Quality: `pnpm fix` (format+lint — run before every commit) · `pnpm check-types` · `pnpm build`

## Conventions
- **pnpm only.** Shared dep versions live in `pnpm-workspace.yaml` `catalog:` (reference as `"dep": "catalog:"`).
- **Prisma** multi-file schema in `packages/db/prisma/schema/` (one topical file per domain). After edits: `pnpm db:generate && pnpm db:push`.
- **Env:** every new var → `packages/env/src/{server,web}.ts` zod schema **and** `.env`. Server fails fast on missing required vars.
- **Auth scoping:** all user-data tRPC = `protectedProcedure` scoped to `ctx.session.user.id`. **Never `publicProcedure` for user data** (the demo `todo` pattern is removed in Phase 00 — don't reintroduce it).
- **Types:** strict TS, no `any` (use `unknown`). Follow `AGENTS.md` (Ultracite). A PostToolUse hook auto-formats on Write/Edit.
- **Same-origin dev:** the browser talks to same-origin paths (`/trpc`, `/api/auth`, `/api/chat`) proxied to the server via Next rewrites (Phase 00). `NEXT_PUBLIC_SERVER_URL` is only for SSR/Docker (`http://server:3000`).

## 🔴 Supply-chain (MANDATORY)
- **Verify EVERY new package before installing.** Before any `pnpm add` / `npm i` / `pnpm dlx` / `npx` (or anything that adds or downloads a package), web-search the **exact** package name + version: confirm it is the real, widely-used package (not a typosquat), and check its source repo, publisher, release age, download counts, and any malware / supply-chain advisories or CVEs. **Do not install if unverified, freshly published, or suspicious.** A `PreToolUse` hook in `.claude/settings.json` pauses new-package installs for confirmation — treat that prompt as the cue to run this check, not a rubber stamp.
- Pin **exact** `@mastra/*` versions (no `^`/`~`). Use `@mastra/core@1.43.0` — **NEVER `1.42.1`** (compromised 2026-06-17 via `easy-day-js` postinstall dropper).
- After any install: `grep -c easy-day-js pnpm-lock.yaml` must print `0`. Keep `minimumReleaseAge: 1440` + `blockExoticSubdeps: true` in `pnpm-workspace.yaml`.

## Mastra v1 API (these break old tutorials)
`agent.stream()` (not `streamVNext`) · nested `memory: { thread, resource }` (not flat `threadId`) · `createTool` `execute` takes validated input as the **first positional arg** · `model` is a string id or AI-SDK instance · agents need an `id` · `mcp.listTools()`/`listToolsets()`. Full detail + snippets: spec **Appendix A.1**.

## Executing a phase
In a fresh session: *"Execute `plan/NN-<name>.md`. Read the master spec first. Use superpowers:executing-plans (or subagent-driven-development)."* Work task-by-task; stop at the **Verification gate**; don't start NN+1 until NN's gate passes.
