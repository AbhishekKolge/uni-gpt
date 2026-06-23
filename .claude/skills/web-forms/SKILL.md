---
name: web-forms
description: Use when building a data form in apps/web — collecting input, validating it, wiring fields, handling arrays/tags, or submitting to a mutation. Read it before writing a form so it uses react-hook-form + zodResolver against the shared schema, the ui Field components, and the module mutation hook.
---

# Web forms (react-hook-form + zod)

Data forms use **react-hook-form** + `zodResolver` against the **shared zod schema** (the same one the api validates with), the `@uni-gpt/ui` `Field` components, and a module mutation hook for submit. One form pattern everywhere. Forms live at `modules/<x>/components/forms/<name>-form.tsx` → [[web-folder-structure]].

> **Migrate-from:** uni-gpt's **auth** forms use `@tanstack/react-form` + `authClient` directly (sign-in/up/reset are not data mutations → keep those on `authClient`). **Data forms** target react-hook-form below; add `react-hook-form` + `@hookform/resolvers` to the catalog ([[monorepo-conventions]]) when you write the first one.

## The shape

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@uni-gpt/ui/components/button";
import { Field, FieldLabel, FieldError } from "@uni-gpt/ui/components/field";
import { Input } from "@uni-gpt/ui/components/input";
import { LoadingSwap } from "@uni-gpt/ui/components/loading-swap";
import { createChatSchema, type CreateChatDto } from "@uni-gpt/utils/chat/schema";
import { useCreateChat } from "../../hooks/use-create-chat";

export const CreateChatForm = ({ close }: { close: () => void }) => {
  const form = useForm<CreateChatDto>({
    resolver: zodResolver(createChatSchema),
    defaultValues: { title: "" },
  });
  const createChat = useCreateChat({ onSuccess: () => { close(); form.reset(); } });

  const onSubmit = (data: CreateChatDto) => createChat.mutate(data);

  return (
    <>
      <form id="create-chat-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input {...field} id="title" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </form>
      <Button form="create-chat-form" type="submit" disabled={createChat.isPending}>
        <LoadingSwap isLoading={createChat.isPending}>Create</LoadingSwap>
      </Button>
    </>
  );
};
```

## The conventions

- **Resolver against the shared schema.** `zodResolver(createChatSchema)` — the schema lives in `@uni-gpt/utils/<x>/schema` ([[shared-utils-structure]]), so the same rules validate on the server. Never redefine the schema in the component.
- **`Controller` per field.** Each field is a `Controller` rendering a ui `Field` with `data-invalid={fieldState.invalid}`, the input spread with `{...field}` + `aria-invalid`, and a `FieldError` shown only when invalid. `Field`/`FieldLabel`/`FieldError`/`FieldDescription` come from `@uni-gpt/ui` ([[ui-component-structure]]).
- **Submit = a mutation hook.** `onSubmit` calls the module's `useCreateX().mutate(data)` ([[web-data-fetching]]). The component passes `onSuccess` (close dialog, `form.reset()`); errors toast globally.
- **External submit button.** Give the `<form>` an `id` and put the submit `<Button form="<id>" type="submit">` outside it (e.g. in a dialog footer). Wrap the label in `<LoadingSwap isLoading={mutation.isPending}>` and disable while pending.

## Array / tag fields — `useFieldArray`

For a repeating field (tags, list items) whose UI shape differs from the wire shape, **extend the shared schema** for the form and map back on submit:

```tsx
// utils/schema.ts (web module) — UI-only shape: tags as objects for useFieldArray
export const extendedCreateChatSchema = createChatSchema.extend({
  tags: z.array(z.object({ name: chatTagSchema })).optional(),
});
```

```tsx
const { fields, append, remove } = useFieldArray({ control: form.control, name: "tags" });
const onSubmit = (data: ExtendedCreateChatDto) =>
  createChat.mutate({ ...data, tags: data.tags?.map((t) => t.name) ?? [] });
```

Keep the wire schema (`createChatSchema`) canonical in `@uni-gpt/utils`; the `.extend()` for UI-only shapes lives beside the form in the module's `utils/schema.ts`.

## Common mistakes

- **Re-declaring the schema** in the component instead of importing the shared one — server/client validation drift.
- **An inner submit button** instead of `form="<id>"` + external button — breaks dialog/sheet footers.
- **Per-field error toasts** — show inline `FieldError`; mutation errors toast globally.
- **Routing an auth form through react-hook-form + a mutation** — auth stays on `@tanstack/react-form` + `authClient` ([[auth-setup]]).
- **No `aria-invalid` / `FieldError`** — accessibility + Ultracite will flag it.
