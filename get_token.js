const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'test_end2end@example.com' }
  });
  if (user && user.verificationToken) {
    console.log(`http://localhost:3010/verify-email?token=${user.verificationToken}`);
  } else {
    console.log('No token found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
