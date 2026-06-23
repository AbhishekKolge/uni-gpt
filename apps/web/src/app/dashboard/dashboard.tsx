"use client";
import { Button } from "@uni-gpt/ui/components/button";

import { authClient } from "@/lib/auth-client";

export default function Dashboard({
	customerState,
}: {
	customerState: ReturnType<typeof authClient.customer.state>;
}) {
	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	return (
		<>
			<p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
			{hasProSubscription ? (
				<Button onClick={async () => await authClient.customer.portal()}>
					Manage Subscription
				</Button>
			) : (
				<Button
					onClick={async () => await authClient.checkout({ slug: "pro" })}
				>
					Upgrade to Pro
				</Button>
			)}
		</>
	);
}
