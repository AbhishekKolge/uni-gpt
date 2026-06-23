import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { LoginPage } from "@/modules/auth/pages/login-page";

export default async function Page() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (session?.user) {
		redirect("/dashboard");
	}

	return <LoginPage />;
}
