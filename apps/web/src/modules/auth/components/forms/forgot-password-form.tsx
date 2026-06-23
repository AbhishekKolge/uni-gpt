"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@uni-gpt/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@uni-gpt/ui/components/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@uni-gpt/ui/components/form";
import { Input } from "@uni-gpt/ui/components/input";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
	type ForgotPasswordValues,
	forgotPasswordSchema,
} from "../../utils/schema";

export default function ForgotPasswordForm() {
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

	const isSubmitting = form.formState.isSubmitting;

	return (
		<div className="mx-auto w-full max-w-md px-4 py-12">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Forgot password?</CardTitle>
					<CardDescription>
						Enter your email and we&apos;ll send you a reset link.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl
											render={
												<Input autoComplete="email" type="email" {...field} />
											}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button className="w-full" disabled={isSubmitting} type="submit">
								{isSubmitting ? (
									<>
										<Loader2Icon className="size-4 animate-spin" />
										Sending…
									</>
								) : (
									"Send reset link"
								)}
							</Button>
						</form>
					</Form>
					<Link
						className="flex items-center justify-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
						href="/login"
					>
						<ArrowLeftIcon className="size-4" />
						Back to sign in
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
