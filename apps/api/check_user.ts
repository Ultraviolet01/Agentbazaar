import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { email: 'meedex42@gmail.com' } });
    if (!user) {
        console.log("User meedex42 not found - THEY NEVER RE-REGISTERED!");
    } else {
        console.log("PASSWORD HASH IS: ->" + user.passwordHash + "<- length:", user.passwordHash?.length);
    }
}
main().catch(console.log).finally(() => prisma.$disconnect());
