import { Button } from "@uni-gpt/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@uni-gpt/ui/components/dropdown-menu";
import { Skeleton } from "@uni-gpt/ui/components/skeleton";
import { ChevronDownIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-28" />;
	}

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="outline">Sign In</Button>
			</Link>
		);
	}

	const initial = session.user.name?.charAt(0).toUpperCase() ?? "?";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button className="gap-2" variant="outline" />}
			>
				<span className="flex size-5 items-center justify-center rounded-full bg-primary/10 font-medium text-[0.7rem] text-primary">
					{initial}
				</span>
				<span className="max-w-32 truncate">{session.user.name}</span>
				<ChevronDownIcon className="size-4 text-muted-foreground" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56 bg-card">
				<DropdownMenuLabel className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground text-sm">
						{session.user.name}
					</span>
					<span className="truncate font-normal text-muted-foreground text-xs">
						{session.user.email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem render={<Link href="/settings/security" />}>
						<ShieldIcon />
						Security
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/login");
								},
							},
						});
					}}
					variant="destructive"
				>
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
