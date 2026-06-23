import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import RegisterPage from "@/modules/auth/pages/register-page";

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

	return <RegisterPage />;
}
