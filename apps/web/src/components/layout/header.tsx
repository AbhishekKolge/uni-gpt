"use client";
import { cn } from "@uni-gpt/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "../account/user-menu";
import Brand from "./brand";
import { ModeToggle } from "./mode-toggle";

const links = [{ to: "/dashboard", label: "Dashboard" }] as const;

export default function Header() {
	const pathname = usePathname();

	return (
		<header className="flex items-center justify-between border-b px-4 py-2.5">
			<div className="flex items-center gap-6">
				<Brand href="/dashboard" />
				<nav className="flex gap-4 text-sm">
					{links.map(({ to, label }) => {
						const active = pathname === to || pathname.startsWith(`${to}/`);
						return (
							<Link
								aria-current={active ? "page" : undefined}
								className={cn(
									"rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
									active
										? "font-medium text-foreground"
										: "text-muted-foreground"
								)}
								href={to}
								key={to}
							>
								{label}
							</Link>
						);
					})}
				</nav>
			</div>
			<div className="flex items-center gap-2">
				<ModeToggle />
				<UserMenu />
			</div>
		</header>
	);
}
