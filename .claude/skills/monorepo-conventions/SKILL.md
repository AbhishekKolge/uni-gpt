---
name: monorepo-conventions
description: Use when adding a new workspace package, wiring a dependency, adding an env var, setting up tsconfig/build for a package, or working with the pnpm catalog, Turborepo tasks, or the package exports map in uni-gpt. Read it before creating a package or touching root tooling so the new code matches how the monorepo is wired.
---

# uni-gpt monorepo conventions

pnpm workspaces + Turborepo. Apps in `apps/*` (`web`, `server`), libraries in `packages/*` (`api`, `auth`, `db`, `env`, `ui`, `config`). Internal packages are consumed **as TypeScript source** (no build step) via their `exports` map — only `apps/server` and `db` actually build.

## Dependency versions: the catalog

All shared dep versions live in **one place** — `pnpm-workspace.yaml` under `catalog:`. Packages reference them as `"dep": "catalog:"`, never a hardcoded version.

```jsonc
// package.json
"dependencies": { "zod": "catalog:", "better-auth": "catalog:" }
```

Bump a version → edit `catalog:` once. Cross-package internal deps use `"@uni-gpt/x": "workspace:*"`.

## Supply-chain guards (mandatory)

`pnpm-workspace.yaml` keeps `minimumReleaseAge: 1440` (refuse deps published < 1 day ago) and `blockExoticSubdeps: true`. **Verify every new package before installing** (real package, not a typosquat; check source/downloads/advisories). A `PreToolUse` hook pauses installs — treat it as the cue to run the check. See `CLAUDE.md` → Supply-chain for the full rule + the `@mastra/*` exact-pin requirement.

## A package's shape

Every internal package looks the same:

```
packages/<name>/
  package.json        # name "@uni-gpt/<name>", type module, exports map, "check-types": "tsc -b"
  tsconfig.json       # extends "@uni-gpt/config/tsconfig.base.json"
  src/
    index.ts
```

**The exports map** makes subpaths importable and points at **source**, not `dist`:

```jsonc
"exports": {
  ".":   { "default": "./src/index.ts" },
  "./*": { "default": "./src/*.ts" }
}
```

So a new top-level file `src/foo.ts` is importable as `@uni-gpt/<name>/foo` automatically. Two packages override this map:
- **`env`** — explicit `./server` + `./web` only.
- **`ui`** — `./components/*`, `./lib/*`, `./hooks/*`, `./globals.css`, `./postcss.config`.

## `@uni-gpt/config` — shared TS config

Holds nothing but `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: bundler`). Every package's `tsconfig.json` extends it and lists `@uni-gpt/config` as a devDependency. Don't redefine compiler options per package — extend the base.

## `@uni-gpt/env` — validated environment

t3-oss `createEnv`. `src/server.ts` (server vars, `@t3-oss/env-core`) and `src/web.ts` (client `NEXT_PUBLIC_*`, `@t3-oss/env-nextjs`), each a zod schema. **Every new env var → add to the right schema AND to `.env`** (CLAUDE.md). Import typed env via `@uni-gpt/env/server` or `@uni-gpt/env/web`; never read `process.env` directly in app code. Server fails fast on missing required vars; `SKIP_ENV_VALIDATION=1` bypasses (build only).

## Turborepo

`turbo.json` defines the task graph: `build` (`dependsOn: ["^build"]`), `check-types`, `dev`/`db:*` (`cache:false`, `persistent`). Run via root scripts: `pnpm dev` (all), `pnpm dev:web`, `pnpm dev:server`, `pnpm check-types`, `pnpm build`. DB scripts proxy to `@uni-gpt/db` (see [[prisma-db-structure]]).

## Quality / formatting

`biome.json` `extends: ["ultracite"]` (strict a11y + TS ruleset). A husky `pre-commit` hook runs `ultracite fix` on staged files; a PostToolUse hook auto-formats on Write/Edit. **Don't hand-fight the linter** — write to the ruleset (see `AGENTS.md`). Run `pnpm fix` before committing. Lint is auto-enforced, so it isn't a skill — it's a gate.

## Adding a new package — recipe

1. `packages/<name>/package.json`: `"name": "@uni-gpt/<name>"`, `"type": "module"`, the `exports` map above, `"scripts": { "check-types": "tsc -b" }`, devDeps `@uni-gpt/config` + `typescript: catalog:`.
2. `tsconfig.json`: `{ "extends": "@uni-gpt/config/tsconfig.base.json", ... }`.
3. `src/index.ts`.
4. Add deps as `catalog:` (external) or `workspace:*` (internal). New shared external dep → add to `catalog:` first.
5. Consumers import `@uni-gpt/<name>` — no build needed; it resolves to source.

## Common mistakes

- **Hardcoding a dep version** instead of `catalog:`.
- **Per-package compiler options** instead of extending `@uni-gpt/config`.
- **Reading `process.env` directly** — go through `@uni-gpt/env`, and add the var to the schema + `.env`.
- **Pointing `exports` at `dist`** — internal packages serve source.
- **Installing an unverified package** — run the supply-chain check; the install-pause hook is the cue, not a rubber stamp.
