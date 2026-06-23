"use client";

import ErrorState from "@/components/generic/error-state";

export default function AuthError(props: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorState error={props.error} reset={props.reset} />;
}
