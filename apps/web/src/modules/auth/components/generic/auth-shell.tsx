import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@uni-gpt/ui/components/card";
import type { ReactNode } from "react";

/**
 * Shared shell for every auth screen (sign-in/up, forgot/reset, verify). Owns
 * the centered max-w-md container + Card + header so each form only supplies its
 * title, description, optional icon, and body — keeping all auth screens visually
 * identical.
 */
export default function AuthShell({
	title,
	description,
	icon,
	children,
}: {
	title: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="mx-auto w-full max-w-md px-4 py-12">
			<Card>
				<CardHeader className="text-center">
					{icon ? (
						<span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
							{icon}
						</span>
					) : null}
					<CardTitle className="text-2xl">{title}</CardTitle>
					{description ? (
						<CardDescription>{description}</CardDescription>
					) : null}
				</CardHeader>
				<CardContent className="space-y-4">{children}</CardContent>
			</Card>
		</div>
	);
}
