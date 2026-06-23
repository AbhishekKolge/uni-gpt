"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@uni-gpt/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@uni-gpt/ui/components/form";
import { Input } from "@uni-gpt/ui/components/input";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z.object({
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
	const router = useRouter();
	const token = useSearchParams().get("token") ?? "";

	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: "" },
	});

	const onSubmit = async (value: ResetPasswordValues) => {
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
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Reset password</h1>
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>New password</FormLabel>
								<FormControl render={<Input type="password" {...field} />} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						className="w-full"
						disabled={form.formState.isSubmitting}
						type="submit"
					>
						{form.formState.isSubmitting ? "Resetting..." : "Reset password"}
					</Button>
				</form>
			</Form>
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
