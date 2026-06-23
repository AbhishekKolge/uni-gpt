import type { TRPCDefaultErrorShape } from "@trpc/server";
import type { ZodError } from "zod";

export function handleZodError({
	shape,
	cause,
}: {
	shape: TRPCDefaultErrorShape;
	cause: ZodError;
}) {
	const formattedIssues = cause.issues.map((issue) => ({
		path: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}));

	const messageSummary = formattedIssues
		.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message))
		.join(", ");

	return {
		...shape,
		message: `Validation failed: ${messageSummary}`,
		data: {
			...shape.data,
			code: "BAD_REQUEST",
		},
	};
}
