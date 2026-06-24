"use client";
import { Button } from "@uni-gpt/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@uni-gpt/ui/components/card";

import { authClient } from "@/lib/auth-client";

export default function Dashboard({
	customerState,
}: {
	customerState: ReturnType<typeof authClient.customer.state>;
}) {
	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Plan</CardTitle>
				<CardDescription>
					{hasProSubscription
						? "You're on the Pro plan."
						: "You're on the Free plan — upgrade for more credits."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{hasProSubscription ? (
					<Button onClick={async () => await authClient.customer.portal()}>
						Manage subscription
					</Button>
				) : (
					<Button
						onClick={async () => await authClient.checkout({ slug: "pro" })}
					>
						Upgrade to Pro
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
