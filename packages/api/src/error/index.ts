import { type TRPCDefaultErrorShape, TRPCError } from "@trpc/server";
import { Prisma } from "@uni-gpt/db";
import { ZodError } from "zod";
import { handlePrismaError } from "./prisma-error";
import { handleZodError } from "./zod-error";

export const handleErrorShapes = ({
	shape,
	cause,
}: {
	shape: TRPCDefaultErrorShape;
	cause: TRPCError["cause"];
}) => {
	if (cause instanceof TRPCError) {
		return shape;
	}

	if (cause instanceof ZodError) {
		return handleZodError({
			shape,
			cause,
		});
	}

	if (
		cause instanceof Prisma.PrismaClientKnownRequestError ||
		cause instanceof Prisma.PrismaClientValidationError ||
		cause instanceof Prisma.PrismaClientInitializationError ||
		cause instanceof Prisma.PrismaClientRustPanicError
	) {
		return handlePrismaError({
			shape,
			cause,
		});
	}

	// LLM SDK errors (OpenRouter / OpenAI) get their own handler once the chat
	// feature lands — add error/llm-error.ts + a branch here then.

	if (cause instanceof Error) {
		return {
			...shape,
			data: {
				...shape.data,
				code: "INTERNAL_SERVER_ERROR",
			},
		};
	}

	return {
		...shape,
		message: "An unexpected error occurred",
		data: {
			...shape.data,
			code: "INTERNAL_SERVER_ERROR",
		},
	};
};
