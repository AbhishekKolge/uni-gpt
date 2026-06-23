import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Header from "@/components/layout/header";
import { authClient } from "@/lib/auth-client";

export default async function AppLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="grid h-svh grid-rows-[auto_1fr]">
			<Header />
			{children}
		</div>
	);
}
