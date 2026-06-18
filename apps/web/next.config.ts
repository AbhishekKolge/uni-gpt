import "@uni-gpt/env/web";
import type { NextConfig } from "next";

// Server-only base for the dev proxy. The browser talks to same-origin
// paths (/trpc, /api/auth); Next rewrites forward them to the Express server
// so auth cookies are first-party. In Docker set SERVER_INTERNAL_URL=http://server:3000.
const SERVER = process.env.SERVER_INTERNAL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	output: "standalone",
	async rewrites() {
		return [
			{ source: "/trpc/:path*", destination: `${SERVER}/trpc/:path*` },
			{ source: "/api/auth/:path*", destination: `${SERVER}/api/auth/:path*` },
		];
	},
};

export default nextConfig;
