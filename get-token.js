require('dotenv').config({ path: 'packages/database/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'testreg' } },
    orderBy: { createdAt: 'desc' },
  });
  if (user) {
    console.log('TOKEN_START:' + user.verificationToken + ':TOKEN_END');
  } else {
    console.log('User not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
