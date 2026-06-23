import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default async function RootPage() {
	// "/" is not a real screen — it dispatches by session. Resolving the
	// destination here (instead of always bouncing to /dashboard) keeps a
	// logged-out user off the gated (app) area, which would otherwise redirect
	// back to /login and flash an empty app shell on the way.
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	redirect(session?.user ? "/dashboard" : "/login");
}
