import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@uni-gpt/env/server";

import { PrismaClient } from "../prisma/generated/client";

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});
	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

export const disconnectDB = async () => {
	await prisma.$disconnect();
};

export default prisma;
// Re-export the Prisma namespace (value + types) so the api error layer can run
// `cause instanceof Prisma.PrismaClientKnownRequestError`. This file holds real
// client setup, not a barrel — noBarrelFile is a false positive here.
// biome-ignore lint/performance/noBarrelFile: deliberate single namespace re-export
export { Prisma } from "../prisma/generated/client";
