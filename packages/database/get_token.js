require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'test_end2end@example.com' }
  });
  if (user && user.verificationToken) {
    fs.writeFileSync('token.txt', `http://localhost:3010/verify-email?token=${user.verificationToken}`);
  } else {
    fs.writeFileSync('token.txt', 'No token found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
