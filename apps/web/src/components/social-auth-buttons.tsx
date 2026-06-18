"use client";

import { Button } from "@uni-gpt/ui/components/button";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function SocialAuthButtons() {
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
		</div>
	);
}
