import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "@uni-gpt/api/context";
import { appRouter } from "@uni-gpt/api/router";
import { auth } from "@uni-gpt/auth";
import { env } from "@uni-gpt/env/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";

import { shutdown } from "./utils/process";

const app = express();

app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

// Raw-body handlers FIRST: better-auth and tRPC read the raw request body
// themselves, so no global express.json() may run before them (spec Appendix A).
app.all("/api/auth{/*path}", toNodeHandler(auth));
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// JSON parser ONLY for app routes added after this line (health, future
// webhooks/Inngest mount their own body handling).
app.use(express.json());

app.get("/", (_req, res) => {
	res.status(200).send("OK");
});

// Terminal error handler — returns clean JSON instead of an HTML stack trace.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	const message = err instanceof Error ? err.message : "Internal Server Error";
	res.status(500).json({ error: message });
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
