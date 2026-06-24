"use client";

import { Button } from "@uni-gpt/ui/components/button";
import { ArrowLeftIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import AuthShell from "../components/generic/auth-shell";

export function VerifyEmailPage() {
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
		<AuthShell
			description="We sent a verification link to your inbox. Click it to activate your account."
			icon={<MailCheckIcon className="size-6" />}
			title="Check your email"
		>
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
		</AuthShell>
	);
}
