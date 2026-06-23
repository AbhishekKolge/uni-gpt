/** zxcvbn returns an integer crack-difficulty score in [0, 4]. */
export const MIN_PASSWORD_SCORE = 2;

/** Minimum password length (matches better-auth's emailAndPassword default). */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Hard upper bound on password length. Bounds the cost of server-side hashing
 * (DoS guard — a multi-MB password must never reach the hasher) and the cost of
 * client-side zxcvbn estimation (which is super-linear). Mirrors better-auth's
 * `maxPasswordLength` default of 128 so the client and server agree.
 */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Pure submit-gate: a password passes only when its zxcvbn score meets the
 * minimum. Defensive against NaN/negative so a broken estimator never lets a
 * weak password through.
 */
export function passesStrengthGate(
	score: number,
	min: number = MIN_PASSWORD_SCORE
): boolean {
	if (!Number.isFinite(score) || score < 0) {
		return false;
	}
	return score >= min;
}
