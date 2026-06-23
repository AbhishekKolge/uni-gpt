import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default async function GuestLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (session?.user) {
		redirect("/dashboard");
	}

	return <>{children}</>;
}
