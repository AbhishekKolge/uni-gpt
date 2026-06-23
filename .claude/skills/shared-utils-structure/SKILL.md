---
name: shared-utils-structure
description: Use when adding a zod input schema, DTO type, domain constant, validation bound, or pure domain helper that BOTH the api package and the web app need — or when deciding where shared schemas/types/helpers live. Read it before writing a schema inline in a router or a form, so it lands in the shared package and gets reused on both sides.
---

# shared-utils package structure (`@uni-gpt/utils`)

The shared-domain layer: zod schemas, DTO types, constants, and pure helpers that **both** the server (`@uni-gpt/api` validation) and the browser (`apps/web` form resolvers) import. **One zod schema validates server input AND resolves the web form** — that is the whole point of putting it here instead of inline.

> **Status:** uni-gpt has no `@uni-gpt/utils` package yet — auth-form schemas currently sit inline in `apps/web/src/modules/auth/components/*`. Create the package (see [[monorepo-conventions]]) the first time a schema is needed on both sides, and migrate inline schemas into it.

## Layout

```
packages/utils/src/<domain>/
  schema.ts     # zod input schemas + inferred DTO types
  const.ts      # constants & validation bounds (UPPER_SNAKE)
  helpers.ts    # pure functions (no IO)
  types.ts      # shared domain types (type-only)
  regex.ts      # shared regex literals (optional)
```

`<domain>` mirrors the api module / web module name (`experiment`, `chat`, `auth`). Each **file is a subpath export** — `package.json` lists `"./experiment/schema"`, `"./experiment/const"`, etc. There is no barrel; consumers import the exact file:

```ts
import { createChatSchema, type CreateChatDto } from "@uni-gpt/utils/chat/schema";
import { MAX_CHAT_TITLE_LENGTH } from "@uni-gpt/utils/chat/const";
```

## The schema file

zod schema + an inferred DTO type per input. **Bounds and magic numbers live in `const.ts`**, imported into the schema — never inline literals:

```ts
import z from "zod";
import { MAX_TITLE_LENGTH, MIN_TITLE_LENGTH } from "./const";

export const createChatSchema = z.object({
  title: z.string().trim()
    .min(MIN_TITLE_LENGTH, `At least ${MIN_TITLE_LENGTH} characters`)
    .max(MAX_TITLE_LENGTH, `At most ${MAX_TITLE_LENGTH} characters`)
    .nonempty("Title is required"),
});
export type CreateChatDto = z.infer<typeof createChatSchema>;
```

Naming: schema `<verb><Domain>Schema`, type `<Verb><Domain>Dto`. Query schemas carry pagination defaults (`page`/`limit`/`sortBy`/`order`) via `.default()`.

## Who imports what

| Consumer | Imports | For |
|---|---|---|
| `@uni-gpt/api` router | the **schema** | `.input(createChatSchema)` ([[api-folder-structure]]) |
| `@uni-gpt/api` controller | the **DTO type** + helpers | typing `input`, domain logic |
| web form | the **schema** | `zodResolver(createChatSchema)` ([[web-data-fetching]]) |
| web + api | `const.ts`, `types.ts` | shared bounds / types |

## Rules

- **Never define a shared input schema inline** in a router or a form — it belongs here so the other side reuses it.
- **No IO in this package** — pure schemas/types/helpers only. DB access lives in api controllers; nodemailer/Resend lives in auth. (Domain math, formatting, validation = fine.)
- **Bounds in `const.ts`**, imported by both the schema and any UI that needs the limit (e.g. an input `maxLength`).
- Depends only on tiny libs (`zod`, `date-fns`, etc.) — no `@uni-gpt/db`, no React.

## Common mistakes

- Schema written inline in `router.ts` or a form component → extract to `utils/<domain>/schema.ts`.
- Magic numbers inline in the schema → move to `const.ts`.
- A barrel `index.ts` → use per-file subpath exports.
- Importing `@uni-gpt/db` or React here → wrong layer.
