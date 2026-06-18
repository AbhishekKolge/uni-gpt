# Folder structure & scoping (apps/web/src)

```
app/                    # Next routing ONLY — thin wrapper renders the module page
  login/page.tsx        # import LoginPage from "@/modules/auth/pages/login-page";
                        #   export default () => <LoginPage/>
  settings/security/page.tsx
modules/                # feature modules (may nest sub-modules)
  auth/
    components/         # grouped: loader/ sheet/ wrapper/ common/ + feature components
    hooks/              # use-*.ts, module-scoped
    pages/              # *-page.tsx, each rendered by an app/ route wrapper
    utils/              # query-keys.ts helpers.ts defaults.ts schemas.ts
    layout/             # module layout components
  settings/
    profile/            # sub-module — same internal shape, recursive
      components/ hooks/ pages/ utils/ layout/
# OUTERMOST shared scope — parallel to modules/
components/             # shared groups: loader/ sheet/ wrapper/ common/
hooks/                  # shared: use-app-mutation, use-disclosure, use-loading
utils/                  # shared: query-keys.ts helpers.ts defaults.ts schemas.ts
lib/                    # clients: trpc.ts, auth-client.ts
```

Shared `utils/*` and `components/*` files are created the moment something is hoisted into them — not pre-seeded empty. The tree shows *where* things land, not files to scaffold up front.

## The scoping rule, applied

**Rule:** start module-scoped → hoist to the nearest common parent when a sibling needs it → never import another module's internals.

### Example 1 — a `common/` button used by one module
`modules/auth` needs a small `AuthCard`. It is auth-only → lives at `modules/auth/components/common/auth-card.tsx`. Imported inside auth via `../components/common/auth-card`.

### Example 2 — a sibling now needs it
`modules/settings` also needs `AuthCard` (rename it `Card`). Two sibling modules share it → hoist to the nearest common parent, the outermost shared scope: `components/common/card.tsx`. Both modules import it via `@/components/common/card`. Neither module imports the other.

### Example 3 — a generic primitive
`loader.tsx` is a spinner with no feature logic → it belongs in the shared `components/` group from the start (`@/components/loader`), even if only one module uses it today. Generic primitives and the `loader/ sheet/ wrapper/ common/` groups are shared scope by nature.

### Example 4 — module-internal vs shared imports
Inside `modules/auth/pages/login-page.tsx`:
- module-internal → relative: `import SignInForm from "../components/sign-in-form"`
- shared → alias: `import Loader from "@/components/loader"`, `import { useAppMutation } from "@/hooks/use-app-mutation"`
- clients → alias: `import { authClient } from "@/lib/auth-client"`, `import { trpc } from "@/lib/trpc"`
