const { PrismaClient } = require('@agentbazaar/database');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'testreg' } },
    orderBy: { createdAt: 'desc' },
    select: {
      email: true,
      verificationToken: true,
      emailVerified: true
    }
  });
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
