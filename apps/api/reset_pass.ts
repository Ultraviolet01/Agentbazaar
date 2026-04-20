import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash("password123", 12);
    const updated = await prisma.user.update({
        where: { email: 'meedex42@gmail.com' },
        data: { passwordHash: hash }
    });
    console.log(`Reset password for meedex42@gmail.com to 'password123'`);
}
main().catch(console.log).finally(() => prisma.$disconnect());
