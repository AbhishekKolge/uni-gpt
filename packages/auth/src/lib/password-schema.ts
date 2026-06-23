import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-strength";

/**
 * Single source of truth for the password field's length validation, shared by
 * every auth form (sign-up, sign-in, reset) so the client and server agree.
 * Kept separate from `password-strength.ts` so the zxcvbn meter can import the
 * length constants without pulling in zod.
 */
export const passwordSchema = z
	.string()
	.min(
		PASSWORD_MIN_LENGTH,
		`Password must be at least ${PASSWORD_MIN_LENGTH} characters`
	)
	.max(
		PASSWORD_MAX_LENGTH,
		`Password must be at most ${PASSWORD_MAX_LENGTH} characters`
	);
