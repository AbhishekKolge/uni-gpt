---
name: adding-a-feature
description: Use when building a new end-to-end feature (a new domain like chat, folders, sharing) in uni-gpt that spans the database, the API, and the web app — or when unsure what order to build the layers in and which files each layer needs. Read it before starting a feature so the slice threads correctly from Prisma model to web route.
---

# Adding a feature end-to-end (vertical slice)

How one feature ("X") threads through every layer of the monorepo, in order. Each step links the skill that owns that layer's detail. Build **back-to-front** — the data shape and contract first, the UI last — so each layer compiles against the one below it.

## The slice, in order

```
db model → shared schema → api router+controller → web module+hooks → app route
```

### 1. DB — the model
Add `packages/db/prisma/schema/<x>.prisma` with the model(s). Scope user data with a `userId` + relation and `onDelete: Cascade`. Then `pnpm db:generate && pnpm db:push`. → [[prisma-db-structure]]

### 2. Shared schema — the contract
Add `@uni-gpt/utils/<x>/schema.ts` (zod input schemas + `Dto` types) and `const.ts` (bounds). This schema is the single source consumed by both the api and the web form. → [[shared-utils-structure]]

### 3. API — the procedures
Add `packages/api/src/modules/<x>/router.ts` (wires procedure → schema → handler) and `controller.ts` (handlers returning `{ data?, message }`). **Register the new router** in `src/router.ts` under its key (`x: xRouter`). User-data procedures use `protectedProcedure` scoped to `ctx.session.user.id`. → [[api-folder-structure]]

### 4. Web — the feature module
Add `apps/web/src/modules/<x>/` with `components/` (grouped by kind), `hooks/` (data hooks), `pages/`, `utils/`. Data hooks wrap `trpc.x.*` query/mutation options. → [[web-folder-structure]] for layout, [[web-data-fetching]] for the query/mutation/toast patterns.

### 5. Route — the thin wrapper
Add `apps/web/src/app/<group>/<x>/page.tsx` that renders the module page (named export). Gated feature → `(protected)/`. → [[web-folder-structure]]

### 6. Verify
`pnpm check-types` then `pnpm build`. Add any new env var to `@uni-gpt/env` + `.env` ([[monorepo-conventions]]).

## The thread, concretely

| Layer | File(s) | Owns |
|---|---|---|
| db | `packages/db/prisma/schema/<x>.prisma` | persistence |
| utils | `@uni-gpt/utils/<x>/{schema,const,types}.ts` | the contract (zod + DTO) |
| api | `packages/api/src/modules/<x>/{router,controller}.ts` + register in `src/router.ts` | procedures |
| web | `apps/web/src/modules/<x>/{components,hooks,pages,utils}/` | UI + data hooks |
| route | `apps/web/src/app/<group>/<x>/page.tsx` | routing |

The **schema in step 2 is the seam**: `router.ts` calls `.input(createXSchema)`, the web form calls `zodResolver(createXSchema)`, both import `CreateXDto`. Get that right and the slice type-checks across packages.

## Auth scoping (non-negotiable)

All user-data procedures are `protectedProcedure` and filter by `ctx.session.user.id`. **Never `publicProcedure` for user data.** → [[auth-setup]]

## Common mistakes

- **Building UI first.** Without the model + schema + contract, the web layer has nothing typed to call. Go back-to-front.
- **Forgetting to register the router** in `src/router.ts` — the procedures won't exist on `AppRouter`.
- **Re-declaring the schema** in the form instead of importing the shared one — the two drift.
- **Skipping `db:generate`** after a schema edit — the Prisma client is stale.
- **A new env var not added to `@uni-gpt/env` + `.env`** — server fails fast at boot.
