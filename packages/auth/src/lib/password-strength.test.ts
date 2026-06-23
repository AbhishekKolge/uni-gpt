import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_SCORE, passesStrengthGate } from "./password-strength";

describe("passesStrengthGate", () => {
	it("rejects scores below the minimum", () => {
		expect(passesStrengthGate(0)).toBe(false);
		expect(passesStrengthGate(1)).toBe(false);
	});

	it("accepts scores at or above the minimum", () => {
		expect(passesStrengthGate(MIN_PASSWORD_SCORE)).toBe(true);
		expect(passesStrengthGate(4)).toBe(true);
	});

	it("honors a custom minimum", () => {
		expect(passesStrengthGate(3, 4)).toBe(false);
		expect(passesStrengthGate(4, 4)).toBe(true);
	});

	it("never passes on NaN or negative input", () => {
		expect(passesStrengthGate(Number.NaN)).toBe(false);
		expect(passesStrengthGate(-1)).toBe(false);
	});
});
