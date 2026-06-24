import { BrandHeader } from "@/components/layout/brand";
import Footer from "@/components/layout/footer";
import { ModeToggle } from "@/components/layout/mode-toggle";

export default function LegalLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-svh flex-col">
			<BrandHeader>
				<ModeToggle />
			</BrandHeader>
			<main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
				{children}
			</main>
			<Footer />
		</div>
	);
}
