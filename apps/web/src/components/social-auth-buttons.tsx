"use client";

import { Button } from "@uni-gpt/ui/components/button";
import { Input } from "@uni-gpt/ui/components/input";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function SocialAuthButtons() {
	const [ssoEmail, setSsoEmail] = useState("");
	const [showSso, setShowSso] = useState(false);

	const google = () => {
		authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
	};

	const passkey = async () => {
		const res = await authClient.signIn.passkey();
		if (res?.error) {
			toast.error(res.error.message ?? "Passkey sign-in failed");
			return;
		}
		window.location.assign("/dashboard");
	};

	const sso = async () => {
		// First click reveals the work-email input; second submits the SSO flow.
		if (!showSso) {
			setShowSso(true);
			return;
		}
		if (!ssoEmail) {
			toast.error("Enter your work email to continue with SSO.");
			return;
		}
		await authClient.signIn.sso(
			{ email: ssoEmail, callbackURL: "/dashboard" },
			{
				onError: (error) => {
					toast.error(error.error.message || error.error.statusText);
				},
			}
		);
	};

	return (
		<div className="space-y-2">
			<Button
				className="w-full"
				onClick={google}
				type="button"
				variant="outline"
			>
				Continue with Google
			</Button>
			<Button
				className="w-full"
				onClick={passkey}
				type="button"
				variant="outline"
			>
				Sign in with a passkey
			</Button>
			{showSso ? (
				<Input
					onChange={(e) => setSsoEmail(e.target.value)}
					placeholder="you@company.com"
					type="email"
					value={ssoEmail}
				/>
			) : null}
			<Button className="w-full" onClick={sso} type="button" variant="outline">
				{showSso ? "Continue with SSO" : "Sign in with SSO"}
			</Button>
		</div>
	);
}
