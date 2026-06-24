import Link from "next/link";
import { Fragment } from "react";

const links = [
	{ href: "/terms", label: "Terms" },
	{ href: "/privacy", label: "Privacy" },
] as const;

/**
 * Slim footer for the public/auth shell — copyright + legal links, centered so
 * it reads the same under the narrow auth card and the wider legal pages. The
 * in-app shell intentionally omits a footer so the chat surface keeps full height.
 */
export default function Footer() {
	return (
		<footer className="border-t px-4 py-5">
			<nav className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
				<span>© {new Date().getFullYear()} uni-gpt</span>
				{links.map(({ href, label }) => (
					<Fragment key={href}>
						<span aria-hidden className="select-none text-border">
							•
						</span>
						<Link
							className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
							href={href}
						>
							{label}
						</Link>
					</Fragment>
				))}
			</nav>
		</footer>
	);
}
