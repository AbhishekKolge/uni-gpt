"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@uni-gpt/ui/components/button";
import { Input } from "@uni-gpt/ui/components/input";
import { Label } from "@uni-gpt/ui/components/label";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
	const router = useRouter();
	const token = useSearchParams().get("token") ?? "";

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			if (!token) {
				toast.error("Missing or invalid reset token.");
				return;
			}
			await authClient.resetPassword(
				{ newPassword: value.password, token },
				{
					onSuccess: () => {
						toast.success("Password reset. Please sign in.");
						router.push("/login");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Reset password</h1>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>New password</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								type="password"
								value={field.state.value}
							/>
							{field.state.meta.errors.map((error) => (
								<p className="text-red-500" key={error?.message}>
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>
				<form.Subscribe
					selector={(s) => ({
						canSubmit: s.canSubmit,
						isSubmitting: s.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							className="w-full"
							disabled={!canSubmit || isSubmitting}
							type="submit"
						>
							{isSubmitting ? "Resetting..." : "Reset password"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}
