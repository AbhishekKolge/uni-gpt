import type { TRPCDefaultErrorShape } from "@trpc/server";
import { Prisma } from "@uni-gpt/db";

export const handlePrismaError = ({
	shape,
	cause,
}: {
	shape: TRPCDefaultErrorShape;
	cause:
		| Prisma.PrismaClientInitializationError
		| Prisma.PrismaClientKnownRequestError
		| Prisma.PrismaClientRustPanicError
		| Prisma.PrismaClientValidationError;
}) => {
	if (cause instanceof Prisma.PrismaClientKnownRequestError) {
		switch (cause.code) {
			case "P2002": {
				const fields = (cause.meta?.target as string[]) ?? [];
				return {
					...shape,
					message: `Record with ${fields.join(", ") || "field"} already exists`,
					data: {
						...shape.data,
						code: "CONFLICT",
					},
				};
			}
			case "P2025":
				return {
					...shape,
					message: "Record not found",
					data: {
						...shape.data,
						code: "NOT_FOUND",
					},
				};
			case "P2003":
				return {
					...shape,
					message: "Invalid reference. Related record does not exist.",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2004":
				return {
					...shape,
					message: "Database constraint violation",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2006":
				return {
					...shape,
					message: "Invalid value provided for field",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2011":
			case "P2012":
			case "P2013":
				return {
					...shape,
					message: "Missing required field or argument",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2014":
				return {
					...shape,
					message: "Invalid relation query",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2015":
			case "P2018":
				return {
					...shape,
					message: "Related record not found",
					data: {
						...shape.data,
						code: "NOT_FOUND",
					},
				};
			case "P2016":
			case "P2017":
			case "P2019":
			case "P2020":
				return {
					...shape,
					message: "Invalid query or data type",
					data: {
						...shape.data,
						code: "BAD_REQUEST",
					},
				};
			case "P2021":
			case "P2022":
			case "P2023":
				return {
					...shape,
					message: "Database schema mismatch",
					data: {
						...shape.data,
						code: "INTERNAL_SERVER_ERROR",
					},
				};
			case "P2024":
				return {
					...shape,
					message: "Database connection timeout",
					data: {
						...shape.data,
						code: "TIMEOUT",
					},
				};
			case "P2034":
				return {
					...shape,
					message: "Transaction conflict or deadlock",
					data: {
						...shape.data,
						code: "CONFLICT",
					},
				};
			default:
				return {
					...shape,
					message: `Unhandled Prisma error (${cause.code})`,
					data: {
						...shape.data,
						code: "INTERNAL_SERVER_ERROR",
					},
				};
		}
	}

	if (cause instanceof Prisma.PrismaClientValidationError) {
		return {
			...shape,
			message: "Invalid data sent to database",
			data: {
				...shape.data,
				code: "BAD_REQUEST",
			},
		};
	}

	if (cause instanceof Prisma.PrismaClientInitializationError) {
		return {
			...shape,
			message: "Failed to initialize database connection",
			data: {
				...shape.data,
				code: "INTERNAL_SERVER_ERROR",
			},
		};
	}

	if (cause instanceof Prisma.PrismaClientRustPanicError) {
		return {
			...shape,
			message: "Database engine crashed unexpectedly",
			data: {
				...shape.data,
				code: "INTERNAL_SERVER_ERROR",
			},
		};
	}

	return {
		...shape,
		message: "Unknown Prisma error",
		data: {
			...shape.data,
			code: "INTERNAL_SERVER_ERROR",
		},
	};
};
