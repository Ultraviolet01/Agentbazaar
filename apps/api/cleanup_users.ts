import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.user.deleteMany({
        where: { passwordHash: '' }
    });
    console.log(`Deleted ${deleted.count} corrupted users.`);
}
main().catch(console.log).finally(() => prisma.$disconnect());
