import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		POLAR_ACCESS_TOKEN: z.string().min(1),
		POLAR_SUCCESS_URL: z.url(),
		CORS_ORIGIN: z.url(),
		APP_URL: z.url().default("http://localhost:3001"),
		RESEND_API_KEY: z.string().min(1),
		RESEND_FROM: z.string().min(1).default("uni-gpt <onboarding@resend.dev>"),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		PASSKEY_RP_ID: z.string().min(1).default("localhost"),
		PASSKEY_RP_NAME: z.string().min(1).default("uni-gpt"),
		PASSKEY_ORIGIN: z.url().default("http://localhost:3001"),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
