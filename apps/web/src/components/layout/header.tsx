"use client";
import Link from "next/link";
import UserMenu from "../account/user-menu";
import Brand from "./brand";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const links = [{ to: "/dashboard", label: "Dashboard" }] as const;

	return (
		<header className="flex items-center justify-between border-b px-4 py-2.5">
			<div className="flex items-center gap-6">
				<Brand href="/dashboard" />
				<nav className="flex gap-4 text-muted-foreground text-sm">
					{links.map(({ to, label }) => (
						<Link
							className="transition-colors hover:text-foreground"
							href={to}
							key={to}
						>
							{label}
						</Link>
					))}
				</nav>
			</div>
			<div className="flex items-center gap-2">
				<ModeToggle />
				<UserMenu />
			</div>
		</header>
	);
}
