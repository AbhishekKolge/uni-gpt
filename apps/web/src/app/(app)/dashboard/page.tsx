import { headers } from "next/headers";

import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
	// Auth is already guaranteed by (app)/layout.tsx — this only reads the
	// session for display data (name) and the customer billing state.
	const headerList = await headers();
	const session = await authClient.getSession({
		fetchOptions: {
			headers: headerList,
			throw: true,
		},
	});

	const { data: customerState } = await authClient.customer.state({
		fetchOptions: {
			headers: headerList,
		},
	});

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
			<div className="space-y-1">
				<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground text-sm">
					Welcome back, {session?.user.name}.
				</p>
			</div>
			<Dashboard customerState={customerState} />
		</div>
	);
}
