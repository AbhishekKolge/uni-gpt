---
name: app-layout-and-route-protection
description: Use when setting up route groups, an app shell/layout, redirecting unauthenticated users, gating a route or component on the session, adding error/loading boundaries, or building a protected vs public area in apps/web. Read it before wiring layouts or auth redirects so the route groups, the server-side layout gate, the (guest) sub-group, shells, and boundaries fit the pattern.
---

# App layout & route protection

Gating happens in **route-group layout server components** — not a client `AuthChecker`. Each gated area's `layout.tsx` is an `async` server component that resolves the session and `redirect()`s before rendering. Because the check runs on the server before paint, protected content never flashes a loader.

> **Why server gate, not client AuthChecker:** the layout awaits `authClient.getSession({ headers })` server-side and redirects before any HTML ships — zero flash, and the redirect policy lives in one file per area (gated by *folder*, no `PROTECTED_ROUTES` pathname list to maintain). A client `AuthChecker` would flash a loader on every hard load while the browser re-fetches the session.

## Route groups

```
app/
  layout.tsx              # root: <html><body><Providers>
  page.tsx                # "/" → redirect("/dashboard") (bounces through the gate)
  global-error.tsx        # root error boundary (renders its own <html>/<body>)
  not-found.tsx           # 404
  (app)/                  # gated app area (pathless group — no URL segment)
    layout.tsx            # async server gate: no session → redirect("/login"); then app shell
    error.tsx
    loading.tsx
    dashboard/page.tsx
    settings/security/page.tsx
  (auth)/                 # public auth area
    layout.tsx            # auth shell only — NO gate (token/interstitial pages live here)
    error.tsx
    loading.tsx
    (guest)/              # guests-only sub-group (pathless — URLs stay /login, /register, …)
      layout.tsx          # async server gate: session → redirect("/dashboard")
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
    reset-password/page.tsx   # NOT gated — token in URL, user may be logged in elsewhere
    verify-email/page.tsx     # NOT gated — shown to a logged-in-but-unverified user
```

→ route-group conventions: [[web-folder-structure]]

## The gate — an async layout server component

The gated layout resolves the session on the server and redirects, then renders its shell. Web uses `authClient.getSession({ fetchOptions: { headers, throw } })` (the same-origin proxy to the API server) — **not** the API-package `auth.api.getSession`, which the web process can't import. → [[auth-setup]]

```tsx
// app/(app)/layout.tsx — require a session
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });
  if (!session?.user) redirect("/login");

  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      {children}
    </div>
  );
}
```

```tsx
// app/(auth)/(guest)/layout.tsx — bounce logged-in users away from guest-only pages
export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: { headers: await headers(), throw: true },
  });
  if (session?.user) redirect("/dashboard");
  return <>{children}</>;
}
```

**Why a `(guest)` sub-group, not a gate on the whole `(auth)` layout:** a blanket "logged-in → /dashboard" on `(auth)` would wrongly bounce a logged-in-but-unverified user off `verify-email`, and a logged-in user off the token-based `reset-password`. So only the pure guest pages (login / register / forgot-password) sit under `(guest)` with the redirect; `verify-email` and `reset-password` stay directly under `(auth)` (shell, no gate). The pathless group keeps URLs flat (`/login`, not `/guest/login`).

`/dashboard` is uni-gpt's post-login home — pick the app's landing route for other projects.

## Shells

- **App shell** — inlined in `(app)/layout.tsx`: `grid-rows-[auto_1fr]` of `Header` + `{children}`. `Header` (`components/layout/header.tsx`) is a client component (it renders the session-gated user menu).
- **Auth shell** — `(auth)/layout.tsx`: `BrandHeader` + `ModeToggle` over a centered `<main>`.

## Session-gated components

A component that needs the session reads it directly and degrades gracefully — a `Skeleton`/loader while pending, `null` (or a signed-out view) when there's no user:

```tsx
const { data: session, isPending } = authClient.useSession();
if (isPending) return <Skeleton className="h-8 w-8 rounded-full" />;
if (!session?.user) return null;
```

This is how the header account menu, credit/usage banners, etc. avoid flashing or crashing before the session resolves. Pages inside `(app)` don't re-gate — the layout already guaranteed a session; they call `useSession()` only to read display data.

## Error & loading boundaries

Every area gets the full Next set. → boundary file conventions: [[web-folder-structure]]

- **`error.tsx`** — `"use client"`, signature `{ error: Error & { digest?: string }; reset: () => void }`. The two segment boundaries (`(app)`, `(auth)`) are thin wrappers around the shared `components/generic/error-state.tsx` (renders `error.message` + a `reset` button). They render *inside* their group's layout, so the shell stays.
- **`global-error.tsx`** — `"use client"`; replaces the root layout when it throws, so it renders its **own** `<html>/<body>` and imports the global stylesheet (`import "../index.css"`) itself.
- **`not-found.tsx`** — root 404; a styled `next/link` via `buttonVariants(...)` back to `/dashboard`.
- **`loading.tsx`** — per group, renders `<Loader />` (`components/generic/loader.tsx`) as the Suspense fallback during the layout's server `getSession()` fetch.

## `useSearchParams` needs a Suspense boundary

A **client** component that reads `useSearchParams()` must be wrapped in `<Suspense>`, or Next bails the whole route to client rendering / errors at build. Only pages that read search params need this — e.g. `reset-password-page.tsx` wraps `ResetPasswordForm` (which reads `?token`) in `<Suspense>`; the other auth pages don't read params and need no wrapper.

## Common mistakes

- **Gating in a client `AuthChecker`** instead of the server layout — reintroduces the loader flash this pattern exists to avoid.
- **Blanket redirect on the whole `(auth)` group** — breaks `verify-email`/`reset-password`; gate guest-only pages via the `(guest)` sub-group.
- **Re-gating inside a page under `(app)`** (per-page `getSession` + redirect, or `isPending → <Loader/>` in a form) — the layout already owns it; pages/forms read the session only for data.
- **Importing `auth.api.getSession` in the web app** — that's the API package's server helper; web goes through `authClient.getSession({ headers })` (same-origin proxy).
- **`global-error.tsx` without its own `<html>/<body>` or stylesheet import** — it bypasses the root layout.
- **A client component reading `useSearchParams()` with no `<Suspense>`** — build-time de-opt.
- **Keeping `router.push` out of a form's `onSuccess`** — post-action navigation (e.g. after sign-in) is the form's job; that's *not* the gating the layout owns.
