# tRPC data conventions (apps/web)

Transport is tRPC + TanStack Query. Client lives in `@/lib/trpc` (`trpc`, `queryClient`). Both query and mutation **errors** are toasted globally from `lib/trpc.ts` (`QueryCache.onError` + `MutationCache.onError`) — the global handler is the tRPC analog of an axios response interceptor.

## Query
```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export const useHealth = () => useQuery(trpc.healthCheck.queryOptions());
```
- Keys are automatic: `trpc.healthCheck.queryKey()`. **Do not** write a manual query-key factory for tRPC.
- Errors already toast globally (with a retry action). Don't add per-query error toasts.

## Mutation
```tsx
"use client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { trpc } from "@/lib/trpc";

export const useUpdateProfile = () =>
	useAppMutation(trpc.settings.updateProfile.mutationOptions(), {
		successMessage: "Profile updated", // optional; falls back to data.message
	});
```
- Success toast = `config.successMessage ?? data.message`. Pass `{ hideSuccessMessage: true }` to suppress.
- Errors toast globally via `MutationCache` — the wrapper is success-only.
- A mutation that should toast on success should return `{ message, ...data }` from the procedure.

## `useAppMutation` source (`@/hooks/use-app-mutation.ts`)
```ts
"use client";

import {
	type UseMutationOptions,
	type UseMutationResult,
	useMutation,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface AppMutationConfig {
	successMessage?: string;
	hideSuccessMessage?: boolean;
}

export const useAppMutation = <
	TData = unknown,
	TError = Error,
	TVariables = void,
	TContext = unknown,
>(
	options: UseMutationOptions<TData, TError, TVariables, TContext>,
	config?: AppMutationConfig
): UseMutationResult<TData, TError, TVariables, TContext> =>
	useMutation<TData, TError, TVariables, TContext>({
		...options,
		onSuccess: (...args) => {
			const [data] = args;
			if (!config?.hideSuccessMessage) {
				const fallback =
					data && typeof data === "object" && "message" in data
						? String((data as { message?: unknown }).message ?? "")
						: "";
				const message = config?.successMessage ?? fallback;
				if (message) {
					toast.success(message);
				}
			}
			options.onSuccess?.(...args);
		},
	});
```
> `onSuccess: (...args)` + `options.onSuccess?.(...args)` is deliberate: TanStack Query v5 mutation callbacks take **4 args** (`data, variables, onMutateResult, context`). Rest-forwarding is version-proof; a hardcoded `(data, variables, context)` forward fails `check-types` with `TS2554: Expected 4 arguments, but got 3`.

## Invalidation
```ts
import { queryClient } from "@/lib/trpc";
import { trpc } from "@/lib/trpc";

await queryClient.invalidateQueries(trpc.settings.profile.pathFilter());
```
