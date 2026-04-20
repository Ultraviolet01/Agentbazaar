import { PrismaClient } from '@agentbazaar/database';

async function checkUser() {
  const prisma = new PrismaClient();
  try {
    const email = 'meedex42@gmail.com';
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: 'meedex42',
          mode: 'insensitive'
        }
      }
    });

    console.log('--- USERS MATCHING meedex42 ---');
    console.log(JSON.stringify(users.map((u: any) => ({ id: u.id, email: u.email, username: u.username, emailVerified: u.emailVerified })), null, 2));
  } catch (error) {
    console.error('--- Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
