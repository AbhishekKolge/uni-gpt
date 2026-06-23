---
name: paginated-list
description: Use when building a searchable, sortable, paginated list of a resource (chats, messages, items) — the query schema, the controller query, the filter store, and the list UI. Read it before building a list view so all four layers (schema, controller, zustand filters, pagination UI) fit together.
---

# Paginated list (the cross-layer recipe)

A list view threads four layers: a **query schema** (utils), a **paginated controller** (api), a **zustand filter store** (web), and a **list component** (web) wiring filters → query → pagination. This skill is the recipe; each layer's detail lives in its own skill.

## 1. Query schema — `@uni-gpt/utils/<x>/schema.ts`

Page/limit/search/sort, all with `.default()` so the procedure has no required input. Bounds in `const.ts`. → [[shared-utils-structure]]

```ts
export const chatQuerySchema = z.object({
  page:   z.int().min(MIN_PAGE).default(DEFAULT_PAGE),
  limit:  z.int().min(MIN_LIMIT).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().max(MAX_SEARCH_LEN).optional(),
  sortBy: z.enum(["title", "createdAt"]).default("createdAt"),
  order:  z.enum(["asc", "desc"]).default("desc"),
});
export type ChatQueryDto = z.infer<typeof chatQuerySchema>;
```

## 2. Controller — `@uni-gpt/api/.../controller.ts`

Scope to the user, build `where` from filters, run a `$transaction([count, findMany])`, return the standard envelope. → [[api-folder-structure]]

```ts
export const getAll = async ({ ctx, input }: { ctx: Context; input: ChatQueryDto }) => {
  const { page, limit, search, sortBy, order } = input;
  const userId = ctx.session.user.id;
  const where: Prisma.ChatWhereInput = {
    userId,
    ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }] } : {}),
  };
  const [totalCount, chats] = await prisma.$transaction([
    prisma.chat.count({ where }),
    prisma.chat.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sortBy]: order } }),
  ]);
  return {
    data: { chats, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page },
    message: "Chats fetched successfully",
  };
};
```

**The return envelope is fixed:** `{ items, totalCount, totalPages, currentPage }` — the UI's `Pagination` reads exactly these.

## 3. Filter store — `modules/<x>/hooks/use-<x>-filters.ts`

A zustand store. **Every filter setter resets `page` to 1** (changing a filter must not strand you on page 5); `setPage` does not. Defaults in the module's `utils/const.ts`. → [[web-data-fetching]]

```ts
export const useChatFilters = create<ChatFilterState>()((set) => ({
  filters: DEFAULT_CHAT_FILTERS,
  setPage:   (page)   => set((s) => ({ filters: { ...s.filters, page } })),
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, page: DEFAULT_PAGE, search } })),
  setSortBy: (sortBy) => set((s) => ({ filters: { ...s.filters, sortBy } })),
  setOrder:  (order)  => set((s) => ({ filters: { ...s.filters, order } })),
  resetFilters: () => set(() => ({ filters: DEFAULT_CHAT_FILTERS })),
}));
```

For a nested list (responses under a chat), the store holds `Omit<ChatQueryDto, "parentId">` and the parent id is passed into the query separately.

## 4. List component — `modules/<x>/components/common/<x>-list.tsx`

Bind filter controls to the setters, feed `filters` to the query, render states with `renderMultiQuery`, drop a `Pagination` in both the loading and success views.

```tsx
const { filters, setPage, setSearch, setSortBy, setOrder } = useChatFilters();
const chatsQuery = useQuery(trpc.chat.getAll.queryOptions(filters));

return renderMultiQuery([chatsQuery], {
  LoadingStateView: <><ChatGridSkeleton /><Pagination isLoading onPageChange={setPage} {...zeroes} /></>,
  EmptyStateView: <EmptyBlock title="No chats" />,
  ErrorStateView: (e) => <ErrorBlock message={e.message} handleRetry={firstErrorRefetch([chatsQuery])} />,
  SuccessStateView: ([d]) => (
    <>
      <ChatGrid chats={d.data.chats} />
      <Pagination
        currentPage={d.data.currentPage} totalPages={d.data.totalPages}
        totalCount={d.data.totalCount} limit={filters.limit} onPageChange={setPage}
      />
    </>
  ),
});
```

`Search` (debounced), `MultiSelect`, `Pagination` are `@uni-gpt/ui` composites ([[ui-component-structure]]). uni-gpt ships only basic primitives today — add these composites (or scaffold via shadcn) when the first list needs them.

## Common mistakes

- **Filter setter that doesn't reset `page`** — change a filter on page 5, get an empty page.
- **A non-standard return envelope** — keep `{ items, totalCount, totalPages, currentPage }` so `Pagination` just works.
- **Unscoped `where`** — always start with `userId` ([[auth-setup]]).
- **`offset`/`take` math off-by-one** — `skip: (page - 1) * limit`.
- **Required input on the query** — defaults make the first call argument-light and the keys stable.
