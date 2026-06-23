"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@uni-gpt/auth/lib/password-schema";
import { passesStrengthGate } from "@uni-gpt/auth/lib/password-strength";
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
import { Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import PasswordInput from "../components/generic/password-input";
import PasswordStrengthMeter from "../components/generic/password-strength-meter";

const resetPasswordSchema = z.object({
	password: passwordSchema,
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
	const router = useRouter();
	const token = useSearchParams().get("token") ?? "";
	const [pwScore, setPwScore] = useState(0);

	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: "" },
	});

	const password = form.watch("password");

	const onSubmit = async (value: ResetPasswordValues) => {
		if (!token) {
			toast.error("Missing or invalid reset token.");
			return;
		}
		if (!passesStrengthGate(pwScore)) {
			toast.error("Please choose a stronger password.");
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

	const isSubmitting = form.formState.isSubmitting;

	return (
		<div className="mx-auto w-full max-w-md px-4 py-12">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Reset password</CardTitle>
					<CardDescription>
						Choose a new password for your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New password</FormLabel>
										<FormControl
											render={
												<PasswordInput autoComplete="new-password" {...field} />
											}
										/>
										<PasswordStrengthMeter
											onScoreChange={setPwScore}
											value={password ?? ""}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button className="w-full" disabled={isSubmitting} type="submit">
								{isSubmitting ? (
									<>
										<Loader2Icon className="size-4 animate-spin" />
										Resetting…
									</>
								) : (
									"Reset password"
								)}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
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
