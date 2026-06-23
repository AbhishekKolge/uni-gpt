---
name: app-layout-and-route-protection
description: Use when setting up route groups, an app shell/layout, redirecting unauthenticated users, gating a route or component on the session, or adding a protected vs public area in apps/web. Read it before wiring layouts or auth redirects so the route groups, AuthChecker, and shell components fit the pattern.
---

# App layout & route protection

Two route groups, each with a layout that wraps an `AuthChecker` (client-side redirect) around a shell. Public auth pages and gated app pages get different shells and opposite redirect rules.

> **Migrate-from:** uni-gpt today has flat routes (`app/dashboard`, `app/login`, …) and redirects ad-hoc inside form `onSuccess` (`router.push("/dashboard")`). Target is the route-group + `AuthChecker` shape below — move pages under `auth/` and `(protected)/`, add one `AuthChecker`, and drop the per-form redirects.

## Route groups

```
app/
  auth/                 # public auth area
    layout.tsx          # <AuthChecker><AuthLayout>{children}</AuthLayout></AuthChecker>
    login/page.tsx
    sign-up/page.tsx
  (protected)/          # gated app area (pathless group — no URL segment)
    layout.tsx          # <AuthChecker><ProtectedLayout>{children}</ProtectedLayout></AuthChecker>
    dashboard/page.tsx
    chat/[id]/page.tsx
```

Each group's `layout.tsx` is the same two-liner — `AuthChecker` (the gate) wrapping the group's shell:

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthChecker>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthChecker>
  );
}
```

→ route-group conventions: [[web-folder-structure]]

## AuthChecker — `components/layout/auth-checker.tsx`

One client component owns redirect policy. It reads the session, and on a settled session redirects in **both** directions: unauthenticated on a protected route → login; authenticated on an auth route → the app home. It renders a loader while pending **and** while a redirect is in flight (so protected content never flashes).

```tsx
"use client";
export const AuthChecker = ({ children }: { children: React.ReactNode }) => {
  const session = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isLoading = session.isPending;
  const isLoggedIn = !!session.data?.user;

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn && isProtected) router.replace("/auth/login");
    else if (isLoggedIn && isAuthRoute) router.replace("/dashboard");
  }, [isLoading, isLoggedIn, isAuthRoute, isProtected]);

  if (isLoading) return <Loading />;
  if ((!isLoggedIn && isProtected) || (isLoggedIn && isAuthRoute)) return <Loading />;
  return <>{children}</>;
};
```

- `PROTECTED_ROUTES` is a const array in `@/utils/const` (e.g. `["/dashboard", "/chat"]`).
- The post-login home (`/dashboard` here) is app-specific — pick uni-gpt's landing route.
- `authClient.useSession()` is the source of truth → [[auth-setup]].

## Shells

- **`ProtectedLayout`** (`components/layout/index.tsx`) — the app shell: a `grid-rows-[auto_auto_1fr]` of `Header` + an optional banner + `<section>{children}</section>`. Lives in shared `components/layout/`; `index.tsx` exports it.
- **`AuthLayout`** (`modules/auth/components/layout/index.tsx`) — the auth shell: `Header` + centered content. Lives in the auth module's `components/layout/`.

## Session-gated components

A component that needs the session reads it directly and degrades gracefully — return `null` when there's no session, a `Skeleton` while pending:

```tsx
const { data, isPending } = authClient.useSession();
if (!data?.session) return null;
if (isPending) return <Skeleton className="h-8 w-8 rounded-full" />;
```

This is how the header account menu, credit/usage banners, etc. avoid flashing or crashing before the session resolves.

## Common mistakes

- **Redirecting inside each form's `onSuccess`** instead of centralizing in `AuthChecker` — duplicated, drifting policy.
- **Not rendering a loader during the redirect** — protected content flashes for a frame before `router.replace`.
- **One-way redirect** — also send logged-in users off `/auth/*`, not just gate protected routes.
- **Putting `PROTECTED_ROUTES` logic in the layout** — keep the predicate in `AuthChecker` + the const list.
- **A server component calling `authClient.useSession()`** — the checker is `"use client"`.
