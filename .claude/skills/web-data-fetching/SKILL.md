---
name: web-data-fetching
description: Use when fetching or mutating data in apps/web — wiring a tRPC query or mutation, a data hook, toasts, cache invalidation, loading/error/empty states, or a filter store. Read it before writing a component that calls the API so it uses the shared trpc client, per-module data hooks, and the global-query-error-toast convention instead of ad-hoc fetching.
---

# Web data fetching

Transport is tRPC + TanStack Query. This is the **target** shape uni-gpt migrates toward. The client lives in `apps/web/src/services/trpc.ts`. **Query errors toast globally**; **mutations toast per-hook**. Feature components never call `trpc.*` directly — they call a module data hook.

> **Migrate-from:** uni-gpt today has `lib/trpc.ts` (with a global `MutationCache` error toast) + a shared `useAppMutation` wrapper + `useDisclosure`/`useLoading`. Target: move the client to `services/trpc.ts`, **drop the global `MutationCache` and `useAppMutation`**, and write per-module mutation hooks with inline `onSuccess`/`onError` (below). `useDisclosure`/`useLoading` stay as shared UI hooks.

## The client (`services/trpc.ts`)

```ts
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: { label: "retry", onClick: () => queryClient.invalidateQueries() },
      });
    },
  }),
  defaultOptions: { queries: { retry: 0 } },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({
    url: "/trpc",                                  // same-origin: Next rewrite proxies to the server (CLAUDE.md)
    fetch: (url, options) => fetch(url, { ...options, credentials: "include" }),
    transformer: superjson,
  })],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
```

- **Only `QueryCache.onError` is global** (query errors toast with a retry action). There is **no global `MutationCache`** — each mutation hook owns its `onError`.
- `url: "/trpc"` is same-origin (uni-gpt rewrites proxy to the server); `NEXT_PUBLIC_SERVER_URL` is only for SSR/Docker. `transformer: superjson` matches the server.
- Provided app-wide by `providers/index.tsx` (`QueryClientProvider` + `<Toaster />` + devtools).

## Query

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/services/trpc";

export const useChats = (input: ChatQueryDto) => useQuery(trpc.chat.getAll.queryOptions(input));
```

Keys are automatic (`trpc.chat.getAll.queryKey()`) — **never write a manual key factory**. Query errors already toast globally; don't re-handle.

## Mutation — a per-module hook

Each mutation is its own hook in `modules/<x>/hooks/use-<verb>-<x>.ts`, wrapping `trpc.x.mutationOptions` with inline toast + invalidation. Forward caller `opts` via **rest args** (TanStack Query v5 callbacks take 4 args):

```tsx
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient, trpc } from "@/services/trpc";

export const useCreateChat = (
  opts?: Parameters<typeof trpc.chat.create.mutationOptions>[0]
) =>
  useMutation(trpc.chat.create.mutationOptions({
    ...opts,
    onSuccess: (...args) => {
      toast.success("Chat created");
      queryClient.invalidateQueries({ queryKey: trpc.chat.getAll.queryKey() });
      opts?.onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.error(args[0].message);
      opts?.onError?.(...args);
    },
  }));
```

A consumer passes `onSuccess` (e.g. close a dialog, reset a form) and it runs after the hook's own success logic.

## Loading / error / empty / success — `renderMultiQuery`

Render the four states from query flags via a shared `renderMultiQuery([q1, q2], { LoadingStateView, ErrorStateView, EmptyStateView, SuccessStateView, isEmpty? })` helper in `@/hooks/render-multi-query`, with `firstErrorRefetch([queries])` for the error view's retry. It takes a tuple of queries and renders loading skeletons / `ErrorBlock` / `EmptyBlock` / success uniformly — no ad-hoc `isPending`/`isError` branching in components.

```tsx
{renderMultiQuery([chatsQuery], {
  LoadingStateView: <ChatListSkeleton />,
  EmptyStateView: <EmptyBlock title="No chats" />,
  ErrorStateView: (e) => <ErrorBlock message={e.message} handleRetry={firstErrorRefetch([chatsQuery])} />,
  SuccessStateView: ([data]) => <ChatList chats={data.data.chats} />,
})}
```

uni-gpt doesn't ship `renderMultiQuery` yet — add it to `@/hooks` when the first list view needs it.

## Filters / client state — zustand

Per-module filter state (search, page, sort) lives in a **zustand** store hook `modules/<x>/hooks/use-<x>-filters.ts`, with setters that reset `page` when a filter changes. Defaults live in the module's `utils/const.ts`. Disclosure/loading UI state uses the shared `@/hooks/use-disclosure` and `@/hooks/use-loading`.

## Auth flows are NOT tRPC

Sign-in/up/reset/passkey go through `authClient` (`@/lib/auth-client`) directly with manual toasts — not the data hooks above. → [[auth-setup]]

## Common mistakes

- **A global `MutationCache`** — mutations toast per-hook; only `QueryCache.onError` is global.
- **A shared mutation wrapper** (`useAppMutation`) — write a bespoke per-module hook so toast + invalidation live with the operation.
- **Manual tRPC key factories** — keys are generated (`queryKey()`).
- **Raw `trpc.*` in components** — wrap in a `modules/<x>/hooks/` data hook.
- **Hardcoded 3-arg `onSuccess`** — keep `(...args)` (v5 passes 4).
- **Ad-hoc loading/error branches** — use `renderMultiQuery`.
