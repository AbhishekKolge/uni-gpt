import { zodResolver } from "@hookform/resolvers/zod";
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from "@uni-gpt/auth/lib/password-strength";
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
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/generic/loader";
import { authClient } from "@/lib/auth-client";
import SocialAuthButtons from "../buttons/social-auth-buttons";
import PasswordInput from "../generic/password-input";

const signInSchema = z.object({
	email: z.email("Invalid email address"),
	password: z
		.string()
		.min(
			PASSWORD_MIN_LENGTH,
			`Password must be at least ${PASSWORD_MIN_LENGTH} characters`
		)
		.max(
			PASSWORD_MAX_LENGTH,
			`Password must be at most ${PASSWORD_MAX_LENGTH} characters`
		),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

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

	if (isPending) {
		return <Loader />;
	}

	const isSubmitting = form.formState.isSubmitting;

	return (
		<div className="mx-auto w-full max-w-md px-4 py-12">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Welcome back</CardTitle>
					<CardDescription>Sign in to continue to uni-gpt.</CardDescription>
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
												<PasswordInput
													autoComplete="current-password"
													{...field}
												/>
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
				</CardContent>
			</Card>
		</div>
	);
}
