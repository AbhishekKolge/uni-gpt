"use client";

import { Button } from "@uni-gpt/ui/components/button";
import Link from "next/link";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
	const { data: session } = authClient.useSession();

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
			<h1 className="mb-4 font-bold text-3xl">Check your email</h1>
			<p className="mb-6 text-muted-foreground">
				We sent a verification link to your inbox. Click it to activate your
				account.
			</p>
			{session?.user.email ? (
				<Button
					onClick={() => {
						authClient.sendVerificationEmail(
							{ email: session.user.email, callbackURL: "/dashboard" },
							{
								onSuccess: () => {
									toast.success("Verification email resent.");
								},
								onError: (error) => {
									toast.error(error.error.message || error.error.statusText);
								},
							}
						);
					}}
					variant="outline"
				>
					Resend verification email
				</Button>
			) : null}
			<p className="mt-6 text-sm">
				<Link className="text-indigo-600 hover:text-indigo-800" href="/login">
					Back to sign in
				</Link>
			</p>
		</div>
	);
}
