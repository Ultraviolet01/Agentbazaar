import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.user.updateMany({
        where: { email: 'meedex42@gmail.com' },
        data: { emailVerified: true }
    });
    console.log(`Updated meedex42@gmail.com to verified: ${updated.count} record(s) changed.`);
}
main().catch(console.log).finally(() => prisma.$disconnect());
