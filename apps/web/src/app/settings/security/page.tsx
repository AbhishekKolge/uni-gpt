"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import SecuritySection from "@/components/security-section";
import { authClient } from "@/lib/auth-client";

export default function SecurityPage() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (!(isPending || session)) {
			router.push("/login");
		}
	}, [isPending, session, router]);

	if (isPending || !session) {
		return null;
	}
	return <SecuritySection />;
}
