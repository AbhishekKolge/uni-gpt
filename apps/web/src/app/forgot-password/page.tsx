"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@uni-gpt/ui/components/button";
import { Input } from "@uni-gpt/ui/components/input";
import { Label } from "@uni-gpt/ui/components/label";
import Link from "next/link";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset(
				{ email: value.email, redirectTo: "/reset-password" },
				{
					onSuccess: () => {
						toast.success("If that email exists, a reset link is on its way.");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({ email: z.email("Invalid email address") }),
		},
	});

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Forgot password</h1>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								type="email"
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
							{isSubmitting ? "Sending..." : "Send reset link"}
						</Button>
					)}
				</form.Subscribe>
			</form>
			<p className="mt-4 text-center text-sm">
				<Link className="text-indigo-600 hover:text-indigo-800" href="/login">
					Back to sign in
				</Link>
			</p>
		</div>
	);
}
