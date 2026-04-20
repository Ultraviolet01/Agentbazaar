const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.env.AGENTBAZAAR_DB_URL;
  console.log('🔄 Connecting to Database for Credit Top-up...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    const result = await prisma.user.update({
      where: { email: 'ultravioletadewale@gmail.com' },
      data: {
        credits: {
          increment: 20
        }
      }
    });
    console.log(`✅ Successfully added 20 credits to ${result.email}. Now has ${result.credits}.`);
  } catch (error) {
    console.error('❌ Update failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
