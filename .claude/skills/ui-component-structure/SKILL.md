---
name: ui-component-structure
description: Use when adding, editing, or importing a component in the packages/ui design-system package — a primitive, a composite, the cn util, a hook, or theme tokens in uni-gpt. Read it before creating a ui component so its file location, exports, cn/cva/data-slot shape, and token usage match. Layout/conventions only — for visual design decisions use the ui-ux-pro-max skill.
---

# packages/ui structure (`@uni-gpt/ui`)

The shared design system: shadcn-style primitives over **Base UI** (`@base-ui/react`, not Radix), Tailwind v4, `cva` variants, and a `cn()` merge util. **No app logic, no data fetching, no providers** — components only. For *what to design / how it should look*, use the global `ui-ux-pro-max` skill; this skill is purely where files go and the component shape.

## Layout

```
packages/ui/src/
  components/*.tsx     # flat — primitives AND composites together
  lib/utils.ts         # cn() = clsx + tailwind-merge
  hooks/*.ts           # shared UI hooks
  styles/globals.css   # Tailwind v4 import + @theme tokens (oklch) + dark mode
```

## Exports — per-file, no barrel

`package.json` exports point at source per file:

```jsonc
"exports": {
  "./components/*": "./src/components/*.tsx",
  "./lib/*":        "./src/lib/*.ts",
  "./hooks/*":      "./src/hooks/*.ts",
  "./globals.css":  "./src/styles/globals.css",
  "./postcss.config": "./postcss.config.mjs"
}
```

Import the exact component: `import { Button } from "@uni-gpt/ui/components/button"`, `import { cn } from "@uni-gpt/ui/lib/utils"`, `import "@uni-gpt/ui/globals.css"`. A new `components/x.tsx` is importable as `@uni-gpt/ui/components/x` automatically — there is no barrel to update.

## Component shape

`cva` for variants, `cn()` to merge, a `data-slot` attribute for CSS targeting, `asChild` (via Base UI's render/Slot) for composition. No `forwardRef` boilerplate — components take `React.ComponentProps<...>` and spread:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@uni-gpt/ui/lib/utils";

const buttonVariants = cva("inline-flex items-center ...", {
  variants: { variant: { default: "...", destructive: "..." }, size: { default: "h-9", sm: "h-8" } },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({ className, variant, size, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
export { Button, buttonVariants };
```

- **`cn()` always** — last so caller `className` wins conflicts (tailwind-merge).
- **`data-slot="<name>"`** on the root — enables parent styling like `has-[[data-slot=input]:focus]`.
- **Primitives vs composites** live in the same flat `components/` dir. A composite (multi-part, e.g. a Field group or a search box) exports its sub-components as named exports from one file and may use hooks; a primitive is a single styled element.

## Adding a component

- Prefer the `shadcn` CLI to scaffold, then adapt to Base UI + the `cn`/`data-slot` shape above.
- Tokens (colors, radius, shadows) are CSS variables in `styles/globals.css` (`@theme`, oklch). Reference them via Tailwind classes (`bg-primary`, `text-muted-foreground`) — don't hardcode hex.
- Hand-written? Match an existing primitive's structure exactly.

## What does NOT go here

App logic, data fetching ([[web-data-fetching]]), context providers, zustand stores, page/layout components ([[web-folder-structure]]). Those live in `apps/web`. The ui package stays presentation-only.

## Common mistakes

- **A barrel `index.ts`** — exports are per-file.
- **Reaching for Radix** — this package is on Base UI (`@base-ui/react`).
- **Skipping `cn()` / `data-slot`** — breaks className overrides and CSS composition.
- **Hardcoded colors** instead of theme tokens.
- **Putting app state or fetching in a component** — wrong package.
