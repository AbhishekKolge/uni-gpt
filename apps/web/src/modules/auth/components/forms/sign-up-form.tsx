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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/generic/loader";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
	});

	const onSubmit = async (value: SignUpValues) => {
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

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Create Account</h1>

			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl render={<Input {...field} />} />
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
								<FormControl render={<Input type="email" {...field} />} />
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
						{form.formState.isSubmitting ? "Submitting..." : "Sign Up"}
					</Button>
				</form>
			</Form>

			<div className="mt-4 text-center">
				<Button
					className="text-indigo-600 hover:text-indigo-800"
					onClick={onSwitchToSignIn}
					variant="link"
				>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
