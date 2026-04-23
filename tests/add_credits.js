const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCredits() {
  try {
    const user = await prisma.user.update({
      where: { email: 'ultimate_tester@example.com' },
      data: { credits: { increment: 100 } }
    });
    console.log(`Added 100 credits to ${user.email}. New balance: ${user.credits}`);
  } catch (error) {
    console.error('Failed to add credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();
