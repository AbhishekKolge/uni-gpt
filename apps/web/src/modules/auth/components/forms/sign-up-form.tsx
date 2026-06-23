import { zodResolver } from "@hookform/resolvers/zod";
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	passesStrengthGate,
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/generic/loader";
import { authClient } from "@/lib/auth-client";
import SocialAuthButtons from "../buttons/social-auth-buttons";
import PasswordInput from "../generic/password-input";
import PasswordStrengthMeter from "../generic/password-strength-meter";

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
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

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();
	const [pwScore, setPwScore] = useState(0);

	const form = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
	});

	const password = form.watch("password");

	const onSubmit = async (value: SignUpValues) => {
		// Stronger client gate than the zod min-length: block guessable passwords
		// before they reach the server (server still enforces its own policy).
		if (!passesStrengthGate(pwScore)) {
			toast.error("Please choose a stronger password.");
			return;
		}
		await authClient.signUp.email(
			{
				email: value.email,
				password: value.password,
				name: value.name,
			},
			{
				onSuccess: () => {
					// requireEmailVerification is on — the user must verify before using
					// the app, so hand off to the verify-email page (not the dashboard).
					router.push("/verify-email");
					toast.success("Account created. Check your email to verify.");
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
					<CardTitle className="text-2xl">Create your account</CardTitle>
					<CardDescription>
						Start chatting in seconds — free credits on sign-up.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Form {...form}>
						<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl
											render={<Input autoComplete="name" {...field} />}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>

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
										<FormLabel>Password</FormLabel>
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
										Creating account…
									</>
								) : (
									"Create account"
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
						Already have an account?{" "}
						<Button
							className="h-auto p-0"
							onClick={onSwitchToSignIn}
							variant="link"
						>
							Sign in
						</Button>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
