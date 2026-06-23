---
name: prisma-db-structure
description: Use when adding or editing a Prisma model, the schema files, the generated client, migrations, or pgvector setup in packages/db — or when deciding how to get a Prisma client, scope a model to a user, or run db commands in uni-gpt. Read it before touching the database layer so the model and client usage match conventions.
---

# packages/db structure (Prisma 7 + Postgres + pgvector)

The database package: a **multi-file Prisma schema**, a generated client, and a driver-adapter client factory. Postgres with the pgvector extension (for Mastra semantic recall in later phases). Prisma 7 — uses a **driver adapter**, not a connection URL on the datasource.

## Layout

```
packages/db/
  prisma.config.ts          # defineConfig — points at schema/ + migrations/, loads apps/server/.env
  prisma/
    schema/
      schema.prisma         # generator + datasource ONLY
      auth.prisma           # one topical file per domain
      <domain>.prisma       # e.g. chat.prisma, experiment.prisma
    migrations/
    sql/
      0001_enable_pgvector.sql
    generated/              # prisma-client output (gitignored, regenerated)
  src/
    index.ts                # createPrismaClient() + default singleton
```

## The client

Prisma 7 driver adapter (`@prisma/adapter-pg`). `src/index.ts` exposes a **factory** and a default singleton:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@uni-gpt/env/server";
import { PrismaClient } from "../prisma/generated/client";

export function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
```

- App code: `import prisma from "@uni-gpt/db"` (the singleton).
- A package that needs its own instance (e.g. `@uni-gpt/auth` builds its adapter): `import { createPrismaClient } from "@uni-gpt/db"`.
- Need the Prisma namespace for `where`/types: `import type { Prisma } from "@uni-gpt/db"` (re-export it if not already).

## Schema files

`schema.prisma` holds only the generator + datasource:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated"
  moduleFormat = "esm"
  runtime      = "nodejs"
}
datasource db { provider = "postgresql" }   // url comes from the adapter, not here
```

Each **domain gets its own file** (`auth.prisma`, `chat.prisma`, …). Adding a model = new topical file or an existing domain's file — never one giant schema.

## Model conventions

```prisma
model Chat {
  id        String   @id @default(uuid())
  title     String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("chat")
}
```

- `@@map("lowercase")` table name; `@id` (uni-gpt uses plain ids, no `@map("_id")`).
- **User data: a `userId` + relation with `onDelete: Cascade`** and `@@index([userId])`.
- Composite uniqueness via `@@unique([...])`; sorted indexes via `@@index([createdAt(sort: Desc)])`.
- Timestamps `@default(now())` / `@updatedAt`.

## Commands (run from root via Turborepo)

| Command | Does |
|---|---|
| `pnpm db:generate` | regenerate the client (also runs on `postinstall`) |
| `pnpm db:push` | push schema to DB (dev) |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:studio` | Prisma Studio |
| `pnpm -F @uni-gpt/db db:setup` | run `sql/0001_enable_pgvector.sql` — **enables pgvector** |

**After any schema edit: `pnpm db:generate && pnpm db:push`** (CLAUDE.md). `prisma.config.ts` loads env from `apps/server/.env`, so DB commands read the same `DATABASE_URL` as the server.

## pgvector

`sql/0001_enable_pgvector.sql` is `CREATE EXTENSION IF NOT EXISTS vector;`. Run `db:setup` **before** any Mastra PgVector / semantic-recall init, or vector index creation fails.

## Common mistakes

- **Putting a `url` on the datasource** — Prisma 7 here uses the `PrismaPg` adapter + `env.DATABASE_URL`.
- **One mega-schema file** — split per domain under `schema/`.
- **Editing schema without `db:generate`** — the generated client goes stale and types lie.
- **User model without `userId` + cascade** — orphaned rows and unscoped queries.
- **Committing `prisma/generated/`** — it's gitignored and regenerated.
