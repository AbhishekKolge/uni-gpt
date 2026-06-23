---
name: typescript-conventions
description: Use when writing or reviewing any TypeScript in uni-gpt — typing component props, form values, API/client results, function returns, or shared shapes. Read it before adding types so they are inferred from a source of truth instead of hand-written or cast. Strict-TS + Ultracite conventions; complements the structural skills.
---

# TypeScript conventions

The repo is **strict** (`strict: true` + `noUncheckedIndexedAccess: true` in `packages/config` / `apps/web/tsconfig.json`) and **Ultracite/biome** lints on save (a PostToolUse hook auto-formats). The rule: **types are inferred from a source of truth, never hand-maintained or asserted.** No escape hatches.

## No escape hatches

- **No `any`** — use `unknown` and narrow. (Ultracite blocks `any`.)
- **No `as` type assertions** to paper over a shape — derive the real type instead (see below). Narrowing casts on genuinely-unknowable values are a last resort and need a comment.
- **No non-null `!`** — guard or `??`.
- **No `@ts-ignore` / `@ts-expect-error`** — fix the type. If a dependency's types are wrong, verify against its installed `.d.ts` first.
- **No `void` operator** — Ultracite bans it. For a deliberately-discarded promise use `.catch(() => undefined)` or `await`; never `void somePromise()`.

## Derive types from the source of truth

| You need a type for… | Derive it, don't write it |
|---|---|
| A form's values / a DTO | `z.infer<typeof schema>` — define the zod schema once (shared, per [[shared-utils-structure]] / [[web-forms]]) and infer both sides. |
| An API-client / async result | `Awaited<ReturnType<typeof fn>>`. Element of a list result: `NonNullable<Awaited<ReturnType<typeof authClient.listSessions>>["data"]>[number]`. Never hand-roll a `Session`/`Passkey` interface + cast. |
| Component props | `ComponentProps<"input">` (spread onto the real element), `ComponentProps<typeof Link>["href"]` (NOT a bare `string` — it breaks Next typed routes), `VariantProps<typeof buttonVariants>` for cva variants. → [[ui-component-structure]] |
| DB rows | the generated `Prisma` / model types from `@uni-gpt/db` (`import prisma from "@uni-gpt/db"`, `Prisma` namespace). → [[prisma-db-structure]] |
| Server output on the client | infer from `AppRouter` via the tRPC client — the chain is end-to-end typed; never re-type it. → [[web-data-fetching]] |

## Single source of truth for shared shapes

Don't duplicate a schema/constant across call sites. The password length rules live in `@uni-gpt/auth/lib/password-strength` (constants) + `@uni-gpt/auth/lib/password-schema` (`passwordSchema`); the sign-up/sign-in/reset forms all import the one schema rather than re-declaring `z.string().min().max()`. New shared shape → hoist it ([[shared-utils-structure]]).

## Components & literals

- **Function components, inferred returns.** `export default function X(props: Readonly<{...}>)`. No `React.FC`, no explicit `: JSX.Element`.
- **`Readonly<{...}>` for props** that are never mutated (layouts already do this for `children`).
- **`as const`** for literal tuples / lookup maps — especially under `noUncheckedIndexedAccess`, where `LABELS[i]` is otherwise `string | undefined`. A const tuple documents the fixed shape and narrows literals (`links` nav arrays, label sets, status maps).
- **`import type`** for type-only imports.

## noUncheckedIndexedAccess is on

Indexing an array/record yields `T | undefined`. Either guard it, use `.at()`, or make the source a literal tuple with `as const` so the compiler knows the bounds. Don't `!`-assert the `undefined` away.

## Before you reach for a type
If a third-party API's shape is unclear, read its installed `.d.ts` in `node_modules` and derive from the real exported types — don't guess a shape and cast to it. (This is how the auth pages type passkeys/sessions and how the password meter typed the `@zxcvbn-ts/core` v4 factory.)
