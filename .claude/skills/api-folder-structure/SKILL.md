---
name: api-folder-structure
description: Use when adding, moving, or naming any file in packages/api — a tRPC procedure, router, controller, error handler, or feature module — or when deciding what each file's role is, where a new procedure/handler goes, where input schemas and DTO types live, and which import style to use. Read it before touching the api package so code lands in the right file. Folder/file roles only — not business logic or how to write a specific procedure.
---

# packages/api folder structure

Where every file lives in `packages/api/src`. This is the **target structure** uni-gpt's api migrates toward — a **thin tRPC transport package**: tRPC init + context + routers + controllers + a centralized error formatter. No HTTP server here (that's `apps/server`, which mounts `appRouter` + `createContext`). No React. **Input schemas, DTO types, and domain helpers live in `@uni-gpt/utils`, not here** → [[shared-utils-structure]].

Scope is folder/file roles only — *where* a procedure/handler goes and *what each file does*, not how to implement a procedure.

> **Migrate-from:** uni-gpt's api today is the early scaffold — `src/index.ts`, `src/context.ts`, and the root router at **`src/routers/index.ts`** (imported as `@uni-gpt/api/routers/index`). Target is the shape below: rename the root to **`src/router.ts`** (imported as `@uni-gpt/api/router`), and add `modules/` + `error/` as features land. Update `apps/server` to `import { appRouter } from "@uni-gpt/api/router"` when you do.

## The package at a glance

```
packages/api/
  package.json            # exports: "." -> src/index.ts, "./*" -> src/*.ts
  tsconfig.json
  src/
    index.ts              # tRPC root init — t, router, publicProcedure, protectedProcedure, errorFormatter
    context.ts            # createContext (per-request) + exported Context type
    router.ts             # appRouter — merges every feature router; exports AppRouter type
    error/                # centralized error-shape formatting
      index.ts            # handleErrorShapes — dispatch by error cause
      zod-error.ts        # one handler file per error SOURCE
      prisma-error.ts
      llm-error.ts        # the LLM SDK (OpenRouter / OpenAI)
    modules/              # one folder per domain
      chat/
        router.ts         # the feature's tRPC router (procedure -> input schema -> controller fn)
        controller.ts     # the feature's procedure handlers (named async fns)
```

## What each top-level file does

| File | Role |
|---|---|
| `index.ts` | tRPC root. `initTRPC.context<Context>().create({ errorFormatter, transformer })`. Exports the building blocks every module imports: `router`, `publicProcedure`, `protectedProcedure`. |
| `context.ts` | `createContext(opts)` — runs per request, resolves the session, returns `{ session }`. Exports `type Context`. Consumed by `apps/server`. |
| `router.ts` | `appRouter` — the **root router**. Merges feature routers (`chat: chatRouter`) plus any top-level procedures. Exports `type AppRouter` (the web client's contract). Server imports it as `@uni-gpt/api/router`. |

**`protectedProcedure` is defined in `index.ts`** as `t.procedure.use(session guard)` — throws `UNAUTHORIZED` when there is no session and narrows `ctx.session` to non-null. Anything touching user data is wired with `protectedProcedure`; only truly public procedures use `publicProcedure`.

## A feature module = two files

`src/modules/<feature>/` holds exactly two files. Split by responsibility:

| File | Role | Pattern |
|---|---|---|
| `router.ts` | Wires procedures: name → input schema → handler | `export const <feature>Router = router({ create: protectedProcedure.input(createChatSchema).mutation(create) })` |
| `controller.ts` | The handlers — named async fns | `export const create = async ({ ctx, input }: { ctx: Context; input: CreateChatDto }) => { ...; return { data, message } }` |

**Naming:** procedure key = camelCase verb-phrase (`createChat`, `getMessages`); the controller fn mirrors it exactly. The schema is `<key>Schema` (`createChatSchema`) and the inferred type is `<Key>Dto` (`CreateChatDto`), both exported from `@uni-gpt/utils`.

- **`router.ts` imports** the input schemas from `@uni-gpt/utils/<feature>/schema` and the handlers from `./controller`. **No logic** — only procedure → schema → handler wiring. `.query()` for reads, `.mutation()` for writes. A procedure with **no input** omits `.input()`: `getMessages: protectedProcedure.query(getMessages)`.
- **`controller.ts` handlers** take `{ ctx, input }`, hit the DB via `@uni-gpt/db`, pull DTO types/helpers from `@uni-gpt/utils/<feature>/{schema,helpers,types}`, and **return `{ data?, message }`** (the `message` is what the web success-toast surfaces). Throw `TRPCError` for business errors (e.g. `NOT_FOUND`).
- **Register the new feature router** in `src/router.ts` under its key — the key is the namespace the client calls (`trpc.chat.create`). Router keys and controller fn names mirror each other.

## The `error/` folder

Centralized error-shape formatting, wired once via `index.ts`'s `errorFormatter`.

- `error/index.ts` → `handleErrorShapes({ shape, cause })` dispatches on `cause instanceof X`: `TRPCError` passes through untouched, then Zod, Prisma, the LLM SDK, and a generic `Error` fallback. Order matters — most-specific first.
- One handler file **per error source** (`zod-error.ts`, `prisma-error.ts`, `llm-error.ts`). Each maps a raw error to `{ ...shape, message, data: { ...shape.data, code } }` using `http-status-codes` / Prisma codes.
- **Adding a new error source** (a new third-party SDK): create `error/<source>-error.ts` with a `handle<Source>Error` fn, then add an `instanceof` branch to the chain in `error/index.ts`. Don't inline error mapping in a controller.

## Where schemas and types live (cross-package)

The api package does **not** own input schemas or DTO types — they live in `@uni-gpt/utils/<domain>/` → [[shared-utils-structure]]:

| In `utils/src/<domain>/` | Holds | Imported by |
|---|---|---|
| `schema.ts` | zod input schemas + inferred DTO types (`CreateChatDto`) | `router.ts` (`.input()`), `controller.ts` (types), web forms |
| `const.ts` | shared constants | controllers, web |
| `helpers.ts` | pure domain logic | controllers, web |
| `types.ts` | shared domain types | controllers, web |

The **same zod schema** validates input on the server and resolves the form on the web. Each is a subpath export (`@uni-gpt/utils/chat/schema`). DB models come from `@uni-gpt/db` (prisma) → [[prisma-db-structure]].

## Import style

| From → to | Style | Example |
|---|---|---|
| Within api (siblings/parents) | **relative** | `import { protectedProcedure, router } from "../../index"` |
| api → controller | relative | `import { create, getAll } from "./controller"` |
| `Context` type into a controller | relative | `import type { Context } from "../../context"` |
| Schemas / DTO types | package subpath | `import { createChatSchema } from "@uni-gpt/utils/chat/schema"` |
| DB / prisma | package | `import prisma, { type Prisma } from "@uni-gpt/db"` |
| Auth (in `context.ts`) | package | `import { auth } from "@uni-gpt/auth"` |

The `exports` map (`"."` → `index.ts`, `"./*"` → `src/*.ts`) makes `@uni-gpt/api/context` and `@uni-gpt/api/router` importable by `apps/server`. The `"./*"` glob matches nested paths too, so a new `src/<file>.ts` is importable as `@uni-gpt/api/<file>` automatically.

## Quick reference — "where does X go?"

| I'm adding... | Put it in |
|---|---|
| A new procedure on an existing feature | `modules/<feature>/router.ts` (wiring) + `modules/<feature>/controller.ts` (handler) |
| A whole new domain | new `modules/<feature>/{router,controller}.ts`, then register in `src/router.ts` |
| The handler's logic | `modules/<feature>/controller.ts` — never in `router.ts` |
| An input schema / DTO type | `@uni-gpt/utils/<feature>/schema.ts` (NOT the api package) |
| A pure domain helper / shared type | `@uni-gpt/utils/<feature>/{helpers,types}.ts` |
| Mapping for a new error source | new `error/<source>-error.ts` + branch in `error/index.ts` |
| A change to auth/session shape | `context.ts` (+ `protectedProcedure` guard in `index.ts`) |
| A trivial top-level procedure (e.g. `healthCheck`) | inline in `src/router.ts` — one-liner handlers only; real logic becomes a feature module |

## Common mistakes

- **Logic in `router.ts`.** Routers only wire procedure → schema → handler. Logic lives in `controller.ts`.
- **Defining input schemas inside api.** They belong in `@uni-gpt/utils/<domain>/schema.ts` so web reuses them.
- **`publicProcedure` for user data.** User-scoped procedures use `protectedProcedure` + `ctx.session.user.id`.
- **Forgetting to register a new feature router** in `src/router.ts` — the procedures won't exist on `AppRouter`.
- **Inlining error mapping in a controller.** Add a handler in `error/` and dispatch from `error/index.ts`.
- **Returning bare data.** Controllers return `{ data?, message }` so the web layer has a `message` to surface.
