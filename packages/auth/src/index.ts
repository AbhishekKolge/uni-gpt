import { checkout, polar, portal } from "@polar-sh/better-auth";
import { createPrismaClient } from "@uni-gpt/db";
import { env } from "@uni-gpt/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { sendResetPasswordEmail, sendVerificationEmail } from "./lib/email";
import { polarClient } from "./lib/payments";

export function createAuth() {
	const prisma = createPrismaClient();
	const isProd = env.NODE_ENV === "production";

	return betterAuth({
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),

		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			resetPasswordTokenExpiresIn: 3600, // 1 hour
			// biome-ignore lint/suspicious/useAwait: helpers are fire-and-forget; the callback must return Promise<void>.
			sendResetPassword: async ({ user, url }) => {
				// better-auth's `url` already routes the reset through /api/auth then to
				// our redirectTo; we send it verbatim. Web page reads ?token=… (Task 9).
				sendResetPasswordEmail({ to: user.email, url });
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
			// biome-ignore lint/suspicious/useAwait: helper is fire-and-forget; the callback must return Promise<void>.
			sendVerificationEmail: async ({ user, url }) => {
				sendVerificationEmail({ to: user.email, url });
			},
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: isProd ? "none" : "lax",
				secure: isProd,
				httpOnly: true,
			},
		},
		plugins: [
			polar({
				client: polarClient,
				createCustomerOnSignUp: true,
				enableCustomerPortal: true,
				use: [
					checkout({
						products: [
							{
								productId: "your-product-id",
								slug: "pro",
							},
						],
						successUrl: env.POLAR_SUCCESS_URL,
						authenticatedUsersOnly: true,
					}),
					portal(),
				],
			}),
		],
	});
}

export const auth = createAuth();
