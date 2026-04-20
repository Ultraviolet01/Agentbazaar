import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("USERS IN DB:");
    users.forEach(u => {
        console.log(`Email: ${u.email}, PasswordHash (${typeof u.passwordHash}): ${u.passwordHash ? u.passwordHash.substring(0, 20) + '...' : 'NULL'}`);
    });
}
main().catch(console.log).finally(() => prisma.$disconnect());
