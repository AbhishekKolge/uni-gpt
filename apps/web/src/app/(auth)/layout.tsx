import { BrandHeader } from "@/components/layout/brand";
import { ModeToggle } from "@/components/layout/mode-toggle";

export default function AuthLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<BrandHeader>
				<ModeToggle />
			</BrandHeader>
			<main className="flex flex-1 items-center justify-center">
				{children}
			</main>
		</div>
	);
}
