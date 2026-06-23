import { buttonVariants } from "@uni-gpt/ui/components/button";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="space-y-1">
				<h1 className="font-semibold text-2xl">Page not found</h1>
				<p className="text-muted-foreground text-sm">
					The page you’re looking for doesn’t exist or has moved.
				</p>
			</div>
			<Link
				className={buttonVariants({ variant: "outline" })}
				href="/dashboard"
			>
				Back to app
			</Link>
		</div>
	);
}
