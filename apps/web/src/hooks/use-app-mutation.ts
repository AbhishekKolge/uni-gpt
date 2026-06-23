"use client";

import {
	type UseMutationOptions,
	type UseMutationResult,
	useMutation,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface AppMutationConfig {
	hideSuccessMessage?: boolean;
	successMessage?: string;
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
