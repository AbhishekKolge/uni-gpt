import { polarClient } from "@polar-sh/better-auth/client";
import { env } from "@uni-gpt/env/web";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// Browser: same-origin ("") so the Next rewrite proxies /api/auth to the
	// server and cookies stay first-party. SSR has no origin → use the absolute URL.
	baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_SERVER_URL : "",
	plugins: [polarClient()],
});
