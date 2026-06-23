import { Button } from "@uni-gpt/ui/components/button";

// Shared body for route-segment error boundaries (error.tsx / global-error.tsx).
// `reset` re-renders the failed segment; `error.message` gives the user a hint.
export default function ErrorState({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="space-y-1">
				<h2 className="font-semibold text-lg">Something went wrong</h2>
				<p className="text-muted-foreground text-sm">
					{error.message || "An unexpected error occurred."}
				</p>
			</div>
			<Button onClick={reset} variant="outline">
				Try again
			</Button>
		</div>
	);
}
