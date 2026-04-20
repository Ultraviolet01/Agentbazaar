import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

async function main() {
    await prisma.user.deleteMany({
        where: { email: 'meedex42@gmail.com' }
    });
    console.log(`Deleted meedex42@gmail.com`);
}
main().catch(console.log).finally(() => prisma.$disconnect());
