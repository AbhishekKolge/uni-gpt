"use client";
import Link from "next/link";
import UserMenu from "../account/user-menu";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
	const links = [{ to: "/dashboard", label: "Dashboard" }] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => (
						<Link href={to} key={to}>
							{label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}
