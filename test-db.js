const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection to Supabase...');
  try {
    const users = await prisma.user.findMany();
    console.log('Connection successful!');
    console.log('User count:', users.length);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
