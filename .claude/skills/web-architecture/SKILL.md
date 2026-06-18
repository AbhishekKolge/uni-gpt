---
name: web-architecture
description: Use when adding or editing anything under apps/web in uni-gpt — new features, pages, components, hooks, modules, forms, or tRPC data fetching. Covers the module folder structure (where files live and when to hoist them), thin Next route wrappers, the useAppMutation / useDisclosure / useLoading hooks, and the tRPC query/mutation + toast conventions. Read it before creating a component, page, hook, or wiring a query/mutation in the web app.
---

# uni-gpt web architecture (apps/web)

Frontend conventions. Transport is **tRPC + TanStack Query** (master spec is source of truth). One predictable shape per feature: module-scoped, hoist-on-share. Honor `CLAUDE.md` + `AGENTS.md` (Ultracite/biome; a PostToolUse hook auto-formats).

## Folder structure
- `app/` — Next routing **only**. Each `page.tsx` is a thin wrapper that renders a module page (see below).
- `modules/<feature>/` — owns the real code: `components/ hooks/ pages/ utils/ layout/`. Sub-modules nest with the same shape (`modules/settings/profile/...`).
- Outermost shared scope, **parallel to `modules/`**: `components/`, `hooks/`, `utils/`, `lib/` (clients live in `lib/`: `trpc.ts`, `auth-client.ts`).
- `components/` groups: `loader/ sheet/ wrapper/ common/` + feature components. The same groups can exist inside a module's `components/`.
- Full tree + worked examples → `references/folder-structure.md`.

## Scoping rule
Start everything **module-scoped**. When a sibling module needs the same thing, **hoist** it to the nearest common parent; if that reaches the top, it lands in the outermost shared scope. **Never import another module's internals** — share only by hoisting. Module-internal imports are **relative** (`../components/x`); shared/cross-scope use `@/components`, `@/hooks`, `@/lib`. Don't pre-create empty shared files — they appear the moment something hoists.

## Thin route wrapper (`app/<route>/page.tsx`)
```tsx
import LoginPage from "@/modules/auth/pages/login-page";

export default function Page() {
	return <LoginPage />;
}
```
Forward Next route props (`params` / `searchParams`) here when the module page needs them.

> 🔴 **Do NOT use `export { default } from "..."`** — biome `lint/performance/noBarrelFile` rejects it, and `import X; export default X` trips `lint/style/noExportedImports`. The wrapper component is the only lint-clean form for a thin route.

## tRPC data
- **Query:** `useQuery(trpc.x.queryOptions(input))`. Keys are automatic (`trpc.x.queryKey()`) — **no manual key factory for tRPC**. Query errors toast globally (`QueryCache` in `lib/trpc.ts`).
- **Mutation:** `useAppMutation(trpc.x.mutationOptions(), { successMessage? })`. Success toast = `config.successMessage ?? data.message`. Mutation errors toast globally (`MutationCache` in `lib/trpc.ts`) — so the wrapper is **success-only**.
- A mutation that should toast on success returns `{ message, ...data }`.
- **Invalidate:** `queryClient.invalidateQueries(trpc.x.pathFilter())`.
- Snippets → `references/trpc-data.md`.

## Shared hooks (`@/hooks`)
- `useAppMutation(options, config?)` — wraps a tRPC `mutationOptions()`, adds the success toast, forwards callbacks. Forward args via **rest** (`onSuccess: (...args) => { ... options.onSuccess?.(...args) }`) — TanStack Query v5 mutation callbacks take **4 args** (`data, variables, onMutateResult, context`); a hardcoded 3-arg forward fails type-check.
- `useDisclosure()` → `{ isOpen, onOpen, onClose, onToggle }`.
- `useLoading()` → `{ isLoading, startLoading, stopLoading }`.

## Axios / REST — escape hatch only
Only for genuine non-tRPC calls (R2 upload, third-party APIs). Then the pattern is a module `utils/query-keys.ts` factory + `convertToString` helper + a thin `useAppQuery` wrapper. **Build it only when a real non-tRPC call exists** — it is not pre-built. **Never** for tRPC procedures (tRPC infers types and generates keys).

## Auth = the reference module
`modules/auth/` is the worked example of all of the above. Note: auth forms use the **better-auth client** (`@/lib/auth-client`) + `@tanstack/react-form`, not tRPC — so they don't use `useAppMutation`. `useAppMutation`'s first real consumer is a future tRPC mutation.
