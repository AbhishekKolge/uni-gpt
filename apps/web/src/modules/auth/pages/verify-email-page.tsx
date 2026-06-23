"use client";

import { Button } from "@uni-gpt/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@uni-gpt/ui/components/card";
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
	const { data: session } = authClient.useSession();
	const [resending, setResending] = useState(false);

	const resend = () => {
		if (!session?.user.email) {
			return;
		}
		setResending(true);
		authClient.sendVerificationEmail(
			{ email: session.user.email, callbackURL: "/dashboard" },
			{
				onSuccess: () => {
					toast.success("Verification email resent.");
					setResending(false);
				},
				onError: (error) => {
					toast.error(error.error.message || error.error.statusText);
					setResending(false);
				},
			}
		);
	};

	return (
		<div className="mx-auto w-full max-w-md px-4 py-12">
			<Card>
				<CardHeader className="items-center text-center">
					<span className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<MailCheckIcon className="size-6" />
					</span>
					<CardTitle className="text-2xl">Check your email</CardTitle>
					<CardDescription>
						We sent a verification link to your inbox. Click it to activate your
						account.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					{session?.user.email ? (
						<Button
							className="w-full"
							disabled={resending}
							onClick={resend}
							type="button"
							variant="outline"
						>
							{resending ? (
								<>
									<Loader2Icon className="size-4 animate-spin" />
									Resending…
								</>
							) : (
								"Resend verification email"
							)}
						</Button>
					) : null}
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
