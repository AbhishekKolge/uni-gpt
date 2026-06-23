import { cn } from "@uni-gpt/ui/lib/utils";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * App wordmark — a primary-tinted icon mark + "uni-gpt". Shared by the auth
 * shell header and the in-app nav header. Links home (which redirects to the
 * dashboard or login depending on session).
 */
export default function Brand({
	className,
	href = "/",
}: {
	className?: string;
	href?: ComponentProps<typeof Link>["href"];
}) {
	return (
		<Link
			aria-label="uni-gpt home"
			className={cn(
				"flex items-center gap-2 font-semibold text-lg tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
				className
			)}
			href={href}
		>
			<span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
				<SparklesIcon className="size-4" />
			</span>
			uni-gpt
		</Link>
	);
}

/** A header-row wrapper used above auth cards: Brand on the left, actions right. */
export function BrandHeader({ children }: { children?: React.ReactNode }) {
	return (
		<header className="flex items-center justify-between px-4 py-3 sm:px-6">
			<Brand />
			<div className="flex items-center gap-2">{children}</div>
		</header>
	);
}
