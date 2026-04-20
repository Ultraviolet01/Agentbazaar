require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.AGENTBAZAAR_DB_URL;
  console.log('Testing connection to Supabase...');
  console.log('AGENTBAZAAR_DB_URL length:', url ? url.length : 'NOT SET');
  if (url) {
    console.log('First 20 chars:', url.substring(0, 20));
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Connection successful!');
    console.log('Raw query result:', result);
  } catch (error) {
    console.error('Connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
