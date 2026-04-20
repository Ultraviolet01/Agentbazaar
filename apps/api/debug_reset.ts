import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@agentbazaar/database";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = 'meedex42@gmail.com';
    const password = 'password123';
    
    console.log(`Hashing password: ${password}...`);
    const hash = await bcrypt.hash(password, 12);
    console.log(`NEW HASH: ${hash}`);

    console.log(`Updating user ${email} in DB...`);
    const updated = await prisma.user.update({
        where: { email },
        data: { 
            passwordHash: hash,
            emailVerified: true // Ensure they are verified too
        }
    });
    console.log(`Successfully updated user:`, updated.email);

    console.log(`Verifying hash in DB...`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`DB HASH:  ${user.passwordHash}`);
        const isMatch = await bcrypt.compare(password, user.passwordHash as string);
        console.log(`MATCH? ${isMatch}`);
    } else {
        console.log(`USER NOT FOUND AFTER UPDATE!`);
    }
}

main()
    .catch(e => {
        console.error("ERROR IN SCRIPT:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
