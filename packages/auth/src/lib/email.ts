import { env } from "@uni-gpt/env/server";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);

const FROM = env.RESEND_FROM;

// Fire-and-forget: never block the auth response on SMTP (spec Appendix A.3).
// Attaching a `.catch` keeps the rejection handled without the `void` operator
// (forbidden by the lint config).
function fireAndForget(promise: Promise<unknown>): void {
	promise.catch(() => undefined);
}

export function sendVerificationEmail(args: { to: string; url: string }): void {
	fireAndForget(
		resend.emails.send({
			from: FROM,
			to: args.to,
			subject: "Verify your uni-gpt email",
			html: `<p>Confirm your email to finish creating your uni-gpt account.</p><p><a href="${args.url}">Verify email</a></p>`,
		})
	);
}

export function sendResetPasswordEmail(args: {
	to: string;
	url: string;
}): void {
	fireAndForget(
		resend.emails.send({
			from: FROM,
			to: args.to,
			subject: "Reset your uni-gpt password",
			html: `<p>We received a request to reset your password.</p><p><a href="${args.url}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
		})
	);
}

export function sendDeleteAccountEmail(args: {
	to: string;
	url: string;
}): void {
	fireAndForget(
		resend.emails.send({
			from: FROM,
			to: args.to,
			subject: "Confirm uni-gpt account deletion",
			html: `<p>Confirm you want to permanently delete your uni-gpt account. This cannot be undone.</p><p><a href="${args.url}">Delete my account</a></p>`,
		})
	);
}
