---
name: auth-setup
description: Use when working on authentication in uni-gpt — better-auth config, email/password, Google OAuth, passkeys, Polar billing, verification/reset/delete emails (Resend), the web auth client, session resolution, or protectedProcedure. Read it before touching auth so changes thread correctly across the auth package, the api context, the db models, env, and the web client.
---

# Authentication (better-auth + Resend + Google + passkey + Polar)

Auth spans five places: `@uni-gpt/auth` (config + email + payments), `@uni-gpt/db` (models), `@uni-gpt/api` (session → context → `protectedProcedure`), `@uni-gpt/env` (secrets), and `apps/web` (the client). Email is **Resend** (not nodemailer). Social login is **Google**. Billing is **Polar** (sandbox). Second factor / passwordless is **passkey**.

## `@uni-gpt/auth` layout

```
packages/auth/src/
  index.ts          # createAuth() factory + `auth` singleton — the betterAuth(...) config
  lib/email.ts      # Resend client + fire-and-forget send* helpers
  lib/payments.ts   # Polar SDK client (sandbox)
```

`createAuth()` builds the instance (its own `createPrismaClient()`), and `export const auth = createAuth()` is the singleton the server + api import.

## The config (`index.ts`)

`betterAuth({ ... })` with:
- `database: prismaAdapter(prisma, { provider: "postgresql" })`
- `trustedOrigins: [env.CORS_ORIGIN]`, `secret: env.BETTER_AUTH_SECRET`, `baseURL: env.BETTER_AUTH_URL`
- `emailAndPassword`: `enabled`, `requireEmailVerification`, `resetPasswordTokenExpiresIn`, `sendResetPassword` → Resend helper
- `emailVerification`: `sendOnSignUp`, `autoSignInAfterVerification`, `sendVerificationEmail` → Resend helper
- `socialProviders.google`: `clientId`/`clientSecret` from env
- `user.deleteUser`: **`enabled: true`** (the field that turns the flow on — without it the callbacks never fire) + `sendDeleteAccountVerification` (OAuth-only users have no password → confirm by emailed link) + `beforeDelete`/`afterDelete` stubs (Tombstone write lands in a later phase)
- `advanced.defaultCookieAttributes`: prod `sameSite: "none", secure: true`; dev `"lax"`, `httpOnly: true`
- `plugins`: `polar({ client: polarClient, createCustomerOnSignUp, enableCustomerPortal, use: [checkout({ products, successUrl: env.POLAR_SUCCESS_URL, authenticatedUsersOnly: true }), portal()] })`, `passkey({ rpID, rpName, origin })`

> ⚠️ The `checkout` product is a **placeholder** — `productId: "your-product-id"` (slug `"pro"`). Replace it with the real Polar product id before billing works.

## Email (`lib/email.ts`) — Resend, fire-and-forget

```ts
export const resend = new Resend(env.RESEND_API_KEY);

// Never block the auth response on email. Attach .catch (NOT the `void` operator,
// which the lint config forbids) so the rejection is handled.
function fireAndForget(promise: Promise<unknown>): void { promise.catch(() => undefined); }

export function sendVerificationEmail(args: { to: string; url: string }): void {
  fireAndForget(resend.emails.send({ from: env.RESEND_FROM, to: args.to, subject: "...", html: `...${args.url}...` }));
}
```

Helpers are `void`-returning and fire-and-forget; the better-auth callbacks (`sendResetPassword` etc.) are `async () => { sendX(...) }` returning `Promise<void>`. Three helpers: verification, reset-password, delete-account.

## DB models (`@uni-gpt/db` → `schema/auth.prisma`)

`User`, `Session`, `Account`, `Verification`, `Passkey` — the better-auth + passkey-plugin schema. Additional `User` columns added in later phases (credits/role) are typed into the web session via `inferAdditionalFields`. → [[prisma-db-structure]]

## Server side: session → context → protectedProcedure

`@uni-gpt/api/context.ts` resolves the session per request:

```ts
const session = await auth.api.getSession({ headers: fromNodeHeaders(opts.req.headers) });
return { session };
```

`protectedProcedure` (in `@uni-gpt/api/index.ts`) throws `UNAUTHORIZED` when `ctx.session` is null and narrows it to non-null. **All user-data procedures use `protectedProcedure` scoped to `ctx.session.user.id`.** → [[api-folder-structure]]. The auth handler is mounted at `/api/auth` **before** `express.json()` → [[express-server-setup]].

## Web client (`apps/web/src/lib/auth-client.ts`)

```ts
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_SERVER_URL : "",  // same-origin in browser
  plugins: [polarClient(), passkeyClient(), inferAdditionalFields<typeof auth>()],
});
```

Auth forms call `authClient` directly (sign-in/up/reset) — **not tRPC** — with manual toast handling. The client plugin list must mirror the server plugin list (polar, passkey). Same-origin `baseURL` in the browser lets the Next rewrite proxy `/api/auth` and keep cookies first-party.

## Env vars

`BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `POLAR_ACCESS_TOKEN`, `POLAR_SUCCESS_URL`, `PASSKEY_RP_ID`, `PASSKEY_RP_NAME`, `PASSKEY_ORIGIN` (note: `PASSKEY_ORIGIN`, not `PASSKEY_RP_ORIGIN`), `RESEND_API_KEY`, `RESEND_FROM`, `CORS_ORIGIN`, `APP_URL`. All in `@uni-gpt/env/server`; add new ones there + `.env` → [[monorepo-conventions]].

## Known gotcha

Polar `createCustomerOnSignUp: true` **500s on non-MX test emails** in sandbox — it blocks dev cookie e2e until billing is configured. Use a real-domain email, or temporarily disable the flag, when testing sign-up locally.

## Common mistakes

- **Using nodemailer** — uni-gpt uses Resend.
- **`void resend.emails.send(...)`** — lint forbids the `void` operator; use the `.catch(() => undefined)` fire-and-forget helper.
- **Blocking the auth callback on email** — keep `send*` fire-and-forget; auth must not await SMTP.
- **Web client plugins out of sync** with server plugins (polar/passkey).
- **`publicProcedure` for user data** — always `protectedProcedure` + `ctx.session.user.id`.
- **Mounting `express.json()` before `/api/auth`** — breaks the auth handler.
