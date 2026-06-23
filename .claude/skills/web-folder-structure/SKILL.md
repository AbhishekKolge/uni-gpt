---
name: web-folder-structure
description: Use when adding, moving, or naming any file under apps/web/src — a page, component, hook, util, form, module, or sub-module — or when deciding whether something is module-scoped vs shared, how to group components, and which import style (relative vs @/ alias) to use. Read it before creating a file in the web app so it lands in the right place. Folder layout only — not data-fetching or tRPC conventions.
---

# apps/web folder structure

Where every file lives in `apps/web/src`. One predictable shape per feature: **module-scoped by default, hoist when shared, never reach into another module's internals.** Scope is folder-structure only — it says nothing about *how* to fetch data, wire tRPC, or write hooks.

Honor `CLAUDE.md` + `AGENTS.md` (Ultracite/biome; a PostToolUse hook auto-formats). Files are **kebab-case**.

## The three layers

```
app/        Next routing ONLY. Thin wrappers — no real logic.
modules/    Feature code. Each feature owns its components/hooks/pages/utils.
<shared>    Cross-feature scope, parallel to modules/: components/ hooks/ utils/ lib/ services/ providers/
```

## Full tree

```
apps/web/src/
  app/                              # routing only
    layout.tsx                      # root layout
    favicon.ico
    auth/                           # route group (public)
      layout.tsx
      login/page.tsx                # thin wrapper -> modules/auth/pages/login
      sign-up/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
    (protected)/                    # route group (auth-gated)
      layout.tsx
      experiment/page.tsx           # -> modules/experiment/pages/experiment
      experiment/[id]/page.tsx      # -> modules/experiment/details/pages/experiment-details

  modules/                          # feature modules
    auth/
      components/                   # grouped by KIND
        forms/                      # login-form, sign-up-form, ...
        buttons/                    # auth-action-button
        alerts/                     # resend-email-verification-alert, ...
        layout/                     # header.tsx, index.tsx (AuthLayout)
      pages/                        # login.tsx, sign-up.tsx — named exports
      utils/                        # const.ts, schema.ts
    experiment/
      components/
        forms/ cards/ alerts/ dialogs/ common/
      hooks/                        # use-create-experiment, use-experiment-filters (zustand), ...
      pages/                        # experiment.tsx (named export Experiment)
      utils/                        # const.ts, schema.ts, helper.ts
      details/                      # SUB-MODULE — same shape, recursive
        types/                      # index.ts
        utils/                      # const.ts, helper.ts
        components/                 # cards/ charts/ common/ forms/
        hooks/                      # use-generate-response, use-response-filters
        pages/                      # experiment-details.tsx

  # shared scope — parallel to modules/, created on hoist (not pre-seeded empty)
  components/                       # shared, grouped by kind
    blocks/   alerts/   banners/   account/   layout/
  hooks/                            # shared cross-module hooks
  utils/                            # const.ts, helper.ts
  lib/                              # auth-client.ts (better-auth client)
  services/                         # trpc.ts (tRPC client + queryClient)
  providers/                        # index.tsx (app providers), theme-provider.tsx
```

## app/ — routing only

Each `page.tsx` is a **thin wrapper** that renders a module page. No logic lives here.

```tsx
// app/(protected)/experiment/page.tsx
import { Experiment } from "@/modules/experiment/pages/experiment";

export default function Page() {
  return <Experiment />;
}
```

- Module **pages are named exports** (`export const Experiment = ...`); the route file provides the `default` export.
- Forward Next route props (`params` / `searchParams`) here when the page needs them.
- **Route groups** (`auth/`, `(protected)/`) separate public vs gated areas, each with its own `layout.tsx`. `(protected)` is a pathless group — it sets a layout without adding a URL segment.
- **Picking the group for a new route:** authenticated feature → `(protected)/` (the catch-all gated group); auth flow → `auth/`; otherwise a top-level public segment. Only add a *new* group when a set of routes needs its own shared layout.

## modules/<feature>/ — the feature shape

A feature owns: `components/` `hooks/` `pages/` `utils/` (add `types/` for type-only files, `components/layout/` for the feature's own layout). A feature large enough to have its own routed detail view nests a **sub-module** (`experiment/details/`) with the *same recursive shape*.

**`components/` is grouped by kind, not dumped flat:**

| Group | Holds |
|---|---|
| `forms/` | form components (react-hook-form) |
| `cards/` | card components |
| `dialogs/` | dialogs / modals |
| `alerts/` | confirm/alert dialogs |
| `buttons/` | bespoke buttons |
| `charts/` | chart components |
| `common/` | feature-internal shared pieces (lists, wrappers) |
| `layout/` | the feature's header/shell (`index.tsx` exports the layout) |

Kinds are illustrative, not a closed list — a component that fits **no** named kind goes in `common/`. Shared `components/` uses the same kind-grouping (`blocks/` = empty/error state blocks, `banners/` = page banners, `account/` = account-menu widgets, `alerts/` = confirm dialogs).

**State stores are hooks.** A zustand store lives in `hooks/` as `use-<name>-filters.ts` (e.g. `use-experiment-filters`) — there is no separate `stores/` dir. Its default values live beside it in `utils/const.ts`. `providers/` is for React **context** providers only, not zustand.

**`utils/` splits by purpose:**

| File | Holds |
|---|---|
| `const.ts` | defaults, constants (e.g. `DEFAULT_EXPERIMENT_FILTERS`) |
| `schema.ts` | zod schemas + inferred DTO types (extend shared schemas here) |
| `helper.ts` | pure functions |
| `types/index.ts` | type-only declarations |

## Shared scope (parallel to modules/)

| Dir | Holds |
|---|---|
| `components/` | cross-feature components, same kind-grouping (`blocks/ alerts/ banners/ account/ layout/`); `layout/index.tsx` is the app shell |
| `hooks/` | cross-module hooks |
| `utils/` | cross-module `const.ts` / `helper.ts` |
| `lib/` | the auth client (`auth-client.ts`) |
| `services/` | the tRPC client (`trpc.ts`) |
| `providers/` | React context providers (`index.tsx` composes them; `theme-provider.tsx`) |

Shared files appear **the moment something hoists into them** — don't pre-create empty `utils/`/`components/` files. The tree shows *where* things land, not a scaffold to stub up front.

## The scoping rule

```
start module-scoped  →  a sibling needs it?  →  hoist to nearest common parent  →  reaches top? lands in shared scope
```

- **Never import another module's internals.** Two modules share something only by hoisting it to common scope. `modules/a` importing from `modules/b/...` is the smell to avoid.
- **Generic primitives start shared.** A spinner/`loader` with no feature logic belongs in shared `components/` from day one, even if one module uses it today.
- **Hoist the file, don't duplicate it.** When a sibling needs an existing module-scoped piece, move it up — don't copy.

## Import style

| From → to | Style | Example |
|---|---|---|
| Module-internal | **relative** | `import { ExperimentList } from "../components/common/experiment-list"` |
| Up one level inside module | relative | `import { useCreateExperiment } from "../../hooks/use-create-experiment"` |
| Route file → module page | **`@/` alias** | `import { Experiment } from "@/modules/experiment/pages/experiment"` |
| Shared scope | **`@/` alias** | `import { EmptyBlock } from "@/components/blocks/empty-block"` |
| Clients | `@/` alias | `import { trpc } from "@/services/trpc"`, `@/lib/auth-client` |
| UI package | package alias | `import { Button } from "@uni-gpt/ui/components/button"` |
| Shared domain const/schema | package alias | `import { ... } from "@uni-gpt/utils/chat/schema"` |

Rule of thumb: **inside the module → relative; crossing into shared/another package → alias.** A relative path that climbs out of the module (`../../../components`) is the signal it should be an `@/` import instead.

## Quick reference — "where does X go?"

| I'm adding... | Put it in |
|---|---|
| A new route | `app/<group>/<route>/page.tsx` — thin wrapper only |
| The page's actual UI | `modules/<feature>/pages/<name>.tsx` (named export) |
| A form for a feature | `modules/<feature>/components/forms/<name>-form.tsx` |
| A feature-only card/dialog/alert | `modules/<feature>/components/{cards,dialogs,alerts}/` |
| A feature hook | `modules/<feature>/hooks/use-<name>.ts` |
| Constants / zod schema / pure helper for a feature | `modules/<feature>/utils/{const,schema,helper}.ts` |
| A routed detail view of a feature | new sub-module `modules/<feature>/details/` (recursive shape) |
| A component two features both need | hoist to shared `components/<kind>/` |
| A hook two features both need | hoist to shared `hooks/` |
| A generic primitive (no feature logic) | shared `components/` from the start |

## Common mistakes

- **Logic in `app/page.tsx`.** It's a wrapper — push UI into `modules/.../pages`.
- **Default-exporting a module page.** Pages are **named** exports; the route file owns `default`.
- **Flat `components/` dump.** Group by kind (`forms/ cards/ ...`), even with few files.
- **Importing another module's internals.** Hoist to shared scope instead.
- **Pre-seeding empty shared dirs.** They appear on first hoist, not up front.
- **`../../../` climbing out of a module.** Use the `@/` alias for shared/cross-package.
