"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@uni-gpt/ui/components/button";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/services/trpc";

export default function Dashboard({
	customerState,
}: {
	customerState: ReturnType<typeof authClient.customer.state>;
}) {
	const privateData = useQuery(trpc.privateData.queryOptions());

	const hasProSubscription =
		(customerState?.activeSubscriptions?.length ?? 0) > 0;

	return (
		<>
			<p>API: {privateData.data?.message}</p>
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
