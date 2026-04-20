require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'meedex42+testfinal@gmail.com';
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true, verificationToken: null }
  });
  console.log(`Successfully verified ${user.email}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
