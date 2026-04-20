require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, verificationToken: true, emailVerified: true }
  });
  fs.writeFileSync('C:/Users/USER/Downloads/Agentbazaar/users_dump.json', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
