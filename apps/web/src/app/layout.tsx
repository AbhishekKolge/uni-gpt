import type { Metadata } from "next";
import { Outfit } from "next/font/google";

import "../index.css";
import Providers from "@/providers";

const fontSans = Outfit({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "uni-gpt",
	description: "uni-gpt",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${fontSans.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
