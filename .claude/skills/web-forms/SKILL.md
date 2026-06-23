---
name: web-forms
description: Use when building a data form in apps/web — collecting input, validating it, wiring fields, handling arrays/tags, or submitting to a mutation or authClient. Read it before writing a form so it uses react-hook-form + zodResolver against a shared schema, the @uni-gpt/ui Form components, and the right submit path. One form pattern everywhere.
---

# Web forms (react-hook-form + zod)

**Every** form in `apps/web` — data forms AND auth forms — uses **react-hook-form** + `zodResolver`. The project moved OFF `@tanstack/react-form` (it is not installed). Forms validate against a **shared zod schema** (the same rules the server validates with), render with the `@uni-gpt/ui` `Form*` primitives, and submit via either a **module mutation hook** (data) or **`authClient`** (auth). Forms live at `modules/<x>/components/forms/<name>-form.tsx` → [[web-folder-structure]].

## The form primitives — `@uni-gpt/ui/components/form`

The ui package wraps react-hook-form's `Controller` with base-ui's `useRender`. Use these (NOT a `Field`/`FieldLabel` component — that doesn't exist):
`Form` (= `FormProvider`), `FormField` (= `Controller`), `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `FormDescription`.

`FormControl` takes a **`render` prop** (base-ui), into which you pass the input element with `{...field}` spread — `FormControl` injects `id` / `aria-describedby` / `aria-invalid` onto it for label + error wiring:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@uni-gpt/ui/components/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@uni-gpt/ui/components/form";
import { Input } from "@uni-gpt/ui/components/input";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

const schema = z.object({ title: z.string().min(1, "Required") });
type Values = z.infer<typeof schema>;

export default function CreateThingForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });

  const onSubmit = (data: Values) => { /* mutation hook OR authClient */ };
  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl render={<Input {...field} />} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <><Loader2Icon className="size-4 animate-spin" /> Saving…</> : "Save"}
        </Button>
      </form>
    </Form>
  );
}
```

## The conventions

- **Resolver against a shared schema — never re-declare it in the component.** The schema is the single source of truth so client + server validate identically. Put a schema both api + web need in the shared package per [[shared-utils-structure]] (today `@uni-gpt/utils` may not exist yet; until it does, a domain-owned package is the home — e.g. `passwordSchema` lives in `@uni-gpt/auth/lib/password-schema` and the sign-up/sign-in/reset forms all import it). Derive the form's value type with `z.infer<typeof schema>`.
- **`FormField` per field**, rendering a `FormItem` → `FormLabel` + `FormControl render={<Input {...field} />}` + `FormMessage`. `FormMessage` shows the field error automatically (no manual error text). For a custom input (e.g. a password field with a show/hide toggle) pass it to `render`: `render={<PasswordInput {...field} />}` — it must spread the injected props onto the real `<input>`.
- **Submit path depends on the form kind.**
  - **Data form** → a module mutation hook (`useCreateX().mutate(data)`, [[web-data-fetching]]); pass `onSuccess` to close/reset; mutation errors toast globally.
  - **Auth form** (sign-in/up/reset/forgot) → call **`authClient`** directly (`authClient.signUp.email(...)`, `authClient.requestPasswordReset(...)`), with `onSuccess`/`onError` toasts. Auth is not a tRPC mutation. → [[auth-setup]].
- **Loading feedback on submit.** Disable the submit button with `form.formState.isSubmitting` and show a spinner (`Loader2Icon animate-spin`) — never a dead button.
- **Async-import heavy validators** (e.g. a zxcvbn password meter) so they don't bloat the initial bundle; gate submit on a pure helper, not the heavy lib.

## Array / tag fields — `useFieldArray`

For a repeating field (tags, list items) whose UI shape differs from the wire shape, **extend the shared schema** for the form and map back on submit; keep the wire schema canonical and the `.extend()` for UI-only shapes beside the form in the module's `utils/schema.ts`:

```tsx
const formSchema = createThingSchema.extend({
  tags: z.array(z.object({ name: z.string().min(1) })).optional(),
});
const { fields, append, remove } = useFieldArray({ control: form.control, name: "tags" });
const onSubmit = (data: z.infer<typeof formSchema>) =>
  createThing.mutate({ ...data, tags: data.tags?.map((t) => t.name) ?? [] });
```

## Common mistakes

- **Re-declaring the schema** in the component instead of importing the shared one → server/client validation drift.
- **Reaching for `@tanstack/react-form`** — it is not installed; the project standard is react-hook-form. (Older skill text said auth stays on tanstack — that is no longer true.)
- **Manual error rendering** instead of `<FormMessage />`, or a missing `FormLabel` (placeholder-only) — accessibility + Ultracite will flag it.
- **A dead submit button** with no `isSubmitting` disable/spinner.
- **Spreading `{...field}` onto a wrapper that doesn't forward it to the real `<input>`** — breaks `id`/`aria-invalid` association.
