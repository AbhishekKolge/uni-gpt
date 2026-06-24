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
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { type SignInValues, signInSchema } from "../../utils/schema";
import SocialAuthButtons from "../buttons/social-auth-buttons";
import AuthShell from "../generic/auth-shell";
import PasswordInput from "../generic/password-input";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();

	const form = useForm<SignInValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (value: SignInValues) => {
		await authClient.signIn.email(
			{
				email: value.email,
				password: value.password,
			},
			{
				onSuccess: () => {
					router.push("/dashboard");
					toast.success("Sign in successful");
				},
				onError: (error) => {
					toast.error(error.error.message || error.error.statusText);
				},
			}
		);
	};

	const isSubmitting = form.formState.isSubmitting;

	return (
		<AuthShell
			description="Sign in to continue to uni-gpt."
			title="Welcome back"
		>
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

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel>Password</FormLabel>
									<Link
										className="text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
										href="/forgot-password"
									>
										Forgot password?
									</Link>
								</div>
								<FormControl
									render={
										<PasswordInput autoComplete="current-password" {...field} />
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
								Signing in…
							</>
						) : (
							"Sign in"
						)}
					</Button>
				</form>
			</Form>

			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				<span className="h-px flex-1 bg-border" />
				OR
				<span className="h-px flex-1 bg-border" />
			</div>

			<SocialAuthButtons />

			<p className="text-center text-muted-foreground text-sm">
				Need an account?{" "}
				<Button
					className="h-auto p-0"
					onClick={onSwitchToSignUp}
					variant="link"
				>
					Sign up
				</Button>
			</p>
		</AuthShell>
	);
}
