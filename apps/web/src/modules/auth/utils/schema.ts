import { passwordSchema } from "@uni-gpt/auth/lib/password-schema";
import z from "zod";

import { MIN_NAME_LENGTH } from "./const";

export const signInSchema = z.object({
	email: z.email("Invalid email address"),
	password: passwordSchema,
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
	name: z
		.string()
		.min(
			MIN_NAME_LENGTH,
			`Name must be at least ${MIN_NAME_LENGTH} characters`
		),
	email: z.email("Invalid email address"),
	password: passwordSchema,
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
	email: z.email("Invalid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
	password: passwordSchema,
});
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
