"use client";

import {
	MIN_PASSWORD_SCORE,
	PASSWORD_MAX_LENGTH,
	passesStrengthGate,
} from "@uni-gpt/auth/lib/password-strength";
import { cn } from "@uni-gpt/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

type Estimator = (password: string) => {
	score: number;
	feedback: { warning?: string | null; suggestions: string[] };
};

/**
 * zxcvbn dictionaries are heavy (~hundreds of KB), so they are dynamically
 * imported the first time a password exists — never at module load — so they
 * stay out of the initial bundle.
 */
async function loadEstimator(): Promise<Estimator> {
	// @zxcvbn-ts/core v4 API: instantiate a factory with the language packs, then
	// call `.check()` (the v3 `zxcvbn`/`zxcvbnOptions` named exports are gone —
	// verified against the installed dist/index.d.ts).
	const [{ ZxcvbnFactory }, common, en] = await Promise.all([
		import("@zxcvbn-ts/core"),
		import("@zxcvbn-ts/language-common"),
		import("@zxcvbn-ts/language-en"),
	]);
	const estimator = new ZxcvbnFactory({
		dictionary: { ...common.dictionary, ...en.dictionary },
		graphs: common.adjacencyGraphs,
		translations: en.translations,
	});
	return (password: string) => {
		const r = estimator.check(password);
		return { score: r.score, feedback: r.feedback };
	};
}

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;

function barColor(score: number): string {
	if (score >= 3) {
		return "bg-primary";
	}
	if (score === 2) {
		return "bg-chart-4";
	}
	return "bg-destructive";
}

export default function PasswordStrengthMeter({
	value,
	onScoreChange,
}: {
	value: string;
	onScoreChange?: (score: number) => void;
}) {
	const estimatorRef = useRef<Estimator | null>(null);
	const [ready, setReady] = useState(false);
	const [score, setScore] = useState(0);
	const [warning, setWarning] = useState<string | null>(null);

	useEffect(() => {
		if (estimatorRef.current || value.length === 0) {
			return;
		}
		let cancelled = false;
		loadEstimator()
			.then((est) => {
				if (cancelled) {
					return;
				}
				estimatorRef.current = est;
				setReady(true);
			})
			.catch(() => {
				// Dictionaries failed to load — leave the meter in its "checking"
				// state rather than crash; the server still enforces its policy.
			});
		return () => {
			cancelled = true;
		};
	}, [value]);

	useEffect(() => {
		if (!(ready && estimatorRef.current)) {
			return;
		}
		if (value.length === 0) {
			setScore(0);
			setWarning(null);
			onScoreChange?.(0);
			return;
		}
		// Cap the input zxcvbn evaluates — it is super-linear, so an over-long
		// paste must never run unbounded on the main thread.
		const { score: s, feedback } = estimatorRef.current(
			value.slice(0, PASSWORD_MAX_LENGTH)
		);
		setScore(s);
		setWarning(feedback.warning ?? null);
		onScoreChange?.(s);
	}, [ready, value, onScoreChange]);

	if (value.length === 0) {
		return null;
	}

	const ok = passesStrengthGate(score);
	const color = barColor(score);

	return (
		<div className="space-y-1.5">
			<div aria-hidden className="flex gap-1">
				{[0, 1, 2, 3].map((i) => (
					<span
						className={cn(
							"h-1 flex-1 rounded-full transition-colors duration-200",
							i < score ? color : "bg-border"
						)}
						key={i}
					/>
				))}
			</div>
			<p
				aria-live="polite"
				className="text-muted-foreground text-xs"
				role="status"
			>
				{ready ? (
					<>
						Password strength:{" "}
						<span className="font-medium text-foreground">{LABELS[score]}</span>
						{ok ? null : ` — aim for at least "${LABELS[MIN_PASSWORD_SCORE]}"`}
					</>
				) : (
					"Checking strength…"
				)}
			</p>
			{warning ? (
				<p className="text-muted-foreground text-xs">{warning}</p>
			) : null}
		</div>
	);
}
