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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const forgotPasswordSchema = z.object({
	email: z.email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" },
	});

	const onSubmit = async (value: ForgotPasswordValues) => {
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
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Forgot password</h1>
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl render={<Input type="email" {...field} />} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						className="w-full"
						disabled={form.formState.isSubmitting}
						type="submit"
					>
						{form.formState.isSubmitting ? "Sending..." : "Send reset link"}
					</Button>
				</form>
			</Form>
			<p className="mt-4 text-center text-sm">
				<Link className="text-indigo-600 hover:text-indigo-800" href="/login">
					Back to sign in
				</Link>
			</p>
		</div>
	);
}
