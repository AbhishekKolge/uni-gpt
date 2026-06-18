import { passkeyClient } from "@better-auth/passkey/client";
import { ssoClient } from "@better-auth/sso/client";
import { polarClient } from "@polar-sh/better-auth/client";
import type { auth } from "@uni-gpt/auth";
import { env } from "@uni-gpt/env/web";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// Browser: same-origin ("") so the Next rewrite proxies /api/auth to the
	// server and cookies stay first-party. SSR has no origin → use the absolute URL.
	baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_SERVER_URL : "",
	plugins: [
		polarClient(),
		passkeyClient(),
		ssoClient(),
		// Types the additional User columns (credits/role land in later phases) into the session.
		inferAdditionalFields<typeof auth>(),
	],
});
