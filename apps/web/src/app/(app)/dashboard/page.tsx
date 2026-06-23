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
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session?.user.name}</p>
			<Dashboard customerState={customerState} />
		</div>
	);
}
