"use client";

import "../index.css";

import ErrorState from "@/components/generic/error-state";

// global-error replaces the root layout when it throws, so it must render its
// own <html>/<body> and pull in the global stylesheet itself.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body className="min-h-svh antialiased">
				<ErrorState error={error} reset={reset} />
			</body>
		</html>
	);
}
