"use client";

import ErrorState from "@/components/generic/error-state";

export default function AppError(props: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorState error={props.error} reset={props.reset} />;
}
