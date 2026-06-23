/** zxcvbn returns an integer crack-difficulty score in [0, 4]. */
export const MIN_PASSWORD_SCORE = 2;

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
