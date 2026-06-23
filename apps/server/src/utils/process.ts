import { disconnectDB } from "@uni-gpt/db";

export const shutdown = async () => {
	process.stdout.write("Disconnecting from database...\n");
	await disconnectDB();
	process.exit(0);
};
