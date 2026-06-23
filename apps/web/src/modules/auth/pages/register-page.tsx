"use client";

import { useRouter } from "next/navigation";

import SignUpForm from "../components/forms/sign-up-form";

export function RegisterPage() {
	const router = useRouter();
	return <SignUpForm onSwitchToSignIn={() => router.push("/login")} />;
}
